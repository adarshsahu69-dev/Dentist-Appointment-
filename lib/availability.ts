/**
 * Pure time/slot logic shared by demo mode and production mode.
 * Everything here is deterministic and unit-testable.
 */
import type { Appointment, Availability, BlockedDate, Slot } from "./types";

export const DAY_MS = 86_400_000;

export function parseTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Normalize "9:00", "09:00:00" -> "09:00" */
export function normalizeTime(time: string): string {
  const parts = time.split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1] ?? 0);
  return formatTime(h * 60 + m);
}

/** 0 = Sunday ... 6 = Saturday */
export function dayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isPastDate(dateStr: string, now: Date): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getTime() < Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

export interface SlotContext {
  date: string;
  now: Date;
  /** Working hours rows that apply to this weekday. */
  availability: Availability[];
  /** Minutes per appointment (service duration). */
  durationMinutes: number;
  blockedDates: BlockedDate[];
  /** Appointments for the dentist on this date with an active status. */
  existingAppointments: Appointment[];
}

export function getBlockedReason(blockedDates: BlockedDate[], date: string, dentistId: string): string | null {
  const hit = blockedDates.find((b) => b.dentist_id === dentistId && b.blocked_date === date);
  return hit ? hit.reason ?? "Unavailable" : null;
}

export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Generate the full slot grid for a dentist/date/duration, marking each slot
 * available or the reason it is unavailable. Slots must fit entirely inside a
 * working window (respecting breaks) and must not overlap active appointments.
 */
export function generateSlots(ctx: SlotContext): Slot[] {
  const { date, now, durationMinutes, blockedDates, existingAppointments } = ctx;
  const weekday = dayOfWeek(date);
  const slots = new Map<number, Slot>();

  const windows = ctx.availability.filter((a) => a.day_of_week === weekday);
  if (windows.length === 0) return [];

  const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const isToday = toISODate(now) === date;
  const blocked = getBlockedReason(blockedDates, date, windows[0].dentist_id);

  for (const win of windows) {
    const start = parseTime(normalizeTime(win.start_time));
    const end = parseTime(normalizeTime(win.end_time));
    const breakStart = win.break_start ? parseTime(normalizeTime(win.break_start)) : null;
    const breakEnd = win.break_end ? parseTime(normalizeTime(win.break_end)) : null;

    for (let t = start; t + durationMinutes <= end; t += durationMinutes) {
      const slotStart = t;
      const slotEnd = t + durationMinutes;
      let reason: Slot["reason"] | undefined;

      if (breakStart !== null && breakEnd !== null && rangesOverlap(slotStart, slotEnd, breakStart, breakEnd)) {
        reason = "break";
      }
      if (isToday && slotStart <= nowMinutes) {
        reason = "past";
      }

      const clash = existingAppointments.find((appt) => {
        if (appt.appointment_date !== date) return false;
        // Only active appointments block a slot; cancelled/completed ones release it.
        if (appt.status !== "pending" && appt.status !== "confirmed") return false;
        const apptStart = parseTime(normalizeTime(appt.start_time));
        const apptEnd = parseTime(normalizeTime(appt.end_time));
        return rangesOverlap(slotStart, slotEnd, apptStart, apptEnd);
      });
      if (clash) reason = "booked";

      slots.set(slotStart, { time: formatTime(slotStart), available: !reason, ...(reason ? { reason } : {}) });
    }
  }

  if (blocked) {
    for (const slot of slots.values()) {
      slot.available = false;
      if (!slot.reason) slot.reason = "booked";
    }
    return [];
  }

  return Array.from(slots.values())
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function slotIsBookable(args: {
  date: string;
  startTime: string;
  durationMinutes: number;
  availability: Availability[];
  blockedDates: BlockedDate[];
  existingAppointments: Appointment[];
  now?: Date;
}): { ok: true } | { ok: false; error: string } {
  const { date, startTime, durationMinutes, availability, blockedDates, existingAppointments } = args;
  const now = args.now ?? new Date();
  if (isPastDate(date, now)) return { ok: false, error: "The selected date is in the past." };

  const slots = generateSlots({
    date,
    now,
    availability,
    durationMinutes,
    blockedDates,
    existingAppointments,
  });
  if (slots.length === 0) {
    const weekday = dayOfWeek(date);
    const hasWindow = availability.some((a) => a.day_of_week === weekday);
    if (!hasWindow) return { ok: false, error: "The dentist does not work on this day." };
    if (isPastDate(date, now)) return { ok: false, error: "The selected date is in the past." };
    return { ok: false, error: "No availability on the selected date." };
  }
  const slot = slots.find((s) => s.time === normalizeTime(startTime));
  if (!slot) return { ok: false, error: "Selected time is outside the dentist's working hours." };
  if (!slot.available) {
    if (slot.reason === "booked") return { ok: false, error: "This time slot was just taken. Please choose another time." };
    if (slot.reason === "break") return { ok: false, error: "This time falls inside the dentist's break." };
    return { ok: false, error: "This time slot is no longer available." };
  }
  return { ok: true };
}

export function addMinutes(time: string, minutes: number): string {
  return formatTime(parseTime(normalizeTime(time)) + minutes);
}

export function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatTime12h(time: string): string {
  const total = parseTime(normalizeTime(time));
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function makeReference(date = new Date()): string {
  const y = String(date.getUTCFullYear()).slice(2);
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DC-${y}${m}${d}-${rand}`;
}
