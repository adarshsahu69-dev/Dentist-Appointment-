import { describe, expect, it } from "vitest";
import {
  addMinutes,
  dayOfWeek,
  formatTime12h,
  formatTime,
  generateSlots,
  makeReference,
  normalizeTime,
  parseTime,
  rangesOverlap,
  slotIsBookable,
} from "@/lib/availability";
import type { Appointment, Availability, BlockedDate } from "@/lib/types";

const monday = "2030-01-07"; // Monday
const availability: Availability[] = [
  {
    id: "a1",
    dentist_id: "d1",
    day_of_week: 1,
    start_time: "09:00",
    end_time: "12:00",
    break_start: "10:00",
    break_end: "10:30",
  },
];

const noBreak: Availability[] = [{ id: "a2", dentist_id: "d1", day_of_week: 1, start_time: "09:00", end_time: "11:00", break_start: null, break_end: null }];

function appt(id: string, date: string, start: string, minutes = 30, status: Appointment["status"] = "confirmed"): Appointment {
  return {
    id,
    reference: `DC-${id}`,
    patient_id: "p1",
    dentist_id: "d1",
    service_id: "s1",
    clinic_id: "c1",
    appointment_date: date,
    start_time: start,
    end_time: addMinutes(start, minutes),
    status,
    patient_notes: null,
    patient_name: "Test Patient",
    patient_email: "t@example.com",
    patient_phone: "+1 000 000 0000",
    created_at: "2030-01-01T00:00:00.000Z",
    updated_at: "2030-01-01T00:00:00.000Z",
  };
}

describe("time helpers", () => {
  it("parses and formats times", () => {
    expect(parseTime("09:30")).toBe(570);
    expect(formatTime(570)).toBe("09:30");
    expect(formatTime(1440 + 30)).toBe("00:30");
  });

  it("normalizes loose time formats", () => {
    expect(normalizeTime("9:05")).toBe("09:05");
    expect(normalizeTime("09:05:00")).toBe("09:05");
  });

  it("formats 12-hour times", () => {
    expect(formatTime12h("00:30")).toBe("12:30 AM");
    expect(formatTime12h("12:00")).toBe("12:00 PM");
    expect(formatTime12h("13:05")).toBe("1:05 PM");
  });

  it("adds minutes across hour boundaries", () => {
    expect(addMinutes("09:45", 30)).toBe("10:15");
    expect(addMinutes("23:30", 60)).toBe("00:30");
  });

  it("computes weekday from ISO dates (UTC)", () => {
    expect(dayOfWeek(monday)).toBe(1);
    expect(dayOfWeek("2030-01-06")).toBe(0);
  });

  it("detects overlapping ranges", () => {
    expect(rangesOverlap(600, 630, 630, 660)).toBe(false);
    expect(rangesOverlap(600, 630, 620, 660)).toBe(true);
  });
});

describe("slot generation", () => {
  it("returns no slots when the dentist does not work that day", () => {
    expect(generateSlots({ date: "2030-01-08", now: new Date("2030-01-01T00:00:00Z"), availability, durationMinutes: 30, blockedDates: [], existingAppointments: [] })).toEqual([]);
  });

  it("generates slots in duration-sized steps", () => {
    const slots = generateSlots({ date: monday, now: new Date("2030-01-01T00:00:00Z"), availability: noBreak, durationMinutes: 30, blockedDates: [], existingAppointments: [] });
    expect(slots.map((s) => s.time)).toEqual(["09:00", "09:30", "10:00", "10:30"]);
    expect(slots.every((s) => s.available)).toBe(true);
  });

  it("never emits a slot that would overrun the end time", () => {
    const slots = generateSlots({ date: monday, now: new Date("2030-01-01T00:00:00Z"), availability: noBreak, durationMinutes: 45, blockedDates: [], existingAppointments: [] });
    // 09:45 + 45 min = 10:30 <= 11:00, so 09:45 is the last slot that fits.
    expect(slots.map((s) => s.time)).toEqual(["09:00", "09:45"]);
  });

  it("marks slots inside the break as unavailable", () => {
    const slots = generateSlots({ date: monday, now: new Date("2030-01-01T00:00:00Z"), availability, durationMinutes: 30, blockedDates: [], existingAppointments: [] });
    const byTime = Object.fromEntries(slots.map((s) => [s.time, s]));
    expect(byTime["09:00"].available).toBe(true);
    expect(byTime["09:30"].available).toBe(true);
    expect(byTime["10:00"].reason).toBe("break");
    // The 10:30 slot starts exactly when the break ends, so it is bookable.
    expect(byTime["10:30"].available).toBe(true);
    expect(byTime["11:00"].available).toBe(true);
    expect(byTime["11:30"].available).toBe(true);
  });

  it("marks already booked slots as unavailable", () => {
    const slots = generateSlots({
      date: monday,
      now: new Date("2030-01-01T00:00:00Z"),
      availability: noBreak,
      durationMinutes: 30,
      blockedDates: [],
      existingAppointments: [appt("x1", monday, "09:30")],
    });
    expect(slots.find((s) => s.time === "09:30")?.reason).toBe("booked");
    expect(slots.find((s) => s.time === "09:00")?.available).toBe(true);
  });

  it("ignores appointments for other dates and cancelled bookings", () => {
    const slots = generateSlots({
      date: monday,
      now: new Date("2030-01-01T00:00:00Z"),
      availability: noBreak,
      durationMinutes: 30,
      blockedDates: [],
      existingAppointments: [appt("x1", "2030-01-08", "09:00"), appt("x2", monday, "09:00", 30, "cancelled")],
    });
    expect(slots.every((s) => s.available)).toBe(true);
  });

  it("returns nothing when the whole date is blocked", () => {
    const blocked: BlockedDate[] = [{ id: "b1", dentist_id: "d1", blocked_date: monday, reason: "Leave" }];
    expect(generateSlots({ date: monday, now: new Date("2030-01-01T00:00:00Z"), availability: noBreak, durationMinutes: 30, blockedDates: blocked, existingAppointments: [] })).toEqual([]);
  });

  it("marks slots earlier today as past", () => {
    const today = new Date().toISOString().slice(0, 10);
    const slots = generateSlots({
      date: today,
      now: new Date(),
      availability: [{ id: "a3", dentist_id: "d1", day_of_week: dayOfWeek(today), start_time: "00:00", end_time: "23:59", break_start: null, break_end: null }],
      durationMinutes: 60,
      blockedDates: [],
      existingAppointments: [],
    });
    const past = slots.filter((s) => s.reason === "past");
    expect(past.length).toBeGreaterThan(0);
  });
});

const overlappingWindows: Availability[] = [
  { id: "w1", dentist_id: "d1", day_of_week: 1, start_time: "09:00", end_time: "12:00", break_start: null, break_end: null },
  { id: "w2", dentist_id: "d1", day_of_week: 1, start_time: "10:00", end_time: "13:00", break_start: null, break_end: null },
];

describe("slot validation (server-side rule)", () => {
  const now = new Date("2030-01-01T00:00:00Z");

  it("accepts a valid slot", () => {
    expect(slotIsBookable({ date: monday, startTime: "09:00", durationMinutes: 30, availability, blockedDates: [], existingAppointments: [], now }).ok).toBe(true);
  });

  it("rejects slots outside working hours", () => {
    const result = slotIsBookable({ date: monday, startTime: "08:00", durationMinutes: 30, availability, blockedDates: [], existingAppointments: [], now });
    expect(result).toEqual({ ok: false, error: "Selected time is outside the dentist's working hours." });
  });

  it("rejects a slot that overruns closing time", () => {
    const result = slotIsBookable({ date: monday, startTime: "11:30", durationMinutes: 60, availability, blockedDates: [], existingAppointments: [], now });
    expect(result.ok).toBe(false);
  });

  it("rejects slots inside a break", () => {
    const result = slotIsBookable({ date: monday, startTime: "10:00", durationMinutes: 30, availability, blockedDates: [], existingAppointments: [], now });
    expect(result).toEqual({ ok: false, error: "This time falls inside the dentist's break." });
  });

  it("rejects slots that clash with an existing appointment", () => {
    // 11:00 (from the second window) blocks 11:30 (from the first window).
    const result = slotIsBookable({
      date: monday,
      startTime: "11:30",
      durationMinutes: 30,
      availability: overlappingWindows,
      blockedDates: [],
      existingAppointments: [appt("x", monday, "11:00", 60)],
      now,
    });
    expect(result).toEqual({ ok: false, error: "This time slot was just taken. Please choose another time." });
  });

  it("rejects blocked dates", () => {
    const result = slotIsBookable({
      date: monday,
      startTime: "09:00",
      durationMinutes: 30,
      availability,
      blockedDates: [{ id: "b", dentist_id: "d1", blocked_date: monday, reason: null }],
      existingAppointments: [],
      now,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects past dates", () => {
    const result = slotIsBookable({ date: "2020-01-06", startTime: "09:00", durationMinutes: 30, availability: noBreak, blockedDates: [], existingAppointments: [], now });
    expect(result.ok).toBe(false);
  });

  it("rejects non-working days", () => {
    const result = slotIsBookable({ date: "2030-01-08", startTime: "09:00", durationMinutes: 30, availability, blockedDates: [], existingAppointments: [], now });
    expect(result).toEqual({ ok: false, error: "The dentist does not work on this day." });
  });
});

describe("reference numbers", () => {
  it("creates unique, prefixed references", () => {
    const ref = makeReference(new Date("2030-05-09T10:00:00Z"));
    expect(ref).toMatch(/^DC-300509-[A-Z0-9]{4}$/);
    expect(makeReference(new Date("2030-05-09T10:00:00Z"))).not.toBe(makeReference(new Date("2030-05-09T11:00:00Z")));
  });
});
