import { describe, expect, it } from "vitest";
import {
  bookingSchema,
  contactSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  profileUpdateSchema,
  formatZodError,
} from "@/lib/validation";

const validBooking = {
  service_id: "00000000-0000-4000-8000-000000000001",
  dentist_id: "00000000-0000-4000-8000-000000000201",
  clinic_id: "00000000-0000-4000-8000-000000000101",
  appointment_date: "2030-05-09",
  start_time: "10:30",
  patient_name: "Jamie Alvarez",
  patient_email: "jamie@example.com",
  patient_phone: "+1 (206) 555-0110",
  patient_notes: "Sensitive to cold",
};

describe("signup validation", () => {
  const base = {
    full_name: "Jamie Alvarez",
    email: "jamie@example.com",
    phone: "+1 (206) 555-0110",
    password: "Password123",
    confirm_password: "Password123",
    consent: true as const,
  };

  it("accepts valid input", () => {
    expect(signupSchema.safeParse(base).success).toBe(true);
  });

  it("requires password complexity", () => {
    expect(signupSchema.safeParse({ ...base, password: "short", confirm_password: "short" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, password: "password123", confirm_password: "password123" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, password: "PASSWORD123", confirm_password: "PASSWORD123" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, password: "Password!", confirm_password: "Password!" }).success).toBe(false);
  });

  it("requires matching passwords", () => {
    const result = signupSchema.safeParse({ ...base, confirm_password: "Password124" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((i) => i.path.includes("confirm_password"))).toBe(true);
  });

  it("requires privacy policy consent", () => {
    expect(signupSchema.safeParse({ ...base, consent: false }).success).toBe(false);
  });

  it("rejects invalid emails and phones", () => {
    expect(signupSchema.safeParse({ ...base, email: "not-an-email" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, phone: "abc" }).success).toBe(false);
  });
});

describe("login validation", () => {
  it("requires an email and password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });

  it("validates forgot-password input", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });

  it("validates password reset input", () => {
    expect(resetPasswordSchema.safeParse({ password: "Password123", confirm_password: "Password123" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ password: "Password123", confirm_password: "Other12345" }).success).toBe(false);
  });
});

describe("booking validation", () => {
  it("accepts valid input", () => {
    expect(bookingSchema.safeParse(validBooking).success).toBe(true);
  });

  it("requires UUID identifiers", () => {
    expect(bookingSchema.safeParse({ ...validBooking, service_id: "1" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...validBooking, dentist_id: "nope" }).success).toBe(false);
  });

  it("validates date and time formats", () => {
    expect(bookingSchema.safeParse({ ...validBooking, appointment_date: "09/05/2030" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...validBooking, start_time: "10:30 AM" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...validBooking, start_time: "25:00" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...validBooking, start_time: "23:59" }).success).toBe(true);
  });

  it("requires patient contact details", () => {
    expect(bookingSchema.safeParse({ ...validBooking, patient_name: "J" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...validBooking, patient_email: "bad" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...validBooking, patient_phone: "123" }).success).toBe(false);
  });

  it("allows empty optional notes but caps length", () => {
    expect(bookingSchema.safeParse({ ...validBooking, patient_notes: "" }).success).toBe(true);
    expect(bookingSchema.safeParse({ ...validBooking, patient_notes: "" }).success).toBe(true);
    expect(bookingSchema.safeParse({ ...validBooking, patient_notes: "x".repeat(501) }).success).toBe(false);
  });
});

describe("profile and contact validation", () => {
  it("validates profile updates", () => {
    expect(profileUpdateSchema.safeParse({ full_name: "Jamie Alvarez", phone: "+1 206 555 0110" }).success).toBe(true);
    expect(profileUpdateSchema.safeParse({ full_name: "J", phone: "123" }).success).toBe(false);
  });

  it("validates contact messages", () => {
    expect(
      contactSchema.safeParse({
        name: "Jamie Alvarez",
        email: "jamie@example.com",
        phone: "",
        clinic_id: "00000000-0000-4000-8000-000000000101",
        reason: "General question",
        message: "Do you have any evening appointments available this week?",
      }).success,
    ).toBe(true);
    expect(
      contactSchema.safeParse({ name: "J", email: "bad", phone: "", clinic_id: "x", reason: "", message: "short" }).success,
    ).toBe(false);
  });

  it("maps zod errors to field messages", () => {
    const result = signupSchema.safeParse({ full_name: "J", email: "bad", phone: "x", password: "a", confirm_password: "b", consent: false });
    expect(result.success).toBe(false);
    if (result.success) return;
    const errors = formatZodError(result.error);
    expect(errors.full_name).toBeDefined();
    expect(errors.email).toBeDefined();
    expect(errors.consent).toBeDefined();
  });
});
