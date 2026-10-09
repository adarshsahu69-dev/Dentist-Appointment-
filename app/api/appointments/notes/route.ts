import { NextResponse } from "next/server";
import { data } from "@/lib/data";
import { canMutateAppointment } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await data.getSessionUser();
  if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });

  const limit = rateLimit(`notes:${user.id}`, 30, 60_000);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  let body: { appointment_id?: string; patient_notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const id = String(body.appointment_id ?? "");
  const notes = String(body.patient_notes ?? "").slice(0, 1000);

  const appointment = await data.getAppointment(id);
  if (!appointment) return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  if (!canMutateAppointment(user, appointment, "notes")) {
    return NextResponse.json({ error: "You are not allowed to edit notes for this appointment." }, { status: 403 });
  }

  const result = await data.setAppointmentNotes(id, notes);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({ appointment: result.data });
}
