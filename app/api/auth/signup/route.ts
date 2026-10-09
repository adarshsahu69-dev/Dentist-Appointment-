import { NextResponse } from "next/server";
import { data } from "@/lib/data";
import { signupSchema, formatZodError } from "@/lib/validation";
import { ROLE_HOME } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

function safeNext(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  return value.startsWith("/") && !value.startsWith("//") ? value : null;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = rateLimit(`signup:${ip}`, 5, 30 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.redirect(new URL(`/signup?error=${encodeURIComponent("Too many attempts. Try again later.")}`, request.url), 303);
  }

  const parsed = signupSchema.safeParse({
    full_name: form.get("full_name"),
    email: form.get("email"),
    phone: form.get("phone"),
    password: form.get("password"),
    confirm_password: form.get("confirm_password"),
    consent: form.get("consent") === "on" || form.get("consent") === "true",
  });
  if (!parsed.success) {
    const errors = formatZodError(parsed.error);
    const first = Object.entries(errors)[0];
    const message = first ? `${first[0].replace(/_/g, " ")}: ${first[1]}` : "Please check the form and try again.";
    return NextResponse.redirect(new URL(`/signup?error=${encodeURIComponent(message)}`, request.url), 303);
  }

  const result = await data.signUp(parsed.data);
  if (!result.ok) {
    return NextResponse.redirect(new URL(`/signup?error=${encodeURIComponent(result.error)}`, request.url), 303);
  }

  const next = safeNext(form.get("next"));
  return NextResponse.redirect(new URL(next ?? ROLE_HOME[result.data.role], request.url), 303);
}
