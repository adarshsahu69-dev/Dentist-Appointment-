import type {
  Appointment,
  AppointmentStatus,
  AuditLog,
  Availability,
  BlockedDate,
  Clinic,
  Dentist,
  DentistFilters,
  DentistWithDetails,
  Notification,
  Profile,
  Role,
  Service,
  SessionUser,
  Slot,
} from "../types";
import type { BookingInput, ProfileUpdateInput, SignupInput } from "../validation";
export interface Failure {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string>;
}

export type Result<T> = { ok: true; data: T } | Failure;

export const ok = <T>(data: T): { ok: true; data: T } => ({ ok: true, data });

export const fail = (error: string, fieldErrors?: Record<string, string>): Failure => ({ ok: false, error, fieldErrors });

export interface AvailabilityInput {
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
}

export interface AppointmentFilter {
  query?: string;
  status?: AppointmentStatus | "all";
  dentist_id?: string;
  date?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface AppointmentDetails {
  appointment: Appointment;
  patient: { id: string; full_name: string; email: string; phone: string | null } | null;
  dentist: DentistWithDetails;
  service: Service;
  clinic: Clinic;
}

export interface AdminStats {
  total_patients: number;
  total_dentists: number;
  active_dentists: number;
  todays_appointments: number;
  upcoming_appointments: number;
  cancelled_appointments: number;
  completed_appointments: number;
  total_appointments: number;
  pending_requests: number;
  unread_notifications: number;
}

export interface DentistStats {
  today: number;
  upcoming: number;
  completed: number;
  pending: number;
  cancelled: number;
  total: number;
}

export interface ReportData {
  dailyVolume: { date: string; count: number }[];
  weeklyVolume: { week: string; count: number }[];
  monthlyVolume: { month: string; count: number }[];
  statusDistribution: { status: AppointmentStatus; count: number }[];
  popularServices: { service: string; count: number }[];
  perDentist: { dentist: string; count: number }[];
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
}

export interface NewDentistInput {
  full_name: string;
  email: string;
  phone: string;
  specialization: string;
  qualifications: string;
  experience_years: number;
  biography: string;
  clinic_id: string;
  service_ids: string[];
  password: string;
}

export interface NewServiceInput {
  name: string;
  description: string;
  duration_minutes: number;
  price: number | null;
  is_active: boolean;
}

export interface NewClinicInput {
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  opening_hours: string;
}

export interface DataProvider {
  /* auth & account */
  getSessionUser(): Promise<SessionUser | null>;
  listProfiles(role?: Role): Promise<Profile[]>;
  signUp(input: SignupInput): Promise<Result<SessionUser>>;
  signIn(email: string, password: string): Promise<Result<SessionUser>>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<Result<{ token: string | null }>>;
  resetPassword(token: string, password: string): Promise<Result<true>>;
  updateProfile(userId: string, input: ProfileUpdateInput): Promise<Result<SessionUser>>;
  linkOrphanAppointments(email: string, userId: string): Promise<number>;

  /* public reads */
  listServices(): Promise<Service[]>;
  listAllServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | null>;
  listClinics(): Promise<Clinic[]>;
  getClinic(id: string): Promise<Clinic | null>;
  listDentists(filters?: DentistFilters): Promise<DentistWithDetails[]>;
  getDentist(id: string): Promise<DentistWithDetails | null>;
  listAvailability(dentistId: string): Promise<Availability[]>;
  listBlockedDates(dentistId: string): Promise<BlockedDate[]>;
  getSlotsFor(dentistId: string, serviceId: string, date: string): Promise<Slot[]>;

  /* booking */
  createBooking(input: BookingInput): Promise<Result<Appointment>>;
  cancelAppointment(id: string): Promise<Result<Appointment>>;
  rescheduleAppointment(id: string, date: string, startTime: string): Promise<Result<Appointment>>;

  /* appointments */
  listAppointmentsForPatient(patientId: string): Promise<Appointment[]>;
  listAppointmentsForDentist(dentistId: string): Promise<Appointment[]>;
  listAllAppointments(filter: AppointmentFilter): Promise<{ items: Appointment[]; total: number }>;
  getAppointment(id: string): Promise<Appointment | null>;
  getAppointmentDetails(id: string): Promise<AppointmentDetails | null>;
  enrichAppointments(appointments: Appointment[]): Promise<AppointmentDetails[]>;
  setAppointmentStatus(id: string, status: AppointmentStatus): Promise<Result<Appointment>>;
  setAppointmentNotes(id: string, notes: string): Promise<Result<Appointment>>;

  /* dentist availability management */
  replaceAvailability(dentistId: string, rows: AvailabilityInput[]): Promise<Result<Availability[]>>;
  addBlockedDate(dentistId: string, date: string, reason: string): Promise<Result<BlockedDate>>;
  removeBlockedDate(id: string): Promise<Result<true>>;

  /* admin */
  createDentist(input: NewDentistInput): Promise<Result<DentistWithDetails>>;
  updateDentist(id: string, patch: Partial<Dentist> & { service_ids?: string[]; full_name?: string; email?: string }): Promise<Result<DentistWithDetails>>;
  createService(input: NewServiceInput): Promise<Result<Service>>;
  updateService(id: string, patch: Partial<Service>): Promise<Result<Service>>;
  createClinic(input: NewClinicInput): Promise<Result<Clinic>>;
  updateClinic(id: string, patch: Partial<Clinic>): Promise<Result<Clinic>>;
  getStats(): Promise<AdminStats>;
  getDentistStats(dentistId: string): Promise<DentistStats>;
  getReports(): Promise<ReportData>;
  listAuditLogs(): Promise<AuditLog[]>;

  /* notifications */
  listNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(id: string, userId: string): Promise<Result<true>>;
  markAllNotificationsRead(userId: string): Promise<Result<true>>;
  sendDueReminders(): Promise<{ sent: number; skipped: number }>;
}
