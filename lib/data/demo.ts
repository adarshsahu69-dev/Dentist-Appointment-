import { cookies } from "next/headers";
import { verifyPassword } from "../auth/password";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "../auth/session";
import {
  activeAppointmentsForDentist,
  addCredential,
  appointmentsForDentist,
  appointmentsForPatient,
  availabilityForDentist,
  blockedDatesForDentist,
  findDentistByProfile,
  findProfileByEmail,
  getClinic,
  getDentistDetails,
  getDb,
  insertAppointment,
  insertAvailability,
  insertBlockedDate,
  insertClinic,
  insertDentist,
  insertProfile,
  insertService,
  newId,
  pushAuditLog,
  pushNotification,
  removeBlockedDateFromDb,
  serviceBookingCount,
  serviceById,
  statusCounts,
  updateAppointment,
  withLock,
} from "./demo-support";
import { addMinutes, generateSlots, isPastDate, makeReference, normalizeTime, slotIsBookable, toISODate } from "../availability";
import { sendEmail, bookingConfirmationEmail, statusEmail, reminderEmail } from "../notifications";
import type {
  Appointment,
  AppointmentStatus,
  AuditLog,
  Availability,
  BlockedDate,
  DentistFilters,
  DentistWithDetails,
  Profile,
  Service,
  SessionUser,
} from "../types";
import {
  fail,
  ok,
  type AdminStats,
  type AppointmentDetails,
  type AppointmentFilter,
  type AvailabilityInput,
  type DataProvider,
  type DentistStats,
  type NewClinicInput,
  type NewDentistInput,
  type NewServiceInput,
  type ReportData,
} from "./provider";
import type { BookingInput, ProfileUpdateInput, SignupInput } from "../validation";

const resetTokens = new Map<string, { profileId: string; expires: number }>();

function toSessionUser(profile: Profile, dentistId?: string): SessionUser {
  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role,
    phone: profile.phone,
    ...(dentistId ? { dentist_id: dentistId } : {}),
  };
}

async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await signSession({
    sub: user.id,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
  });
  const isLocal = (process.env.NEXT_PUBLIC_APP_URL ?? "").includes("localhost");
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !isLocal,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

async function clearSessionCookie(): Promise<void> {
  cookies().set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

function matchesQuery(appt: Appointment, query: string, db: ReturnType<typeof getDb>): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const dentist = db.dentists.find((d) => d.id === appt.dentist_id);
  const profile = dentist ? db.profiles.find((p) => p.id === dentist.profile_id) : undefined;
  const service = db.services.find((s) => s.id === appt.service_id);
  return (
    appt.reference.toLowerCase().includes(q) ||
    appt.patient_name.toLowerCase().includes(q) ||
    appt.patient_email.toLowerCase().includes(q) ||
    (profile?.full_name.toLowerCase().includes(q) ?? false) ||
    (service?.name.toLowerCase().includes(q) ?? false) ||
    appt.appointment_date.includes(q)
  );
}

export const demoProvider: DataProvider = {
  async getSessionUser() {
    const token = cookies().get(SESSION_COOKIE)?.value;
    const payload = await verifySession(token);
    if (!payload) return null;
    const db = getDb();
    const profile = db.profiles.find((p) => p.id === payload.sub);
    if (!profile) return null;
    const dentist = findDentistByProfile(db, profile.id);
    return toSessionUser(profile, dentist?.id);
  },

  async listProfiles(role) {
    const db = getDb();
    return db.profiles.filter((p) => (role ? p.role === role : true));
  },

  async signUp(input: SignupInput) {
    const db = getDb();
    const email = input.email.trim().toLowerCase();
    if (findProfileByEmail(db, email)) {
      return fail("An account with this email already exists.", { email: "Email already registered" });
    }
    const profile = insertProfile(db, {
      full_name: input.full_name.trim(),
      email,
      phone: input.phone.trim(),
      role: "patient",
    });
    addCredential(db, profile.id, input.password);
    pushNotification(db, {
      user_id: profile.id,
      notification_type: "system",
      message: "Welcome to DentalCare. Complete your profile to speed up future bookings.",
    });
    const user = toSessionUser(profile);
    await setSessionCookie(user);
    // Attach any guest bookings made with the same email address.
    await this.linkOrphanAppointments(email, profile.id);
    return ok(user);
  },

  async signIn(email, password) {
    const db = getDb();
    const profile = findProfileByEmail(db, email);
    if (!profile) return fail("Invalid email or password.");
    const credential = db.credentials.find((c) => c.profile_id === profile.id);
    if (!credential || !verifyPassword(password, credential.password_hash)) {
      return fail("Invalid email or password.");
    }
    const dentist = findDentistByProfile(db, profile.id);
    const user = toSessionUser(profile, dentist?.id);
    await setSessionCookie(user);
    return ok(user);
  },

  async signOut() {
    await clearSessionCookie();
  },

  async requestPasswordReset(email) {
    const db = getDb();
    const profile = findProfileByEmail(db, email);
    // Always return success to avoid leaking which emails are registered.
    if (!profile) return ok({ token: null });
    const token = newId();
    resetTokens.set(token, { profileId: profile.id, expires: Date.now() + 30 * 60 * 1000 });
    return ok({ token });
  },

  async resetPassword(token, password) {
    const entry = resetTokens.get(token);
    if (!entry || entry.expires < Date.now()) return fail("This reset link is invalid or has expired.");
    const db = getDb();
    db.credentials = db.credentials.filter((c) => c.profile_id !== entry.profileId);
    addCredential(db, entry.profileId, password);
    resetTokens.delete(token);
    return ok(true);
  },

  async updateProfile(userId, input: ProfileUpdateInput) {
    const db = getDb();
    const profile = db.profiles.find((p) => p.id === userId);
    if (!profile) return fail("Profile not found.");
    profile.full_name = input.full_name.trim();
    profile.phone = input.phone.trim();
    return ok(toSessionUser(profile, findDentistByProfile(db, profile.id)?.id));
  },

  async linkOrphanAppointments(email, userId) {
    const db = getDb();
    let linked = 0;
    for (const appt of db.appointments) {
      if (!appt.patient_id && appt.patient_email.toLowerCase() === email.toLowerCase()) {
        appt.patient_id = userId;
        linked += 1;
      }
    }
    return linked;
  },

  async listServices() {
    return getDb().services.filter((s) => s.is_active);
  },

  async listAllServices() {
    return getDb().services;
  },

  async getService(id) {
    return serviceById(getDb(), id) ?? null;
  },

  async listClinics() {
    return getDb().clinics;
  },

  async getClinic(id) {
    return getClinic(getDb(), id) ?? null;
  },

  async listDentists(filters: DentistFilters = {}) {
    const db = getDb();
    let list = db.dentists.map((d) => getDentistDetails(db, d.id)).filter((d): d is DentistWithDetails => d !== null);
    if (filters.specialization) {
      list = list.filter((d) => d.specialization.toLowerCase().includes(filters.specialization!.toLowerCase()));
    }
    if (filters.clinic_id) list = list.filter((d) => d.clinic_id === filters.clinic_id);
    if (filters.service_id) list = list.filter((d) => d.service_ids.includes(filters.service_id!));
    if (filters.query) {
      const q = filters.query.toLowerCase();
      list = list.filter(
        (d) =>
          d.profile.full_name.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q) ||
          d.qualifications.toLowerCase().includes(q),
      );
    }
    if (filters.available_day !== undefined) {
      list = list.filter((d) =>
        availabilityForDentist(db, d.id).some((a) => a.day_of_week === filters.available_day),
      );
    }
    return list;
  },

  async getDentist(id) {
    return getDentistDetails(getDb(), id);
  },

  async listAvailability(dentistId) {
    return availabilityForDentist(getDb(), dentistId).sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time));
  },

  async listBlockedDates(dentistId) {
    return blockedDatesForDentist(getDb(), dentistId).sort((a, b) => a.blocked_date.localeCompare(b.blocked_date));
  },

  async getSlotsFor(dentistId, serviceId, date) {
    const db = getDb();
    const service = serviceById(db, serviceId);
    if (!service) return [];
    const slots = generateSlots({
      date,
      now: new Date(),
      availability: availabilityForDentist(db, dentistId),
      durationMinutes: service.duration_minutes,
      blockedDates: blockedDatesForDentist(db, dentistId),
      existingAppointments: activeAppointmentsForDentist(db, dentistId, date),
    });
    return slots;
  },

  async createBooking(input: BookingInput) {
    const db = getDb();
    const service = serviceById(db, input.service_id);
    const dentist = db.dentists.find((d) => d.id === input.dentist_id);
    const clinic = getClinic(db, input.clinic_id);
    if (!service) return fail("Selected service no longer exists.");
    if (!dentist) return fail("Selected dentist no longer exists.");
    if (!dentist.is_active) return fail("This dentist is not accepting appointments.");
    if (!clinic) return fail("Selected clinic no longer exists.");
    if (!db.dentistServices.some((ds) => ds.dentist_id === dentist.id && ds.service_id === service.id)) {
      return fail("This dentist does not offer the selected service.");
    }
    if (isPastDate(input.appointment_date, new Date())) return fail("Appointment date cannot be in the past.");

    // The lock + overlap check is the demo-mode equivalent of the Postgres
    // exclusion constraint used in production (see supabase/migrations).
    return withLock(async () => {
      const existing = activeAppointmentsForDentist(db, dentist.id, input.appointment_date);
      const check = slotIsBookable({
        date: input.appointment_date,
        startTime: input.start_time,
        durationMinutes: service.duration_minutes,
        availability: availabilityForDentist(db, dentist.id),
        blockedDates: blockedDatesForDentist(db, dentist.id),
        existingAppointments: existing,
      });
      if (!check.ok) return fail(check.error);

      const user = await this.getSessionUser();
      const start = normalizeTime(input.start_time);
      const end = addMinutes(start, service.duration_minutes);
      const reference = makeReference();

      const appointment = insertAppointment(db, {
        reference,
        patient_id: user?.id ?? null,
        dentist_id: dentist.id,
        service_id: service.id,
        clinic_id: clinic.id,
        appointment_date: input.appointment_date,
        start_time: start,
        end_time: end,
        status: "pending",
        patient_notes: input.patient_notes?.trim() || null,
        patient_name: input.patient_name.trim(),
        patient_email: input.patient_email.trim().toLowerCase(),
        patient_phone: input.patient_phone.trim(),
      });

      const dentistProfile = db.profiles.find((p) => p.id === dentist.profile_id);
      pushNotification(db, {
        user_id: dentistProfile!.id,
        appointment_id: appointment.id,
        notification_type: "system",
        message: `New booking request ${appointment.reference} from ${appointment.patient_name} on ${appointment.appointment_date} at ${start}.`,
      });
      const email = bookingConfirmationEmail({
        patientName: appointment.patient_name,
        reference: appointment.reference,
        service: service.name,
        dentist: dentistProfile?.full_name ?? "our dentist",
        date: appointment.appointment_date,
        time: start,
        clinic: clinic.name,
        clinicAddress: `${clinic.address}, ${clinic.city}`,
      });
      await sendEmail({ ...email, to: appointment.patient_email });
      return ok(appointment);
    });
  },

  async cancelAppointment(id) {
    const db = getDb();
    const appt = db.appointments.find((a) => a.id === id);
    if (!appt) return fail("Appointment not found.");
    if (appt.status === "cancelled") return fail("Appointment is already cancelled.");
    if (appt.status === "completed") return fail("Completed appointments cannot be cancelled.");

    return withLock(async () => {
      updateAppointment(db, id, { status: "cancelled" });
      await notifyStatusChange(db, appt, "cancelled");
      return ok(appt);
    });
  },

  async rescheduleAppointment(id, date, startTime) {
    const db = getDb();
    const appt = db.appointments.find((a) => a.id === id);
    if (!appt) return fail("Appointment not found.");
    if (appt.status !== "pending" && appt.status !== "confirmed") {
      return fail("Only pending or confirmed appointments can be rescheduled.");
    }
    const service = serviceById(db, appt.service_id);
    if (!service) return fail("Service no longer exists.");

    return withLock(async () => {
      const others = activeAppointmentsForDentist(db, appt.dentist_id).filter((a) => a.id !== id);
      const check = slotIsBookable({
        date,
        startTime,
        durationMinutes: service.duration_minutes,
        availability: availabilityForDentist(db, appt.dentist_id),
        blockedDates: blockedDatesForDentist(db, appt.dentist_id),
        existingAppointments: others,
      });
      if (!check.ok) return fail(check.error);
      const start = normalizeTime(startTime);
      const updated = updateAppointment(db, id, {
        appointment_date: date,
        start_time: start,
        end_time: addMinutes(start, service.duration_minutes),
      })!;
      await notifyStatusChange(db, updated, "rescheduled");
      return ok(updated);
    });
  },

  async listAppointmentsForPatient(patientId) {
    return appointmentsForPatient(getDb(), patientId);
  },

  async listAppointmentsForDentist(dentistId) {
    return appointmentsForDentist(getDb(), dentistId);
  },

  async listAllAppointments(filter: AppointmentFilter) {
    const db = getDb();
    let items = [...db.appointments].sort((a, b) =>
      a.appointment_date + a.start_time < b.appointment_date + b.start_time ? 1 : -1,
    );
    if (filter.status && filter.status !== "all") items = items.filter((a) => a.status === filter.status);
    if (filter.dentist_id) items = items.filter((a) => a.dentist_id === filter.dentist_id);
    if (filter.date) items = items.filter((a) => a.appointment_date === filter.date);
    if (filter.date_from) items = items.filter((a) => a.appointment_date >= filter.date_from!);
    if (filter.date_to) items = items.filter((a) => a.appointment_date <= filter.date_to!);
    if (filter.query) items = items.filter((a) => matchesQuery(a, filter.query!, db));
    const total = items.length;
    const page = filter.page ?? 1;
    const pageSize = filter.page_size ?? 20;
    return { items: items.slice((page - 1) * pageSize, page * pageSize), total };
  },

  async getAppointment(id) {
    return getDb().appointments.find((a) => a.id === id) ?? null;
  },

  async getAppointmentDetails(id) {
    const db = getDb();
    const appt = db.appointments.find((a) => a.id === id);
    if (!appt) return null;
    const dentist = getDentistDetails(db, appt.dentist_id);
    const service = serviceById(db, appt.service_id);
    const clinic = getClinic(db, appt.clinic_id);
    if (!dentist || !service || !clinic) return null;
    const patientProfile = appt.patient_id ? db.profiles.find((p) => p.id === appt.patient_id) : undefined;
    return {
      appointment: appt,
      patient: patientProfile
        ? { id: patientProfile.id, full_name: patientProfile.full_name, email: patientProfile.email, phone: patientProfile.phone }
        : { id: appt.patient_name, full_name: appt.patient_name, email: appt.patient_email, phone: appt.patient_phone },
      dentist,
      service,
      clinic,
    };
  },

  async enrichAppointments(appointments) {
    const out: AppointmentDetails[] = [];
    for (const appt of appointments) {
      const details = await this.getAppointmentDetails(appt.id);
      if (details) out.push(details);
    }
    return out;
  },

  async setAppointmentStatus(id, status) {
    const db = getDb();
    const appt = db.appointments.find((a) => a.id === id);
    if (!appt) return fail("Appointment not found.");
    if (appt.status === status) return ok(appt);
    return withLock(async () => {
      // A slot may only be re-used once the previous appointment releases it.
      if ((status === "pending" || status === "confirmed") && appt.status !== status) {
        const others = activeAppointmentsForDentist(db, appt.dentist_id, appt.appointment_date).filter((a) => a.id !== id);
        const clash = others.find(
          (a) =>
            a.appointment_date === appt.appointment_date &&
            a.start_time < appt.end_time &&
            appt.start_time < a.end_time,
        );
        if (clash) return fail("Another appointment now occupies this slot.");
      }
      const updated = updateAppointment(db, id, { status })!;
      await notifyStatusChange(db, updated, status === "confirmed" ? "confirmed" : "cancelled");
      return ok(updated);
    });
  },

  async setAppointmentNotes(id, notes) {
    const db = getDb();
    const updated = updateAppointment(db, id, { patient_notes: notes });
    if (!updated) return fail("Appointment not found.");
    return ok(updated);
  },

  async replaceAvailability(dentistId, rows) {
    const db = getDb();
    return withLock(() => {
      db.availability = db.availability.filter((a) => a.dentist_id !== dentistId);
      const created = insertAvailability(
        db,
        rows.map((r) => ({ ...r, dentist_id: dentistId })),
      );
      pushAuditLog(db, { actor_id: null, action: "availability.updated", entity: "dentist_availability", entity_id: dentistId, metadata: { days: rows.length } });
      return ok(created);
    });
  },

  async addBlockedDate(dentistId, date, reason) {
    const db = getDb();
    const exists = db.blockedDates.find((b) => b.dentist_id === dentistId && b.blocked_date === date);
    if (exists) return fail("This date is already blocked.");
    // Blocking a date must not silently drop confirmed bookings.
    const existing = activeAppointmentsForDentist(db, dentistId, date);
    if (existing.length > 0) {
      return fail(`This date has ${existing.length} active appointment(s). Cancel them first.`);
    }
    return ok(insertBlockedDate(db, { dentist_id: dentistId, blocked_date: date, reason }));
  },

  async removeBlockedDate(id) {
    const db = getDb();
    removeBlockedDateFromDb(db, id);
    return ok(true);
  },

  async createDentist(input: NewDentistInput) {
    const db = getDb();
    const email = input.email.trim().toLowerCase();
    if (findProfileByEmail(db, email)) return fail("A user with this email already exists.", { email: "Already in use" });
    const profile = insertProfile(db, {
      full_name: input.full_name.trim(),
      email,
      phone: input.phone.trim(),
      role: "dentist",
    });
    addCredential(db, profile.id, input.password);
    const dentist = insertDentist(db, {
      profile_id: profile.id,
      specialization: input.specialization,
      qualifications: input.qualifications,
      experience_years: input.experience_years,
      biography: input.biography,
      clinic_id: input.clinic_id,
      is_active: true,
    });
    input.service_ids.forEach((service_id) => {
      db.dentistServices.push({ dentist_id: dentist.id, service_id });
    });
    pushAuditLog(db, { actor_id: null, action: "dentist.created", entity: "dentists", entity_id: dentist.id, metadata: { email } });
    return ok(getDentistDetails(db, dentist.id)!);
  },

  async updateDentist(id, patch) {
    const db = getDb();
    const dentist = db.dentists.find((d) => d.id === id);
    if (!dentist) return fail("Dentist not found.");
    const profile = db.profiles.find((p) => p.id === dentist.profile_id);
    if (patch.full_name && profile) profile.full_name = patch.full_name;
    if (patch.email && profile) profile.email = patch.email.trim().toLowerCase();
    Object.assign(dentist, {
      specialization: patch.specialization ?? dentist.specialization,
      qualifications: patch.qualifications ?? dentist.qualifications,
      experience_years: patch.experience_years ?? dentist.experience_years,
      biography: patch.biography ?? dentist.biography,
      clinic_id: patch.clinic_id ?? dentist.clinic_id,
      is_active: patch.is_active ?? dentist.is_active,
    });
    if (patch.service_ids) {
      db.dentistServices = db.dentistServices.filter((ds) => ds.dentist_id !== id);
      patch.service_ids.forEach((service_id) => db.dentistServices.push({ dentist_id: id, service_id }));
    }
    pushAuditLog(db, { actor_id: null, action: "dentist.updated", entity: "dentists", entity_id: id });
    return ok(getDentistDetails(db, id)!);
  },

  async createService(input: NewServiceInput) {
    const db = getDb();
    const service = insertService(db, { ...input, name: input.name.trim() });
    pushAuditLog(db, { actor_id: null, action: "service.created", entity: "services", entity_id: service.id });
    return ok(service);
  },

  async updateService(id, patch) {
    const db = getDb();
    const service = serviceById(db, id);
    if (!service) return fail("Service not found.");
    Object.assign(service, patch);
    pushAuditLog(db, { actor_id: null, action: "service.updated", entity: "services", entity_id: id });
    return ok(service);
  },

  async createClinic(input: NewClinicInput) {
    const db = getDb();
    const clinic = insertClinic(db, input);
    pushAuditLog(db, { actor_id: null, action: "clinic.created", entity: "clinics", entity_id: clinic.id });
    return ok(clinic);
  },

  async updateClinic(id, patch) {
    const db = getDb();
    const clinic = getClinic(db, id);
    if (!clinic) return fail("Clinic not found.");
    Object.assign(clinic, patch);
    pushAuditLog(db, { actor_id: null, action: "clinic.updated", entity: "clinics", entity_id: id });
    return ok(clinic);
  },

  async getStats() {
    const db = getDb();
    const today = toISODate(new Date());
    const counts = statusCounts(db);
    return {
      total_patients: db.profiles.filter((p) => p.role === "patient").length,
      total_dentists: db.dentists.length,
      active_dentists: db.dentists.filter((d) => d.is_active).length,
      todays_appointments: db.appointments.filter((a) => a.appointment_date === today).length,
      upcoming_appointments: db.appointments.filter((a) => a.appointment_date > today && (a.status === "pending" || a.status === "confirmed")).length,
      cancelled_appointments: counts.cancelled,
      completed_appointments: counts.completed,
      total_appointments: db.appointments.length,
      pending_requests: counts.pending,
      unread_notifications: db.notifications.filter((n) => !n.is_read).length,
    } satisfies AdminStats;
  },

  async getDentistStats(dentistId) {
    const db = getDb();
    const today = toISODate(new Date());
    const list = appointmentsForDentist(db, dentistId);
    const counts = statusCounts(db, dentistId);
    return {
      today: list.filter((a) => a.appointment_date === today && a.status !== "cancelled").length,
      upcoming: list.filter((a) => a.appointment_date > today && (a.status === "pending" || a.status === "confirmed")).length,
      completed: counts.completed,
      pending: counts.pending,
      cancelled: counts.cancelled,
      total: list.length,
    } satisfies DentistStats;
  },

  async getReports() {
    const db = getDb();
    const today = new Date();
    const iso = (offset: number) => {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + offset));
      return d.toISOString().slice(0, 10);
    };
    const dailyVolume = Array.from({ length: 14 }, (_, i) => {
      const date = iso(i - 13);
      return { date, count: db.appointments.filter((a) => a.appointment_date === date && a.status !== "cancelled").length };
    });

    const weeklyVolume = Array.from({ length: 8 }, (_, i) => {
      const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 6 - i * 7));
      const end = new Date(start.getTime() + 6 * 86400000);
      const startStr = start.toISOString().slice(0, 10);
      const endStr = end.toISOString().slice(0, 10);
      return {
        week: startStr,
        count: db.appointments.filter((a) => a.appointment_date >= startStr && a.appointment_date <= endStr && a.status !== "cancelled").length,
      };
    }).reverse();

    const monthlyVolume = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5 + i, 1));
      const month = d.toISOString().slice(0, 7);
      return { month, count: db.appointments.filter((a) => a.appointment_date.startsWith(month) && a.status !== "cancelled").length };
    });

    const statuses: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled", "no_show"];
    const statusDistribution = statuses.map((status) => ({
      status,
      count: db.appointments.filter((a) => a.status === status).length,
    }));

    const popularServices = db.services
      .map((s) => ({ service: s.name, count: serviceBookingCount(db, s.id) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const perDentist = db.dentists.map((d) => ({
      dentist: db.profiles.find((p) => p.id === d.profile_id)?.full_name ?? "Unknown",
      count: db.appointments.filter((a) => a.dentist_id === d.id && a.status !== "cancelled").length,
    }));

    const total = db.appointments.length || 1;
    return {
      dailyVolume,
      weeklyVolume,
      monthlyVolume,
      statusDistribution,
      popularServices,
      perDentist,
      completionRate: Math.round((db.appointments.filter((a) => a.status === "completed").length / total) * 100),
      cancellationRate: Math.round((db.appointments.filter((a) => a.status === "cancelled").length / total) * 100),
      noShowRate: Math.round((db.appointments.filter((a) => a.status === "no_show").length / total) * 100),
    } satisfies ReportData;
  },

  async listAuditLogs() {
    return getDb().auditLogs;
  },

  async listNotifications(userId) {
    return getDb()
      .notifications.filter((n) => n.user_id === userId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },

  async markNotificationRead(id, userId) {
    const db = getDb();
    const notification = db.notifications.find((n) => n.id === id && n.user_id === userId);
    if (!notification) return fail("Notification not found.");
    notification.is_read = true;
    return ok(true);
  },

  async markAllNotificationsRead(userId) {
    const db = getDb();
    db.notifications.forEach((n) => {
      if (n.user_id === userId) n.is_read = true;
    });
    return ok(true);
  },

  async sendDueReminders() {
    const db = getDb();
    const inThreeDays = toISODate(new Date(Date.now() + 3 * 86400000));
    const due = db.appointments.filter(
      (a) =>
        a.appointment_date === inThreeDays &&
        (a.status === "pending" || a.status === "confirmed") &&
        !db.notifications.some((n) => n.appointment_id === a.id && n.notification_type === "reminder"),
    );
    let sent = 0;
    for (const appt of due) {
      const service = serviceById(db, appt.service_id);
      const clinic = getClinic(db, appt.clinic_id);
      const email = reminderEmail({
        patientName: appt.patient_name,
        reference: appt.reference,
        date: appt.appointment_date,
        time: appt.start_time,
        clinic: clinic?.name ?? "DentalCare",
      });
      const result = await sendEmail({ ...email, to: appt.patient_email });
      if (result.delivered) sent += 1;
      if (appt.patient_id) {
        pushNotification(db, {
          user_id: appt.patient_id,
          appointment_id: appt.id,
          notification_type: "reminder",
          message: `Reminder: appointment ${appt.reference}${service ? ` for ${service.name}` : ""} is on ${appt.appointment_date} at ${appt.start_time}.`,
        });
      }
    }
    return { sent, skipped: due.length - sent };
  },
};

async function notifyStatusChange(db: ReturnType<typeof getDb>, appt: Appointment, kind: "confirmed" | "cancelled" | "rescheduled") {
  const messages: Record<string, string> = {
    confirmed: `Appointment ${appt.reference} has been confirmed for ${appt.appointment_date} at ${appt.start_time}.`,
    cancelled: `Appointment ${appt.reference} on ${appt.appointment_date} has been cancelled. The time slot is available again.`,
    rescheduled: `Appointment ${appt.reference} has been rescheduled to ${appt.appointment_date} at ${appt.start_time}.`,
  };
  if (appt.patient_id) {
    pushNotification(db, {
      user_id: appt.patient_id,
      appointment_id: appt.id,
      notification_type: kind === "confirmed" ? "approved" : kind,
      message: messages[kind],
    });
  }
  const dentist = db.dentists.find((d) => d.id === appt.dentist_id);
  if (dentist) {
    const profile = db.profiles.find((p) => p.id === dentist.profile_id);
    if (profile) {
      pushNotification(db, {
        user_id: profile.id,
        appointment_id: appt.id,
        notification_type: "system",
        message: messages[kind],
      });
    }
  }
  const email = statusEmail({
    patientName: appt.patient_name,
    reference: appt.reference,
    status: kind,
    date: appt.appointment_date,
    time: appt.start_time,
    dentist: db.profiles.find((p) => p.id === dentist?.profile_id)?.full_name,
  });
  await sendEmail({ ...email, to: appt.patient_email });
};
