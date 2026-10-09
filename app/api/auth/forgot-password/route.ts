import { NextResponse } from "next/server";
import { data } from "@/lib/data";
import { emailSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = rateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = emailSchema.safeParse(body.email);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address.", fieldErrors: { email: "Enter a valid email address" } }, { status: 422 });
  }

  const result = await data.requestPasswordReset(parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });

  // In production the link is emailed. In demo mode we return it so the UI can
  // display it (no email credentials are configured).
  return NextResponse.json({
    message: "If an account exists for that address, a password reset link is on its way. The link expires in 30 minutes.",
    reset_token: result.data.token,
  });
}
