import { NextResponse } from "next/server";
import { data } from "@/lib/data";
import { profileUpdateSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function PATCH(request: Request) {
  const user = await data.getSessionUser();
  if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });

  const limit = rateLimit(`profile:${user.id}`, 20, 60_000);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json({ error: "Please correct the highlighted fields.", fieldErrors }, { status: 422 });
  }

  const result = await data.updateProfile(user.id, parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({ profile: result.data });
}
