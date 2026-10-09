import { NextResponse } from "next/server";
import { data } from "@/lib/data";
import { resetPasswordSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = rateLimit(`reset:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  let body: { token?: string; password?: string; confirm_password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = resetPasswordSchema.safeParse({ password: body.password, confirm_password: body.confirm_password });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json({ error: "Please correct the highlighted fields.", fieldErrors }, { status: 422 });
  }

  const token = String(body.token ?? "");
  const result = await data.resetPassword(token, parsed.data.password);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ message: "Your password has been updated. You can now sign in." });
}
