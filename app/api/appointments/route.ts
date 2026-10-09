import { NextResponse } from "next/server";
import { data } from "@/lib/data";
import { bookingSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Secure booking endpoint. Server-side validation is mandatory here even
 * though the UI validates too — never trust client input.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = rateLimit(`booking:${ip}`, 8, 10 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json(
      { error: `Too many booking attempts. Please try again in ${limit.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json({ error: "Please correct the highlighted fields.", fieldErrors }, { status: 422 });
  }

  const result = await data.createBooking(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error, fieldErrors: result.fieldErrors }, { status: 409 });
  }
  return NextResponse.json({ appointment: result.data }, { status: 201 });
}
