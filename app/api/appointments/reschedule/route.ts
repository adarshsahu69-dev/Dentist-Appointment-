import { NextResponse } from "next/server";
import { data } from "@/lib/data";
import { canMutateAppointment } from "@/lib/rbac";
import { bookingSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

/** Reschedule endpoint used by the patient and dentist dashboards. */
export async function POST(request: Request) {
  const user = await data.getSessionUser();
  if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });

  const limit = rateLimit(`reschedule:${user.id}`, 10, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  let body: { appointment_id?: string; appointment_date?: string; start_time?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const id = String(body.appointment_id ?? "");
  const appointment = await data.getAppointment(id);
  if (!appointment) return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  if (!canMutateAppointment(user, appointment, "reschedule")) {
    return NextResponse.json({ error: "You are not allowed to reschedule this appointment." }, { status: 403 });
  }

  const validated = bookingSchema
    .pick({ appointment_date: true, start_time: true })
    .safeParse({ appointment_date: body.appointment_date, start_time: body.start_time });
  if (!validated.success) {
    return NextResponse.json({ error: "Enter a valid date and time." }, { status: 422 });
  }

  const result = await data.rescheduleAppointment(id, validated.data.appointment_date, validated.data.start_time);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({ appointment: result.data });
}
