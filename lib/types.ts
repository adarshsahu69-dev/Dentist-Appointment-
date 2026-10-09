export type Role = "patient" | "dentist" | "admin";

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  created_at: string;
}

export interface Clinic {
  id: string;
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

export interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number | null;
  is_active: boolean;
}

export interface Dentist {
  id: string;
  profile_id: string;
  specialization: string;
  qualifications: string;
  experience_years: number;
  biography: string;
  clinic_id: string;
  is_active: boolean;
}

/** Dentist joined with profile + clinic + service ids, as used by the UI. */
export interface DentistWithDetails extends Dentist {
  profile: Profile;
  clinic: Clinic;
  service_ids: string[];
}

export interface ServiceWithStats extends Service {
  booking_count: number;
}

export interface Availability {
  id: string;
  dentist_id: string;
  /** 0 = Sunday ... 6 = Saturday */
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
}

export interface BlockedDate {
  id: string;
  dentist_id: string;
  blocked_date: string;
  reason: string | null;
}

export interface Appointment {
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
  /** Contact details collected at booking time. */
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  appointment_id: string | null;
  notification_type: "booking_confirmation" | "approved" | "rejected" | "cancelled" | "rescheduled" | "reminder" | "system";
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  phone: string | null;
  dentist_id?: string;
}

export interface Slot {
  /** "HH:mm" 24h */
  time: string;
  available: boolean;
  reason?: "booked" | "break" | "past";
}

export interface DentistFilters {
  specialization?: string;
  clinic_id?: string;
  service_id?: string;
  available_day?: number;
  query?: string;
}
