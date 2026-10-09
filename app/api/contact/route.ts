import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/notifications";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json(
      { error: `Too many messages sent. Please try again in ${limit.retryAfterSeconds} seconds.` },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json({ error: "Please correct the highlighted fields.", fieldErrors }, { status: 422 });
  }

  // Deliver to the clinic mailbox when email is configured; otherwise the
  // message is validated and acknowledged (demo mode).
  const result = await sendEmail({
    to: "care@dentalcare.example",
    subject: `[${parsed.data.reason}] Website contact from ${parsed.data.name}`,
    html: `<p><strong>From:</strong> ${parsed.data.name} (${parsed.data.email}${parsed.data.phone ? `, ${parsed.data.phone}` : ""})</p><p>${parsed.data.message.replace(/</g, "&lt;")}</p>`,
  });

  return NextResponse.json({
    message: result.delivered
      ? "Message sent. The clinic will reply within one working day."
      : "Message received (demo mode — email delivery is not configured). The clinic will reply within one working day.",
  });
}
