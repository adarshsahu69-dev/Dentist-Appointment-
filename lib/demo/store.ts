import { createDemoDB, type DemoDB } from "./seed";
import { hashPassword } from "../auth/password";
import type {
  Appointment,
  AppointmentStatus,
  AuditLog,
  Availability,
  BlockedDate,
  Clinic,
  Dentist,
  DentistWithDetails,
  Notification,
  Profile,
  Service,
} from "../types";
import { addMinutes, normalizeTime } from "../availability";

const globalStore = globalThis as unknown as { __dentalcare_db?: DemoDB };

export function getDb(): DemoDB {
  if (!globalStore.__dentalcare_db) {
    globalStore.__dentalcare_db = createDemoDB();
  }
  return globalStore.__dentalcare_db;
}

/** Test helper: reset the store to freshly seeded state. */
export function resetDb(): void {
  globalStore.__dentalcare_db = createDemoDB();
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowISO(): string {
  return new Date().toISOString();
}

/* ----------------------------- lookups ----------------------------- */

export function findProfileByEmail(db: DemoDB, email: string): Profile | undefined {
  const needle = email.trim().toLowerCase();
  return db.profiles.find((p) => p.email.toLowerCase() === needle);
}

export function findDentistByProfile(db: DemoDB, profileId: string): Dentist | undefined {
  return db.dentists.find((d) => d.profile_id === profileId);
}

export function getClinic(db: DemoDB, id: string): Clinic | undefined {
  return db.clinics.find((c) => c.id === id);
}

export function getDentistDetails(db: DemoDB, id: string): DentistWithDetails | null {
  const dentist = db.dentists.find((d) => d.id === id);
  if (!dentist) return null;
  const profile = db.profiles.find((p) => p.id === dentist.profile_id);
  const clinic = getClinic(db, dentist.clinic_id);
  if (!profile || !clinic) return null;
  return {
    ...dentist,
    profile,
    clinic,
    service_ids: db.dentistServices.filter((ds) => ds.dentist_id === id).map((ds) => ds.service_id),
  };
}

export function availabilityForDentist(db: DemoDB, dentistId: string): Availability[] {
  return db.availability.filter((a) => a.dentist_id === dentistId);
}

export function blockedDatesForDentist(db: DemoDB, dentistId: string): BlockedDate[] {
  return db.blockedDates.filter((b) => b.dentist_id === dentistId);
}

export function activeAppointmentsFor(db: DemoDB, dentistId: string, date?: string): Appointment[] {
  return db.appointments.filter(
    (a) =>
      a.dentist_id === dentistId &&
      (a.status === "pending" || a.status === "confirmed") &&
      (date ? a.appointment_date === date : true),
  );
}

export function appointmentsForPatient(db: DemoDB, patientId: string): Appointment[] {
  return db.appointments
    .filter((a) => a.patient_id === patientId)
    .sort((a, b) => (a.appointment_date + a.start_time < b.appointment_date + b.start_time ? 1 : -1));
}

export function appointmentsForDentist(db: DemoDB, dentistId: string): Appointment[] {
  return db.appointments
    .filter((a) => a.dentist_id === dentistId)
    .sort((a, b) => (a.appointment_date + a.start_time < b.appointment_date + b.start_time ? 1 : -1));
}

export function serviceById(db: DemoDB, id: string): Service | undefined {
  return db.services.find((s) => s.id === id);
}

export function serviceBookingCount(db: DemoDB, serviceId: string): number {
  return db.appointments.filter((a) => a.service_id === serviceId && a.status !== "cancelled").length;
}

/* --------------------------- notifications --------------------------- */

export function pushNotification(
  db: DemoDB,
  input: { user_id: string; appointment_id?: string | null; notification_type: Notification["notification_type"]; message: string },
): Notification {
  // Avoid duplicate notifications of the same type for the same appointment.
  if (input.appointment_id) {
    const existing = db.notifications.find(
      (n) =>
        n.appointment_id === input.appointment_id &&
        n.notification_type === input.notification_type &&
        n.message === input.message,
    );
    if (existing) return existing;
  }
  const notification: Notification = {
    id: newId(),
    user_id: input.user_id,
    appointment_id: input.appointment_id ?? null,
    notification_type: input.notification_type,
    message: input.message,
    is_read: false,
    created_at: nowISO(),
  };
  db.notifications.unshift(notification);
  return notification;
}

/* ----------------------------- audit logs ----------------------------- */

export function pushAuditLog(
  db: DemoDB,
  input: { actor_id: string | null; action: string; entity: string; entity_id?: string | null; metadata?: Record<string, unknown> | null },
): AuditLog {
  const log: AuditLog = {
    id: newId(),
    actor_id: input.actor_id,
    action: input.action,
    entity: input.entity,
    entity_id: input.entity_id ?? null,
    metadata: input.metadata ?? null,
    created_at: nowISO(),
  };
  db.auditLogs.unshift(log);
  return log;
}

/* ----------------------------- mutations ----------------------------- */

export function insertAppointment(db: DemoDB, input: Omit<Appointment, "id" | "created_at" | "updated_at">): Appointment {
  const appointment: Appointment = {
    ...input,
    end_time: normalizeTime(input.end_time),
    start_time: normalizeTime(input.start_time),
    id: newId(),
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  db.appointments.push(appointment);
  return appointment;
}

export function updateAppointment(db: DemoDB, id: string, patch: Partial<Appointment>): Appointment | null {
  const appt = db.appointments.find((a) => a.id === id);
  if (!appt) return null;
  Object.assign(appt, patch, { updated_at: nowISO() });
  return appt;
}

export function addCredential(db: DemoDB, profileId: string, password: string): void {
  db.credentials.push({ profile_id: profileId, password_hash: hashPassword(password) });
}

export function insertProfile(db: DemoDB, input: Omit<Profile, "id" | "created_at">): Profile {
  const profile: Profile = { ...input, id: newId(), created_at: nowISO() };
  db.profiles.push(profile);
  return profile;
}

export function insertService(db: DemoDB, input: Omit<Service, "id">): Service {
  const service: Service = { ...input, id: newId() };
  db.services.push(service);
  return service;
}

export function insertClinic(db: DemoDB, input: Omit<Clinic, "id">): Clinic {
  const clinic: Clinic = { ...input, id: newId() };
  db.clinics.push(clinic);
  return clinic;
}

export function insertDentist(db: DemoDB, input: Omit<Dentist, "id">): Dentist {
  const dentist: Dentist = { ...input, id: newId() };
  db.dentists.push(dentist);
  return dentist;
}

export function insertAvailability(db: DemoDB, rows: Omit<Availability, "id">[]): Availability[] {
  const created = rows.map((r, i) => ({ ...r, id: `${newId()}-${i}` }));
  db.availability.push(...created);
  return created;
}

export function insertBlockedDate(db: DemoDB, input: Omit<BlockedDate, "id">): BlockedDate {
  const row: BlockedDate = { ...input, id: newId() };
  db.blockedDates.push(row);
  return row;
}

export function statusCounts(db: DemoDB, dentistId?: string): Record<AppointmentStatus, number> {
  const list = dentistId ? db.appointments.filter((a) => a.dentist_id === dentistId) : db.appointments;
  return {
    pending: list.filter((a) => a.status === "pending").length,
    confirmed: list.filter((a) => a.status === "confirmed").length,
    completed: list.filter((a) => a.status === "completed").length,
    cancelled: list.filter((a) => a.status === "cancelled").length,
    no_show: list.filter((a) => a.status === "no_show").length,
  };
}
