import { NextResponse } from "next/server";
import { data } from "@/lib/data";
import { loginSchema } from "@/lib/validation";
import { ROLE_HOME } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

function safeNext(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  return value.startsWith("/") && !value.startsWith("//") ? value : null;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = rateLimit(`login:${ip}`, 10, 10 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Too many attempts. Try again later.")}`, request.url), 303);
  }

  const parsed = loginSchema.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid email or password.";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, request.url), 303);
  }

  const result = await data.signIn(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(result.error)}`, request.url), 303);
  }

  const next = safeNext(form.get("next"));
  return NextResponse.redirect(new URL(next ?? ROLE_HOME[result.data.role], request.url), 303);
}
