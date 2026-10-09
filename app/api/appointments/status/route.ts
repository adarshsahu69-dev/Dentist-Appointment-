import { NextResponse } from "next/server";
import { data } from "@/lib/data";
import { canMutateAppointment, canTransition } from "@/lib/rbac";
import { APPOINTMENT_STATUSES } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import type { AppointmentStatus } from "@/lib/types";

export async function POST(request: Request) {
  const user = await data.getSessionUser();
  if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });

  const limit = rateLimit(`status:${user.id}`, 30, 60_000);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  let body: { appointment_id?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const id = String(body.appointment_id ?? "");
  const status = String(body.status ?? "");
  if (!APPOINTMENT_STATUSES.includes(status as AppointmentStatus)) {
    return NextResponse.json({ error: "Unknown status." }, { status: 422 });
  }

  const appointment = await data.getAppointment(id);
  if (!appointment) return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  if (!canMutateAppointment(user, appointment, "status")) {
    return NextResponse.json({ error: "You are not allowed to change this appointment." }, { status: 403 });
  }
  if (!canTransition(appointment.status, status)) {
    return NextResponse.json({ error: `Cannot change a ${appointment.status} appointment to ${status}.` }, { status: 409 });
  }

  const result = await data.setAppointmentStatus(id, status as AppointmentStatus);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({ appointment: result.data });
}
