import { NextResponse } from "next/server";
import { data } from "@/lib/data";
import { canConfigureAvailability } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await data.getSessionUser();
  if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });

  const limit = rateLimit(`block:${user.id}`, 20, 60_000);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  let body: { dentist_id?: string; blocked_date?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const dentistId = body.dentist_id ?? user.dentist_id ?? "";
  if (!canConfigureAvailability(user, dentistId)) {
    return NextResponse.json({ error: "You are not allowed to block dates for this dentist." }, { status: 403 });
  }

  const date = String(body.blocked_date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Enter a valid date (YYYY-MM-DD)." }, { status: 422 });
  }

  const result = await data.addBlockedDate(dentistId, date, String(body.reason ?? "") || "Unavailable");
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({ blocked_date: result.data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await data.getSessionUser();
  if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });

  const limit = rateLimit(`unblock:${user.id}`, 20, 60_000);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  let body: { blocked_date_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const id = String(body.blocked_date_id ?? "");
  if (!id) return NextResponse.json({ error: "Missing blocked date id." }, { status: 422 });

  // Dentists and admins may both unblock; ownership is re-checked below.
  const blocked = (await data.listBlockedDates(user.dentist_id ?? "")).find((b) => b.id === id);
  if (user.role === "dentist" && !blocked) {
    return NextResponse.json({ error: "You are not allowed to unblock this date." }, { status: 403 });
  }
  if (user.role === "patient") {
    return NextResponse.json({ error: "You are not allowed to unblock dates." }, { status: 403 });
  }

  const result = await data.removeBlockedDate(id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({ ok: true });
}
