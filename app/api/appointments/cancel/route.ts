import { NextResponse } from "next/server";
import { data } from "@/lib/data";
import { canMutateAppointment } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await data.getSessionUser();
  if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? user.id;
  const limit = rateLimit(`cancel:${ip}`, 10, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  let body: { appointment_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const id = String(body.appointment_id ?? "");
  const appointment = await data.getAppointment(id);
  if (!appointment) return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  if (!canMutateAppointment(user, appointment, "cancel")) {
    return NextResponse.json({ error: "You are not allowed to cancel this appointment." }, { status: 403 });
  }

  const result = await data.cancelAppointment(id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({ appointment: result.data });
}
