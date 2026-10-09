import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signSession, verifySession } from "@/lib/auth/session";
import { canAccessArea, canMutateAppointment, canTransition, canViewAppointment } from "@/lib/rbac";
import type { Appointment, SessionUser } from "@/lib/types";

const appointment: Appointment = {
  id: "appt-1",
  reference: "DC-TEST-0001",
  patient_id: "patient-1",
  dentist_id: "dentist-1",
  service_id: "service-1",
  clinic_id: "clinic-1",
  appointment_date: "2030-01-10",
  start_time: "10:00",
  end_time: "10:30",
  status: "confirmed",
  patient_notes: null,
  patient_name: "Jamie Alvarez",
  patient_email: "jamie@example.com",
  patient_phone: "+1 206 555 0000",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const patient: SessionUser = { id: "patient-1", email: "p@example.com", full_name: "Jamie", role: "patient", phone: null };
const otherPatient: SessionUser = { id: "patient-2", email: "o@example.com", full_name: "Other", role: "patient", phone: null };
const dentist: SessionUser = { id: "dentist-profile-1", email: "d@example.com", full_name: "Dr. Osei", role: "dentist", phone: null, dentist_id: "dentist-1" };
const otherDentist: SessionUser = { id: "dentist-profile-2", email: "d2@example.com", full_name: "Dr. Reyes", role: "dentist", phone: null, dentist_id: "dentist-2" };
const admin: SessionUser = { id: "admin-1", email: "a@example.com", full_name: "Admin", role: "admin", phone: null };

describe("password hashing", () => {
  it("never stores the plain-text password", () => {
    const stored = hashPassword("Password123");
    expect(stored).not.toContain("Password123");
    expect(stored.startsWith("scrypt$")).toBe(true);
  });

  it("verifies a correct password and rejects a wrong one", () => {
    const stored = hashPassword("Password123");
    expect(verifyPassword("Password123", stored)).toBe(true);
    expect(verifyPassword("password123", stored)).toBe(false);
    expect(verifyPassword("Password1234", stored)).toBe(false);
  });

  it("produces different hashes for the same password (unique salts)", () => {
    expect(hashPassword("Password123")).not.toEqual(hashPassword("Password123"));
  });

  it("rejects malformed stored hashes", () => {
    expect(verifyPassword("Password123", "plain-text")).toBe(false);
    expect(verifyPassword("Password123", "bcrypt$aa$bb")).toBe(false);
  });
});

describe("session cookies", () => {
  it("signs and verifies a payload", async () => {
    const token = await signSession({ sub: "user-1", email: "a@b.com", role: "patient", full_name: "A B" });
    const payload = await verifySession(token);
    expect(payload?.sub).toBe("user-1");
    expect(payload?.role).toBe("patient");
  });

  it("rejects tampered tokens", async () => {
    const token = await signSession({ sub: "user-1", email: "a@b.com", role: "patient", full_name: "A B" });
    const [body, signature] = token.split(".");
    const tampered = btoa(JSON.stringify({ sub: "admin", role: "admin", exp: 9999999999 }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(await verifySession(`${tampered}.${signature}`)).toBeNull();
    expect(await verifySession(`${body}.tampered`)).toBeNull();
  });

  it("rejects expired sessions", async () => {
    const token = await signSession({ sub: "u", email: "a@b.com", role: "patient", full_name: "A" }, -10);
    expect(await verifySession(token)).toBeNull();
  });

  it("rejects empty tokens", async () => {
    expect(await verifySession(undefined)).toBeNull();
    expect(await verifySession("")).toBeNull();
  });
});

describe("role based access control", () => {
  it("restricts area access by role", () => {
    expect(canAccessArea("patient", "patient")).toBe(true);
    expect(canAccessArea("patient", "admin")).toBe(false);
    expect(canAccessArea("dentist", "dentist")).toBe(true);
    expect(canAccessArea("dentist", "admin")).toBe(false);
    expect(canAccessArea("admin", "admin")).toBe(true);
    expect(canAccessArea("admin", "dentist")).toBe(true);
    expect(canAccessArea(undefined, "patient")).toBe(false);
  });

  it("only exposes appointments to their owner, assigned dentist or admin", () => {
    expect(canViewAppointment(patient, appointment)).toBe(true);
    expect(canViewAppointment(otherPatient, appointment)).toBe(false);
    expect(canViewAppointment(dentist, appointment)).toBe(true);
    expect(canViewAppointment(otherDentist, appointment)).toBe(false);
    expect(canViewAppointment(admin, appointment)).toBe(true);
  });

  it("lets patients only cancel/reschedule their own active appointments", () => {
    expect(canMutateAppointment(patient, appointment, "cancel")).toBe(true);
    expect(canMutateAppointment(patient, appointment, "reschedule")).toBe(true);
    expect(canMutateAppointment(otherPatient, appointment, "cancel")).toBe(false);
    expect(canMutateAppointment(patient, appointment, "status")).toBe(false);
    expect(
      canMutateAppointment(patient, { ...appointment, status: "completed" }, "cancel"),
    ).toBe(false);
  });

  it("lets the assigned dentist manage their appointments but not another dentist's", () => {
    expect(canMutateAppointment(dentist, appointment, "status")).toBe(true);
    expect(canMutateAppointment(dentist, appointment, "notes")).toBe(true);
    expect(canMutateAppointment(otherDentist, appointment, "status")).toBe(false);
  });

  it("enforces valid status transitions", () => {
    expect(canTransition("pending", "confirmed")).toBe(true);
    expect(canTransition("pending", "completed")).toBe(false);
    expect(canTransition("confirmed", "completed")).toBe(true);
    expect(canTransition("completed", "cancelled")).toBe(false);
    expect(canTransition("cancelled", "pending")).toBe(true);
    expect(canTransition("no_show", "confirmed")).toBe(true);
  });
});
