import { z } from "zod";

export const emailSchema = z.string().trim().min(1, "Email is required").email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(20, "Enter a valid phone number")
  .regex(/^[+()\-\s0-9]+$/, "Enter a valid phone number");

export const signupSchema = z
  .object({
    full_name: z.string().trim().min(2, "Full name must be at least 2 characters").max(80),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirm_password: z.string(),
    consent: z.literal(true, { errorMap: () => ({ message: "You must accept the privacy policy" }) }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

/** "YYYY-MM-DD" */
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

/** "HH:mm" 24h */
export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time");

export const bookingSchema = z.object({
  service_id: z.string().uuid("Select a service"),
  dentist_id: z.string().uuid("Select a dentist"),
  clinic_id: z.string().uuid("Select a clinic"),
  appointment_date: dateSchema,
  start_time: timeSchema,
  patient_name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  patient_email: emailSchema,
  patient_phone: phoneSchema,
  patient_notes: z.string().trim().max(500, "Notes must be under 500 characters").optional().or(z.literal("")),
});

export const profileUpdateSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  phone: phoneSchema,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal("")),
  clinic_id: z.string().min(1, "Select a clinic"),
  reason: z.string().min(1, "Select a reason"),
  message: z.string().trim().min(10, "Please add a little more detail").max(1000),
});

export const availabilitySchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: timeSchema,
  end_time: timeSchema,
  break_start: timeSchema.nullable().optional(),
  break_end: timeSchema.nullable().optional(),
});

export function formatZodError(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
