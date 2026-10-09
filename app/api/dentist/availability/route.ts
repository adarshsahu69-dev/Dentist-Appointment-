import { NextResponse } from "next/server";
import { data } from "@/lib/data";
import { canAccessArea, canConfigureAvailability } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

interface AvailabilityRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
}

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function validateRows(rows: unknown): { ok: true; rows: AvailabilityRow[] } | { ok: false; error: string } {
  if (!Array.isArray(rows) || rows.length === 0) return { ok: true, rows: [] };
  for (const row of rows) {
    const r = row as AvailabilityRow;
    if (typeof r.day_of_week !== "number" || r.day_of_week < 0 || r.day_of_week > 6 || !Number.isInteger(r.day_of_week)) {
      return { ok: false, error: "Each working day must be a number between 0 and 6." };
    }
    if (!timePattern.test(r.start_time) || !timePattern.test(r.end_time)) {
      return { ok: false, error: "Start and end times must use HH:mm format." };
    }
    if (r.start_time >= r.end_time) {
      return { ok: false, error: "End time must be after start time." };
    }
    if (r.break_start !== null && r.break_start !== undefined) {
      if (!timePattern.test(r.break_start)) return { ok: false, error: "Break start must use HH:mm format." };
      if (r.break_start < r.start_time || r.break_start > r.end_time) {
        return { ok: false, error: "Break times must fall inside working hours." };
      }
    }
    if (r.break_end !== null && r.break_end !== undefined) {
      if (!timePattern.test(r.break_end)) return { ok: false, error: "Break end must use HH:mm format." };
      if (r.break_end < r.start_time || r.break_end > r.end_time) {
        return { ok: false, error: "Break times must fall inside working hours." };
      }
    }
    if ((r.break_start && !r.break_end) || (!r.break_start && r.break_end)) {
      return { ok: false, error: "Provide both a break start and a break end, or neither." };
    }
    if (r.break_start && r.break_end && r.break_end <= r.break_start) {
      return { ok: false, error: "Break end must be after break start." };
    }
  }
  return { ok: true, rows: rows as AvailabilityRow[] };
}

export async function POST(request: Request) {
  const user = await data.getSessionUser();
  if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });

  const limit = rateLimit(`availability:${user.id}`, 20, 60_000);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  let body: { dentist_id?: string; rows?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Dentists may only edit their own availability; admins may edit any.
  const dentistId = body.dentist_id ?? user.dentist_id ?? "";
  if (!canConfigureAvailability(user, dentistId) && !canAccessArea(user.role, "dentist")) {
    return NextResponse.json({ error: "You are not allowed to change this availability." }, { status: 403 });
  }

  const validated = validateRows(body.rows);
  if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 422 });

  const result = await data.replaceAvailability(dentistId, validated.rows);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({ availability: result.data });
}
