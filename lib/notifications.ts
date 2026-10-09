import { isDemoMode, appUrl } from "./config";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends a transactional email via Resend when configured.
 * When credentials are missing we log to the server console and return
 * `delivered: false` so callers can show an in-app confirmation instead.
 * Never simulate a delivery that did not happen.
 */
export async function sendEmail(message: EmailMessage): Promise<{ delivered: boolean; detail: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATIONS_FROM_EMAIL ?? "appointments@dentalcare.example";

  if (!apiKey) {
    console.info(`[notifications:demo] To: ${message.to} | Subject: ${message.subject}`);
    return { delivered: false, detail: "Email provider not configured (demo mode)" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: message.to, subject: message.subject, html: message.html }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[notifications] Resend error ${res.status}: ${text}`);
      return { delivered: false, detail: `Email provider responded with ${res.status}` };
    }
    return { delivered: true, detail: "Email sent" };
  } catch (error) {
    console.error("[notifications] Email send failed", error);
    return { delivered: false, detail: "Email send failed" };
  }
}

function layout(title: string, body: string): string {
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#172554">
    <h2 style="color:#0F766E;margin:0 0 16px">DentalCare</h2>
    <h3 style="margin:0 0 12px">${title}</h3>
    ${body}
    <p style="font-size:12px;color:#64748b;margin-top:24px">You are receiving this because you booked or manage an appointment at DentalCare.</p>
  </div>`;
}

export function bookingConfirmationEmail(args: {
  patientName: string;
  reference: string;
  service: string;
  dentist: string;
  date: string;
  time: string;
  clinic: string;
  clinicAddress: string;
}): EmailMessage {
  return {
    to: "",
    subject: `Appointment received — ${args.reference}`,
    html: layout(
      "We received your appointment request",
      `<p>Hi ${args.patientName},</p>
       <p>Your appointment request has been received. We will confirm your slot shortly.</p>
       <ul>
         <li><strong>Reference:</strong> ${args.reference}</li>
         <li><strong>Service:</strong> ${args.service}</li>
         <li><strong>Dentist:</strong> ${args.dentist}</li>
         <li><strong>Date:</strong> ${args.date}</li>
         <li><strong>Time:</strong> ${args.time}</li>
         <li><strong>Clinic:</strong> ${args.clinic}, ${args.clinicAddress}</li>
       </ul>
       <p>Manage or cancel your appointment any time from your dashboard: <a href="${appUrl}/dashboard/appointments">${appUrl}/dashboard/appointments</a></p>`,
    ),
  };
}

export function statusEmail(args: {
  patientName: string;
  reference: string;
  status: "confirmed" | "cancelled" | "rescheduled";
  date?: string;
  time?: string;
  dentist?: string;
}): EmailMessage {
  const titles: Record<string, string> = {
    confirmed: "Your appointment is confirmed",
    cancelled: "Your appointment was cancelled",
    rescheduled: "Your appointment was rescheduled",
  };
  return {
    to: "",
    subject: `${titles[args.status]} — ${args.reference}`,
    html: layout(
      titles[args.status],
      `<p>Hi ${args.patientName},</p>
       <p>Your appointment <strong>${args.reference}</strong>${args.dentist ? ` with ${args.dentist}` : ""} is now <strong>${args.status}</strong>.</p>
       ${args.date ? `<p><strong>New date:</strong> ${args.date}${args.time ? ` at ${args.time}` : ""}</p>` : ""}`,
    ),
  };
}

export function reminderEmail(args: { patientName: string; reference: string; date: string; time: string; clinic: string }): EmailMessage {
  return {
    to: "",
    subject: `Reminder: your appointment is coming up`,
    html: layout(
      "Appointment reminder",
      `<p>Hi ${args.patientName},</p>
       <p>This is a reminder for your upcoming appointment <strong>${args.reference}</strong> on <strong>${args.date}</strong> at <strong>${args.time}</strong> at ${args.clinic}.</p>
       <p>Please arrive 10 minutes early. If you need to reschedule, visit your dashboard.</p>`,
    ),
  };
}

export const usesDemoEmail = () => isDemoMode || !process.env.RESEND_API_KEY;
