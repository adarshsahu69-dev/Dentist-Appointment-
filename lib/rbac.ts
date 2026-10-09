/**
 * Pure role-based access control rules. Used by middleware, server actions,
 * API routes and tests. Authorization is always re-checked on the server.
 */
import type { Appointment, Role, SessionUser } from "./types";

export type Resource = "patient" | "dentist" | "admin";

export const ROLE_HOME: Record<Role, string> = {
  patient: "/dashboard",
  dentist: "/dentist/dashboard",
  admin: "/admin/dashboard",
};

export function isRole(value: unknown): value is Role {
  return value === "patient" || value === "dentist" || value === "admin";
}

/** Roles that may sign up publicly. Dentist/admin accounts are created by admins. */
export const PUBLIC_SIGNUP_ROLES: Role[] = ["patient"];

export function canAccessArea(role: Role | undefined, area: Resource): boolean {
  if (!role) return false;
  if (role === "admin") return true;
  return role === area;
}

export function canViewAppointment(user: SessionUser, appointment: Appointment): boolean {
  if (user.role === "admin") return true;
  if (user.role === "patient") return appointment.patient_id === user.id;
  if (user.role === "dentist") return appointment.dentist_id === user.dentist_id;
  return false;
}

export function canMutateAppointment(
  user: SessionUser,
  appointment: Appointment,
  action: "cancel" | "reschedule" | "status" | "notes",
): boolean {
  if (user.role === "admin") return action === "notes" ? true : true;
  if (user.role === "patient") {
    if (appointment.patient_id !== user.id) return false;
    if (action === "cancel" || action === "reschedule") {
      return appointment.status === "pending" || appointment.status === "confirmed";
    }
    return false;
  }
  if (user.role === "dentist") {
    if (appointment.dentist_id !== user.dentist_id) return false;
    return true;
  }
  return false;
}

export function canManageClinicData(user: SessionUser): boolean {
  return user.role === "admin";
}

export function canConfigureAvailability(user: SessionUser, dentistId: string): boolean {
  if (user.role === "admin") return true;
  if (user.role === "dentist") return user.dentist_id === dentistId;
  return false;
}

/** Statuses that block a time slot from being booked again. */
export const ACTIVE_STATUSES = ["pending", "confirmed"] as const;

/** Allowed status transitions, enforced on the server. */
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled", "no_show"],
  confirmed: ["completed", "cancelled", "no_show"],
  completed: [],
  cancelled: ["pending"],
  no_show: ["confirmed"],
};

export function canTransition(from: string, to: string): boolean {
  return (STATUS_TRANSITIONS[from] ?? []).includes(to);
}
