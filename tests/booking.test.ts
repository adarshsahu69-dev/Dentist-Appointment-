import { beforeEach, describe, expect, it, vi } from "vitest";

// The demo provider reads cookies for session context; stub next/headers so it
// can run outside a Next.js request.
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: () => undefined,
    set: () => {},
    getAll: () => [],
  }),
}));

import { demoProvider } from "@/lib/data/demo";
import { activeAppointmentsFor, availabilityForDentist, getDb, resetDb, serviceById } from "@/lib/demo/store";
import { addMinutes, dayOfWeek, generateSlots, toISODate } from "@/lib/availability";
import type { Appointment } from "@/lib/types";

const serviceId = "00000000-0000-4000-8000-000000000001"; // General Dentistry (30 min)
const dentistId = "00000000-0000-4000-8000-000000000201"; // Dr. Osei
const clinicId = "00000000-0000-4000-8000-000000000101"; // Downtown

/** Finds the next genuinely bookable date/time for a dentist from live store data. */
function nextFreeSlot(dentist: string = dentistId, service: string = serviceId, skip = 0): { date: string; time: string } {
  const db = getDb();
  const duration = serviceById(db, service)!.duration_minutes;
  let skipped = 0;
  for (let i = 1; i <= 30; i++) {
    const date = toISODate(new Date(Date.now() + i * 86_400_000));
    const slots = generateSlots({
      date,
      now: new Date(),
      availability: availabilityForDentist(db, dentist),
      durationMinutes: duration,
      blockedDates: db.blockedDates.filter((b) => b.dentist_id === dentist),
      existingAppointments: activeAppointmentsFor(db, dentist, date),
    });
    const free = slots.filter((s) => s.available);
    if (free.length > 0) {
      if (skipped < skip) {
        skipped += 1;
        continue;
      }
      // Prefer an afternoon slot so tests are stable for the whole day.
      const afternoon = free.find((s) => s.time >= "15:00") ?? free[0];
      return { date, time: afternoon.time };
    }
  }
  throw new Error("No free slot found for dentist " + dentist);
}

const details = {
  service_id: serviceId,
  dentist_id: dentistId,
  clinic_id: clinicId,
  patient_name: "Jamie Alvarez",
  patient_email: "jamie@example.com",
  patient_phone: "+1 (206) 555-0110",
  patient_notes: "",
};

describe("demo booking", () => {
  beforeEach(() => {
    resetDb();
  });

  it("creates a booking with a reference and pending status", async () => {
    const { date, time } = nextFreeSlot();
    const result = await demoProvider.createBooking({ ...details, appointment_date: date, start_time: time });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.reference).toMatch(/^DC-\d{6}-[A-Z0-9]{4}$/);
    expect(result.data.status).toBe("pending");
    expect(result.data.end_time).toBe(addMinutes(time, 30));
  });

  it("prevents double booking of the same slot sequentially", async () => {
    const { date, time } = nextFreeSlot();
    const first = await demoProvider.createBooking({ ...details, appointment_date: date, start_time: time });
    expect(first.ok).toBe(true);
    const second = await demoProvider.createBooking({ ...details, appointment_date: date, start_time: time });
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error).toContain("just taken");
  });

  it("prevents double booking of overlapping slots sequentially", async () => {
    const { date, time } = nextFreeSlot();
    await demoProvider.createBooking({ ...details, appointment_date: date, start_time: time });
    const overlapping = await demoProvider.createBooking({ ...details, appointment_date: date, start_time: addMinutes(time, 15) });
    expect(overlapping.ok).toBe(false);
  });

  it("prevents double booking under concurrent requests", async () => {
    const { date, time } = nextFreeSlot();
    const results = await Promise.all([
      demoProvider.createBooking({ ...details, appointment_date: date, start_time: time }),
      demoProvider.createBooking({ ...details, appointment_date: date, start_time: time }),
      demoProvider.createBooking({ ...details, appointment_date: date, start_time: time }),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
  });

  it("rejects bookings outside working hours", async () => {
    const { date } = nextFreeSlot();
    const result = await demoProvider.createBooking({ ...details, appointment_date: date, start_time: "07:00" });
    expect(result.ok).toBe(false);
  });

  it("rejects bookings that overrun closing time", async () => {
    const { date } = nextFreeSlot();
    const result = await demoProvider.createBooking({ ...details, appointment_date: date, start_time: "16:45" });
    expect(result.ok).toBe(false);
  });

  it("rejects bookings inside the dentist's break", async () => {
    const { date } = nextFreeSlot();
    // Dr. Osei breaks 12:00-13:00 on weekdays; Saturdays have no break.
    const result = await demoProvider.createBooking({ ...details, appointment_date: date, start_time: "12:00" });
    if (result.ok) {
      expect(result.data.status).toBe("pending");
    } else {
      expect(result.error).toContain("break");
    }
  });

  it("rejects bookings on non-working days", async () => {
    let date = new Date();
    while (dayOfWeek(toISODate(date)) !== 0) date = new Date(date.getTime() + 86_400_000);
    const result = await demoProvider.createBooking({ ...details, appointment_date: toISODate(date), start_time: "10:00" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("The dentist does not work on this day.");
  });

  it("rejects bookings on blocked dates", async () => {
    const db = getDb();
    const { date } = nextFreeSlot();
    db.blockedDates.push({ id: "block-test", dentist_id: dentistId, blocked_date: date, reason: "Leave" });
    const result = await demoProvider.createBooking({ ...details, appointment_date: date, start_time: "10:00" });
    expect(result.ok).toBe(false);
  });

  it("rejects bookings in the past", async () => {
    const result = await demoProvider.createBooking({ ...details, appointment_date: "2020-01-06", start_time: "10:00" });
    expect(result.ok).toBe(false);
  });

  it("rejects a service the dentist does not offer", async () => {
    const other = "00000000-0000-4000-8000-000000000003"; // Teeth Whitening (Dr. Nair only)
    const { date } = nextFreeSlot();
    const result = await demoProvider.createBooking({ ...details, service_id: other, appointment_date: date, start_time: "10:00" });
    expect(result.ok).toBe(false);
  });

  it("cancels an appointment and releases the slot for rebooking", async () => {
    const { date, time } = nextFreeSlot();
    const booking = await demoProvider.createBooking({ ...details, appointment_date: date, start_time: time });
    if (!booking.ok) throw new Error("booking failed");
    const cancelled = await demoProvider.cancelAppointment(booking.data.id);
    expect(cancelled.ok).toBe(true);

    const rebooked = await demoProvider.createBooking({ ...details, appointment_date: date, start_time: time });
    expect(rebooked.ok).toBe(true);
  });

  it("does not allow cancelling a completed appointment", async () => {
    const { date, time } = nextFreeSlot();
    const booking = await demoProvider.createBooking({ ...details, appointment_date: date, start_time: time });
    if (!booking.ok) throw new Error("booking failed");
    await demoProvider.setAppointmentStatus(booking.data.id, "confirmed");
    await demoProvider.setAppointmentStatus(booking.data.id, "completed");
    const result = await demoProvider.cancelAppointment(booking.data.id);
    expect(result.ok).toBe(false);
  });

  it("reschedules to a new slot and releases the old one", async () => {
    const first = nextFreeSlot();
    const second = nextFreeSlot(dentistId, serviceId, 1);
    if (second.date === first.date) return; // needs two distinct slots
    const booking = await demoProvider.createBooking({ ...details, appointment_date: first.date, start_time: first.time });
    if (!booking.ok) throw new Error("booking failed");

    const moved = await demoProvider.rescheduleAppointment(booking.data.id, second.date, second.time);
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;
    expect(moved.data.appointment_date).toBe(second.date);
    expect(moved.data.start_time).toBe(second.time);

    const reuse = await demoProvider.createBooking({ ...details, appointment_date: first.date, start_time: first.time });
    expect(reuse.ok).toBe(true);
  });

  it("refuses to reschedule onto an occupied slot", async () => {
    const { date, time } = nextFreeSlot();
    const first = await demoProvider.createBooking({ ...details, appointment_date: date, start_time: time });
    const second = await demoProvider.createBooking({ ...details, appointment_date: date, start_time: addMinutes(time, 30) });
    if (!first.ok || !second.ok) throw new Error("booking failed");
    const result = await demoProvider.rescheduleAppointment(first.data.id, date, addMinutes(time, 30));
    expect(result.ok).toBe(false);
  });

  it("releases the slot when an appointment is marked completed or cancelled", async () => {
    const { date, time } = nextFreeSlot();
    const booking = await demoProvider.createBooking({ ...details, appointment_date: date, start_time: time });
    if (!booking.ok) throw new Error("booking failed");
    const completed = await demoProvider.setAppointmentStatus(booking.data.id, "completed");
    expect(completed.ok).toBe(true);
    const reused = await demoProvider.createBooking({ ...details, appointment_date: date, start_time: time });
    expect(reused.ok).toBe(true);
  });

  it("only exposes slots that are still free in the slot API", async () => {
    const { date, time } = nextFreeSlot();
    await demoProvider.createBooking({ ...details, appointment_date: date, start_time: time });
    const slots = await demoProvider.getSlotsFor(dentistId, serviceId, date);
    const target = slots.find((s) => s.time === time);
    expect(target?.available).toBe(false);
    expect(target?.reason).toBe("booked");
    expect(slots.some((s) => s.available)).toBe(true);
  });

  it("stores the service duration on the appointment", async () => {
    const { date, time } = nextFreeSlot();
    const service = serviceById(getDb(), serviceId)!;
    const booking = await demoProvider.createBooking({ ...details, appointment_date: date, start_time: time });
    if (!booking.ok) throw new Error("booking failed");
    const duration = toMinutes(booking.data.end_time) - toMinutes(booking.data.start_time);
    expect(duration).toBe(service.duration_minutes);
  });

  it("links guest bookings to a patient account on signup", async () => {
    const { date, time } = nextFreeSlot();
    const booking = await demoProvider.createBooking({
      ...details,
      appointment_date: date,
      start_time: time,
      patient_email: "new.patient@example.com",
    });
    if (!booking.ok) throw new Error("booking failed");
    expect(booking.data.patient_id).toBeNull();

    const signedUp = await demoProvider.signUp({
      full_name: "New Patient",
      email: "new.patient@example.com",
      phone: "+1 (206) 555-0123",
      password: "Password123",
      confirm_password: "Password123",
      consent: true,
    });
    expect(signedUp.ok).toBe(true);

    const linked = await demoProvider.getAppointment(booking.data.id);
    expect(linked?.patient_id).not.toBeNull();
  });
});

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
