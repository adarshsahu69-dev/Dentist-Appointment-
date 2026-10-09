import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { generateSlots, normalizeTime, toISODate } from "../availability";
import { sendEmail, bookingConfirmationEmail, statusEmail } from "../notifications";
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
import type {
  Appointment,
  AppointmentStatus,
  AuditLog,
  Availability,
  BlockedDate,
  Clinic,
  DentistFilters,
  DentistWithDetails,
  Notification,
  Profile,
  Service,
  SessionUser,
  Slot,
} from "../types";

/* Row shapes as returned by Postgres (snake_case). */
interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: "patient" | "dentist" | "admin";
  created_at: string;
}
interface DentistRow {
  id: string;
  profile_id: string;
  specialization: string;
  qualifications: string;
  experience_years: number;
  biography: string;
  clinic_id: string;
  is_active: boolean;
}
interface AppointmentRow {
  id: string;
  reference: string;
  patient_id: string | null;
  dentist_id: string;
  service_id: string;
  clinic_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  patient_notes: string | null;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  created_at: string;
  updated_at: string;
}

function failFromError(error: { message: string } | null, fallback: string) {
  return fail(error?.message ?? fallback);
}

function mapAppointment(row: AppointmentRow): Appointment {
  return {
    ...row,
    start_time: normalizeTime(row.start_time),
    end_time: normalizeTime(row.end_time),
  };
}

async function sessionUserFromDb(userId: string): Promise<SessionUser | null> {
  const supabase = createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!profile) return null;
  const { data: dentist } = await supabase.from("dentists").select("id").eq("profile_id", userId).maybeSingle();
  const p = profile as ProfileRow;
  return {
    id: p.id,
    email: p.email,
    full_name: p.full_name,
    role: p.role,
    phone: p.phone,
    ...(dentist ? { dentist_id: (dentist as { id: string }).id } : {}),
  };
}

export const supabaseProvider: DataProvider = {
  async getSessionUser() {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return sessionUserFromDb(data.user.id);
  },

  async listProfiles(role) {
    const admin = createAdminClient();
    let query = admin.from("profiles").select("*").order("created_at", { ascending: false });
    if (role) query = query.eq("role", role);
    const { data } = await query;
    return (data ?? []) as Profile[];
  },

  async signUp(input: SignupInput) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: {
        data: { full_name: input.full_name.trim(), phone: input.phone.trim(), role: "patient" },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/callback`,
      },
    });
    if (error) return fail(error.message, { email: error.message });
    if (!data.user) return fail("Signup failed. Please try again.");
    await this.linkOrphanAppointments(input.email, data.user.id);
    const user = await sessionUserFromDb(data.user.id);
    if (!user) return fail("Account created, but the profile could not be loaded.");
    return ok(user);
  },

  async signIn(email, password) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return fail("Invalid email or password.");
    const { data } = await supabase.auth.getUser();
    if (!data.user) return fail("Invalid email or password.");
    const user = await sessionUserFromDb(data.user.id);
    if (!user) return fail("Invalid email or password.");
    return ok(user);
  },

  async signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
  },

  async requestPasswordReset(email) {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/reset-password`,
    });
    // Do not reveal whether the address exists.
    if (error && error.status !== 429) console.error("[auth] reset request error", error.message);
    return ok({ token: null });
  },

  async resetPassword(token, password) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: token, type: "recovery" });
    if (error) return fail("This reset link is invalid or has expired.");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) return fail(updateError.message);
    return ok(true);
  },

  async updateProfile(userId, input: ProfileUpdateInput) {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: input.full_name.trim(), phone: input.phone.trim() })
      .eq("id", userId);
    if (error) return failFromError(error, "Could not update profile.");
    const user = await sessionUserFromDb(userId);
    return user ? ok(user) : fail("Profile not found.");
  },

  async linkOrphanAppointments(email, userId) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("appointments")
      .update({ patient_id: userId })
      .eq("patient_email", email)
      .is("patient_id", null)
      .select("id");
    return data?.length ?? 0;
  },

  async listServices() {
    const supabase = createClient();
    const { data } = await supabase.from("services").select("*").eq("is_active", true).order("name");
    return (data ?? []) as Service[];
  },

  async listAllServices() {
    const admin = createAdminClient();
    const { data } = await admin.from("services").select("*").order("name");
    return (data ?? []) as Service[];
  },

  async getService(id) {
    const supabase = createClient();
    const { data } = await supabase.from("services").select("*").eq("id", id).maybeSingle();
    return (data as Service) ?? null;
  },

  async listClinics() {
    const supabase = createClient();
    const { data } = await supabase.from("clinics").select("*").order("name");
    return (data ?? []) as Clinic[];
  },

  async getClinic(id) {
    const supabase = createClient();
    const { data } = await supabase.from("clinics").select("*").eq("id", id).maybeSingle();
    return (data as Clinic) ?? null;
  },

  async listDentists(filters: DentistFilters = {}) {
    const supabase = createClient();
    let query = supabase
      .from("dentists")
      .select("*, profile:profiles!dentists_profile_id_fkey(*), clinic:clinics(*)")
      .eq("is_active", true);
    if (filters.specialization) query = query.ilike("specialization", `%${filters.specialization}%`);
    if (filters.clinic_id) query = query.eq("clinic_id", filters.clinic_id);
    if (filters.service_id) query = query.contains("service_ids", [filters.service_id]);
    if (filters.query) query = query.or(`specialization.ilike.%${filters.query}%,profile.full_name.ilike.%${filters.query}%`);
    const { data, error } = await query;
    if (error) return [];
    let list = (data ?? []).map((row) => {
      const r = row as unknown as DentistRow & { profile: ProfileRow; clinic: Clinic; service_ids: string[] };
      return { ...r, service_ids: r.service_ids ?? [] } as DentistWithDetails;
    });
    if (filters.available_day !== undefined) {
      const { data: avail } = await supabase
        .from("dentist_availability")
        .select("dentist_id")
        .eq("day_of_week", filters.available_day);
      const ids = new Set((avail ?? []).map((a) => (a as { dentist_id: string }).dentist_id));
      list = list.filter((d) => ids.has(d.id));
    }
    return list;
  },

  async getDentist(id) {
    const supabase = createClient();
    const { data } = await supabase
      .from("dentists")
      .select("*, profile:profiles!dentists_profile_id_fkey(*), clinic:clinics(*)")
      .eq("id", id)
      .maybeSingle();
    if (!data) return null;
    const r = data as unknown as DentistRow & { profile: ProfileRow; clinic: Clinic };
    const { data: links } = await supabase.from("dentist_services").select("service_id").eq("dentist_id", id);
    return {
      ...r,
      service_ids: (links ?? []).map((l) => (l as { service_id: string }).service_id),
    } as DentistWithDetails;
  },

  async listAvailability(dentistId) {
    const supabase = createClient();
    const { data } = await supabase
      .from("dentist_availability")
      .select("*")
      .eq("dentist_id", dentistId)
      .order("day_of_week");
    return ((data ?? []) as Availability[]).map((a) => ({
      ...a,
      start_time: normalizeTime(a.start_time),
      end_time: normalizeTime(a.end_time),
      break_start: a.break_start ? normalizeTime(a.break_start) : null,
      break_end: a.break_end ? normalizeTime(a.break_end) : null,
    }));
  },

  async listBlockedDates(dentistId) {
    const supabase = createClient();
    const { data } = await supabase.from("blocked_dates").select("*").eq("dentist_id", dentistId).order("blocked_date");
    return (data ?? []) as BlockedDate[];
  },

  async getSlotsFor(dentistId, serviceId, date) {
    const service = await this.getService(serviceId);
    if (!service) return [];
    const [availability, blockedDates, appointments] = await Promise.all([
      this.listAvailability(dentistId),
      this.listBlockedDates(dentistId),
      (async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from("appointments")
          .select("*")
          .eq("dentist_id", dentistId)
          .eq("appointment_date", date)
          .in("status", ["pending", "confirmed"]);
        return ((data ?? []) as AppointmentRow[]).map(mapAppointment);
      })(),
    ]);
    return generateSlots({ date, now: new Date(), availability, durationMinutes: service.duration_minutes, blockedDates, existingAppointments: appointments });
  },

  async createBooking(input: BookingInput) {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("book_appointment", {
      p_service_id: input.service_id,
      p_dentist_id: input.dentist_id,
      p_clinic_id: input.clinic_id,
      p_appointment_date: input.appointment_date,
      p_start_time: input.start_time,
      p_patient_name: input.patient_name.trim(),
      p_patient_email: input.patient_email.trim().toLowerCase(),
      p_patient_phone: input.patient_phone.trim(),
      p_patient_notes: input.patient_notes?.trim() || null,
    });
    if (error) return failFromError(error, "Booking failed. Please try again.");
    const result = data as { ok: boolean; error?: string; appointment?: AppointmentRow };
    if (!result.ok) return fail(result.error ?? "Booking failed. Please try again.");
    const row = result.appointment!;
    const appointment = mapAppointment(row);
    // Fire-and-forget notifications (in-app rows + email when configured).
    await notifyBookingCreated(appointment);
    return ok(appointment);
  },

  async cancelAppointment(id) {
    const user = await this.getSessionUser();
    if (!user) return fail("You must be signed in.");
    const supabase = createClient();
    const { data, error } = await supabase.rpc("cancel_appointment", { p_appointment_id: id });
    if (error) return failFromError(error, "Cancellation failed.");
    const result = data as { ok: boolean; error?: string; appointment?: AppointmentRow };
    if (!result.ok) return fail(result.error ?? "Cancellation failed.");
    return ok(mapAppointment(result.appointment!));
  },

  async rescheduleAppointment(id, date, startTime) {
    const user = await this.getSessionUser();
    if (!user) return fail("You must be signed in.");
    const supabase = createClient();
    const { data, error } = await supabase.rpc("reschedule_appointment", {
      p_appointment_id: id,
      p_appointment_date: date,
      p_start_time: startTime,
    });
    if (error) return failFromError(error, "Rescheduling failed.");
    const result = data as { ok: boolean; error?: string; appointment?: AppointmentRow };
    if (!result.ok) return fail(result.error ?? "Rescheduling failed.");
    return ok(mapAppointment(result.appointment!));
  },

  async listAppointmentsForPatient(patientId) {
    const supabase = createClient();
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("patient_id", patientId)
      .order("appointment_date", { ascending: false });
    return ((data ?? []) as AppointmentRow[]).map(mapAppointment);
  },

  async listAppointmentsForDentist(dentistId) {
    const supabase = createClient();
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("dentist_id", dentistId)
      .order("appointment_date", { ascending: false });
    return ((data ?? []) as AppointmentRow[]).map(mapAppointment);
  },

  async listAllAppointments(filter: AppointmentFilter) {
    const admin = createAdminClient();
    let query = admin.from("appointments").select("*", { count: "exact" }).order("appointment_date", { ascending: false });
    if (filter.status && filter.status !== "all") query = query.eq("status", filter.status);
    if (filter.dentist_id) query = query.eq("dentist_id", filter.dentist_id);
    if (filter.date) query = query.eq("appointment_date", filter.date);
    if (filter.date_from) query = query.gte("appointment_date", filter.date_from);
    if (filter.date_to) query = query.lte("appointment_date", filter.date_to);
    if (filter.query) {
      const q = filter.query.trim();
      query = query.or(`reference.ilike.%${q}%,patient_name.ilike.%${q}%,patient_email.ilike.%${q}%`);
    }
    const page = filter.page ?? 1;
    const pageSize = filter.page_size ?? 20;
    const { data, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
    if (error) return { items: [], total: 0 };
    return { items: ((data ?? []) as AppointmentRow[]).map(mapAppointment), total: count ?? 0 };
  },

  async getAppointment(id) {
    const supabase = createClient();
    const { data } = await supabase.from("appointments").select("*").eq("id", id).maybeSingle();
    return data ? mapAppointment(data as AppointmentRow) : null;
  },

  async getAppointmentDetails(id) {
    const appointment = await this.getAppointment(id);
    if (!appointment) return null;
    const admin = createAdminClient();
    const [{ data: dentist }, { data: service }, { data: clinic }, { data: patient }] = await Promise.all([
      admin
        .from("dentists")
        .select("*, profile:profiles!dentists_profile_id_fkey(*), clinic:clinics(*)")
        .eq("id", appointment.dentist_id)
        .maybeSingle(),
      admin.from("services").select("*").eq("id", appointment.service_id).maybeSingle(),
      admin.from("clinics").select("*").eq("id", appointment.clinic_id).maybeSingle(),
      appointment.patient_id
        ? admin.from("profiles").select("id, full_name, email, phone").eq("id", appointment.patient_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    const d = dentist as unknown as (DentistRow & { profile: ProfileRow; clinic: Clinic }) | null;
    if (!d || !service || !clinic) return null;
    const { data: links } = await admin.from("dentist_services").select("service_id").eq("dentist_id", d.id);
    return {
      appointment,
      dentist: { ...d, service_ids: (links ?? []).map((l) => (l as { service_id: string }).service_id) } as DentistWithDetails,
      service: service as Service,
      clinic: clinic as Clinic,
      patient: (patient as { id: string; full_name: string; email: string; phone: string | null } | null) ?? {
        id: appointment.patient_name,
        full_name: appointment.patient_name,
        email: appointment.patient_email,
        phone: appointment.patient_phone,
      },
    } satisfies AppointmentDetails;
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
    const supabase = createClient();
    const { data, error } = await supabase.rpc("set_appointment_status", {
      p_appointment_id: id,
      p_status: status,
    });
    if (error) return failFromError(error, "Could not update status.");
    const result = data as { ok: boolean; error?: string; appointment?: AppointmentRow };
    if (!result.ok) return fail(result.error ?? "Could not update status.");
    return ok(mapAppointment(result.appointment!));
  },

  async setAppointmentNotes(id, notes) {
    const user = await this.getSessionUser();
    if (!user) return fail("You must be signed in.");
    const supabase = createClient();
    const { error } = await supabase.from("appointments").update({ patient_notes: notes }).eq("id", id);
    if (error) return failFromError(error, "Could not save notes.");
    const updated = await this.getAppointment(id);
    return updated ? ok(updated) : fail("Appointment not found.");
  },

  async replaceAvailability(dentistId, rows: AvailabilityInput[]) {
    const supabase = createClient();
    const { error } = await supabase.from("dentist_availability").delete().eq("dentist_id", dentistId);
    if (error) return failFromError(error, "Could not update availability.");
    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from("dentist_availability")
        .insert(rows.map((r) => ({ ...r, dentist_id: dentistId })));
      if (insertError) return failFromError(insertError, "Could not update availability.");
    }
    return ok(await this.listAvailability(dentistId));
  },

  async addBlockedDate(dentistId, date, reason) {
    const supabase = createClient();
    const active = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("dentist_id", dentistId)
      .eq("appointment_date", date)
      .in("status", ["pending", "confirmed"]);
    if (active.count && active.count > 0) {
      return fail(`This date has ${active.count} active appointment(s). Cancel them first.`);
    }
    const { data, error } = await supabase
      .from("blocked_dates")
      .insert({ dentist_id: dentistId, blocked_date: date, reason })
      .select()
      .single();
    if (error) return failFromError(error, "Could not block this date.");
    return ok(data as BlockedDate);
  },

  async removeBlockedDate(id) {
    const supabase = createClient();
    const { error } = await supabase.from("blocked_dates").delete().eq("id", id);
    if (error) return failFromError(error, "Could not unblock this date.");
    return ok(true);
  },

  async createDentist(input: NewDentistInput) {
    const admin = createAdminClient();
    const { data: created, error } = await admin.auth.admin.createUser({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.full_name.trim(), phone: input.phone.trim(), role: "dentist" },
    });
    if (error || !created.user) return fail(error?.message ?? "Could not create dentist.", { email: error?.message ?? "" });
    const { error: profileError } = await admin
      .from("profiles")
      .update({ role: "dentist", full_name: input.full_name.trim(), phone: input.phone.trim() })
      .eq("id", created.user.id);
    if (profileError) return fail(profileError.message);
    const { data: dentist, error: dentistError } = await admin
      .from("dentists")
      .insert({
        profile_id: created.user.id,
        specialization: input.specialization,
        qualifications: input.qualifications,
        experience_years: input.experience_years,
        biography: input.biography,
        clinic_id: input.clinic_id,
        is_active: true,
      })
      .select()
      .single();
    if (dentistError) return fail(dentistError.message);
    const d = dentist as DentistRow;
    if (input.service_ids.length > 0) {
      await admin.from("dentist_services").insert(input.service_ids.map((service_id) => ({ dentist_id: d.id, service_id })));
    }
    await logAudit(admin, created.user.id, "dentist.created", "dentists", d.id);
    return ok((await this.getDentist(d.id))!);
  },

  async updateDentist(id, patch) {
    const admin = createAdminClient();
    const { data: existing } = await admin.from("dentists").select("*").eq("id", id).maybeSingle();
    if (!existing) return fail("Dentist not found.");
    const { error } = await admin
      .from("dentists")
      .update({
        specialization: patch.specialization,
        qualifications: patch.qualifications,
        experience_years: patch.experience_years,
        biography: patch.biography,
        clinic_id: patch.clinic_id,
        is_active: patch.is_active,
      })
      .eq("id", id);
    if (error) return failFromError(error, "Could not update dentist.");
    const profilePatch: Record<string, unknown> = {};
    if (patch.full_name) profilePatch.full_name = patch.full_name;
    if (patch.email) profilePatch.email = patch.email.trim().toLowerCase();
    if (Object.keys(profilePatch).length > 0) {
      await admin.from("profiles").update(profilePatch).eq("id", (existing as DentistRow).profile_id);
    }
    if (patch.service_ids) {
      await admin.from("dentist_services").delete().eq("dentist_id", id);
      if (patch.service_ids.length > 0) {
        await admin.from("dentist_services").insert(patch.service_ids.map((service_id) => ({ dentist_id: id, service_id })));
      }
    }
    await logAudit(admin, null, "dentist.updated", "dentists", id);
    return ok((await this.getDentist(id))!);
  },

  async createService(input: NewServiceInput) {
    const admin = createAdminClient();
    const { data, error } = await admin.from("services").insert({ ...input, name: input.name.trim() }).select().single();
    if (error) return failFromError(error, "Could not create service.");
    await logAudit(admin, null, "service.created", "services", (data as Service).id);
    return ok(data as Service);
  },

  async updateService(id, patch) {
    const admin = createAdminClient();
    const { data, error } = await admin.from("services").update(patch).eq("id", id).select().single();
    if (error) return failFromError(error, "Could not update service.");
    await logAudit(admin, null, "service.updated", "services", id);
    return ok(data as Service);
  },

  async createClinic(input: NewClinicInput) {
    const admin = createAdminClient();
    const { data, error } = await admin.from("clinics").insert(input).select().single();
    if (error) return failFromError(error, "Could not create clinic.");
    await logAudit(admin, null, "clinic.created", "clinics", (data as Clinic).id);
    return ok(data as Clinic);
  },

  async updateClinic(id, patch) {
    const admin = createAdminClient();
    const { data, error } = await admin.from("clinics").update(patch).eq("id", id).select().single();
    if (error) return failFromError(error, "Could not update clinic.");
    await logAudit(admin, null, "clinic.updated", "clinics", id);
    return ok(data as Clinic);
  },

  async getStats() {
    const admin = createAdminClient();
    const today = toISODate(new Date());
    const [patients, dentists, activeDentists, todayAppts, upcoming, cancelled, completed, total, pending, unread] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "patient"),
      admin.from("dentists").select("id", { count: "exact", head: true }),
      admin.from("dentists").select("id", { count: "exact", head: true }).eq("is_active", true),
      admin.from("appointments").select("id", { count: "exact", head: true }).eq("appointment_date", today),
      admin
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .gt("appointment_date", today)
        .in("status", ["pending", "confirmed"]),
      admin.from("appointments").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
      admin.from("appointments").select("id", { count: "exact", head: true }).eq("status", "completed"),
      admin.from("appointments").select("id", { count: "exact", head: true }),
      admin.from("appointments").select("id", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false),
    ]);
    return {
      total_patients: patients.count ?? 0,
      total_dentists: dentists.count ?? 0,
      active_dentists: activeDentists.count ?? 0,
      todays_appointments: todayAppts.count ?? 0,
      upcoming_appointments: upcoming.count ?? 0,
      cancelled_appointments: cancelled.count ?? 0,
      completed_appointments: completed.count ?? 0,
      total_appointments: total.count ?? 0,
      pending_requests: pending.count ?? 0,
      unread_notifications: unread.count ?? 0,
    } satisfies AdminStats;
  },

  async getDentistStats(dentistId) {
    const admin = createAdminClient();
    const today = toISODate(new Date());
    const [todayCount, upcoming, completed, pending, cancelled, total] = await Promise.all([
      admin
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("dentist_id", dentistId)
        .eq("appointment_date", today)
        .neq("status", "cancelled"),
      admin
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("dentist_id", dentistId)
        .gt("appointment_date", today)
        .in("status", ["pending", "confirmed"]),
      admin.from("appointments").select("id", { count: "exact", head: true }).eq("dentist_id", dentistId).eq("status", "completed"),
      admin.from("appointments").select("id", { count: "exact", head: true }).eq("dentist_id", dentistId).eq("status", "pending"),
      admin.from("appointments").select("id", { count: "exact", head: true }).eq("dentist_id", dentistId).eq("status", "cancelled"),
      admin.from("appointments").select("id", { count: "exact", head: true }).eq("dentist_id", dentistId),
    ]);
    return {
      today: todayCount.count ?? 0,
      upcoming: upcoming.count ?? 0,
      completed: completed.count ?? 0,
      pending: pending.count ?? 0,
      cancelled: cancelled.count ?? 0,
      total: total.count ?? 0,
    } satisfies DentistStats;
  },

  async getReports() {
    const admin = createAdminClient();
    const { data } = await admin.from("appointments").select("*").order("appointment_date", { ascending: false });
    const list = ((data ?? []) as AppointmentRow[]).map(mapAppointment);
    const today = new Date();
    const iso = (offset: number) =>
      new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + offset)).toISOString().slice(0, 10);

    const dailyVolume = Array.from({ length: 14 }, (_, i) => {
      const date = iso(i - 13);
      return { date, count: list.filter((a) => a.appointment_date === date && a.status !== "cancelled").length };
    });
    const monthlyVolume = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5 + i, 1));
      const month = d.toISOString().slice(0, 7);
      return { month, count: list.filter((a) => a.appointment_date.startsWith(month) && a.status !== "cancelled").length };
    });
    const statuses: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled", "no_show"];
    const services = await admin.from("services").select("id, name");
    const dentists = await admin.from("dentists").select("id, profile:profiles!dentists_profile_id_fkey(full_name)");
    return {
      dailyVolume,
      weeklyVolume: [],
      monthlyVolume,
      statusDistribution: statuses.map((status) => ({ status, count: list.filter((a) => a.status === status).length })),
      popularServices: ((services.data ?? []) as { id: string; name: string }[])
        .map((s) => ({ service: s.name, count: list.filter((a) => a.service_id === s.id && a.status !== "cancelled").length }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
      perDentist: ((dentists.data ?? []) as unknown as { id: string; profile: { full_name: string } }[]).map((d) => ({
        dentist: d.profile?.full_name ?? "Unknown",
        count: list.filter((a) => a.dentist_id === d.id && a.status !== "cancelled").length,
      })),
      completionRate: pct(list.filter((a) => a.status === "completed").length, list.length),
      cancellationRate: pct(list.filter((a) => a.status === "cancelled").length, list.length),
      noShowRate: pct(list.filter((a) => a.status === "no_show").length, list.length),
    } satisfies ReportData;
  },

  async listAuditLogs() {
    const admin = createAdminClient();
    const { data } = await admin.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
    return (data ?? []) as AuditLog[];
  },

  async listNotifications(userId) {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (data ?? []) as Notification[];
  },

  async markNotificationRead(id, userId) {
    const supabase = createClient();
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", userId);
    if (error) return failFromError(error, "Could not update notification.");
    return ok(true);
  },

  async markAllNotificationsRead(userId) {
    const supabase = createClient();
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    if (error) return failFromError(error, "Could not update notifications.");
    return ok(true);
  },

  async sendDueReminders() {
    const admin = createAdminClient();
    const target = toISODate(new Date(Date.now() + 3 * 86400000));
    const { data } = await admin
      .from("appointments")
      .select("*")
      .eq("appointment_date", target)
      .in("status", ["pending", "confirmed"]);
    let sent = 0;
    let skipped = 0;
    for (const row of (data ?? []) as AppointmentRow[]) {
      const appointment = mapAppointment(row);
      const { data: existing } = await admin
        .from("notifications")
        .select("id")
        .eq("appointment_id", appointment.id)
        .eq("notification_type", "reminder")
        .maybeSingle();
      if (existing) {
        skipped += 1;
        continue;
      }
      if (appointment.patient_id) {
        await admin.from("notifications").insert({
          user_id: appointment.patient_id,
          appointment_id: appointment.id,
          notification_type: "reminder",
          message: `Reminder: appointment ${appointment.reference} is on ${appointment.appointment_date} at ${appointment.start_time}.`,
        });
      }
      const { data: clinic } = await admin.from("clinics").select("name").eq("id", appointment.clinic_id).maybeSingle();
      const email = statusEmail({
        patientName: appointment.patient_name,
        reference: appointment.reference,
        status: "rescheduled",
      });
      void email;
      void clinic;
      const result = await sendEmail({
        to: appointment.patient_email,
        subject: `Reminder: your appointment is coming up`,
        html: `<p>Reminder for appointment ${appointment.reference} on ${appointment.appointment_date} at ${appointment.start_time}.</p>`,
      });
      if (result.delivered) sent += 1;
      else skipped += 1;
    }
    return { sent, skipped };
  },
};

function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

/** Writes in-app notifications and sends the confirmation email for a booking. */
async function notifyBookingCreated(appointment: Appointment) {
  try {
    const admin = createAdminClient();
    const [{ data: service }, { data: clinic }, { data: dentist }] = await Promise.all([
      admin.from("services").select("name").eq("id", appointment.service_id).maybeSingle(),
      admin.from("clinics").select("name, address, city").eq("id", appointment.clinic_id).maybeSingle(),
      admin.from("dentists").select("profile_id").eq("id", appointment.dentist_id).maybeSingle(),
    ]);
    const dentistProfileId = (dentist as { profile_id: string } | null)?.profile_id;
    if (dentistProfileId) {
      await admin.from("notifications").insert({
        user_id: dentistProfileId,
        appointment_id: appointment.id,
        notification_type: "system",
        message: `New booking request ${appointment.reference} from ${appointment.patient_name} on ${appointment.appointment_date} at ${appointment.start_time}.`,
      });
    }
    if (appointment.patient_id) {
      await admin.from("notifications").insert({
        user_id: appointment.patient_id,
        appointment_id: appointment.id,
        notification_type: "booking_confirmation",
        message: `Your appointment request ${appointment.reference} has been received.`,
      });
    }
    const email = bookingConfirmationEmail({
      patientName: appointment.patient_name,
      reference: appointment.reference,
      service: (service as { name: string } | null)?.name ?? "dental service",
      dentist: "your dentist",
      date: appointment.appointment_date,
      time: appointment.start_time,
      clinic: (clinic as { name: string } | null)?.name ?? "DentalCare",
      clinicAddress: `${(clinic as { address: string } | null)?.address ?? ""}`,
    });
    await sendEmail({ ...email, to: appointment.patient_email });
  } catch (error) {
    console.error("[notifications] booking notification failed", error);
  }
}

async function logAudit(
  admin: ReturnType<typeof createAdminClient>,
  actorId: string | null,
  action: string,
  entity: string,
  entityId: string | null,
) {
  try {
    await admin.from("audit_logs").insert({ actor_id: actorId, action, entity, entity_id: entityId });
  } catch (error) {
    console.error("[audit] log insert failed", error);
  }
}
