import { hashPassword } from "../auth/password";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, seedId } from "./constants";

export { DEMO_ACCOUNTS, DEMO_PASSWORD, seedId };

import type {
  Appointment,
  AppointmentStatus,
  AuditLog,
  Availability,
  BlockedDate,
  Clinic,
  Dentist,
  Notification,
  Profile,
  Service,
} from "../types";

const SERVICE_IDS = Array.from({ length: 10 }, (_, i) => seedId(i + 1));
const CLINIC_IDS = [seedId(101), seedId(102), seedId(103)];
const DENTIST_IDS = Array.from({ length: 6 }, (_, i) => seedId(201 + i));
const PROFILE_IDS = Array.from({ length: 7 }, (_, i) => seedId(301 + i));

export const services: Service[] = [
  {
    id: SERVICE_IDS[0],
    name: "General Dentistry",
    description:
      "Routine examinations, fillings and general dental care to keep your teeth and gums healthy year-round.",
    duration_minutes: 30,
    price: 90,
    is_active: true,
  },
  {
    id: SERVICE_IDS[1],
    name: "Teeth Cleaning",
    description:
      "Professional scaling and polishing that removes plaque and tartar, helping prevent gum disease and decay.",
    duration_minutes: 45,
    price: 120,
    is_active: true,
  },
  {
    id: SERVICE_IDS[2],
    name: "Dental Checkups",
    description:
      "A thorough oral examination, including screening for cavities, gum health and oral cancer risk factors.",
    duration_minutes: 30,
    price: 75,
    is_active: true,
  },
  {
    id: SERVICE_IDS[3],
    name: "Teeth Whitening",
    description:
      "Clinician-supervised whitening treatments designed to reduce surface staining and brighten your smile.",
    duration_minutes: 60,
    price: 320,
    is_active: true,
  },
  {
    id: SERVICE_IDS[4],
    name: "Braces and Orthodontics",
    description:
      "Assessment and treatment planning for crowded, spaced or misaligned teeth using modern orthodontic options.",
    duration_minutes: 45,
    price: 250,
    is_active: true,
  },
  {
    id: SERVICE_IDS[5],
    name: "Root Canal Treatment",
    description:
      "Endodontic treatment to relieve tooth pain and save a badly infected or damaged tooth from extraction.",
    duration_minutes: 60,
    price: 480,
    is_active: true,
  },
  {
    id: SERVICE_IDS[6],
    name: "Dental Implants",
    description:
      "Implant consultation, placement coordination and restoration planning for replacing missing teeth.",
    duration_minutes: 90,
    price: 1500,
    is_active: true,
  },
  {
    id: SERVICE_IDS[7],
    name: "Tooth Extraction",
    description:
      "Safe, comfortable removal of severely damaged, decayed or impacted teeth, with aftercare guidance.",
    duration_minutes: 45,
    price: 180,
    is_active: true,
  },
  {
    id: SERVICE_IDS[8],
    name: "Pediatric Dentistry",
    description:
      "Gentle, child-friendly dental care focused on prevention, early detection and building healthy habits.",
    duration_minutes: 30,
    price: 85,
    is_active: true,
  },
  {
    id: SERVICE_IDS[9],
    name: "Emergency Dental Care",
    description:
      "Same-day assessment and urgent relief for dental pain, swelling, trauma or lost restorations.",
    duration_minutes: 30,
    price: 150,
    is_active: true,
  },
];

export const clinics: Clinic[] = [
  {
    id: CLINIC_IDS[0],
    name: "DentalCare Downtown",
    address: "128 Harbour Street, Suite 400",
    city: "Seattle",
    state: "WA",
    postal_code: "98104",
    latitude: 47.6021,
    longitude: -122.3363,
    phone: "+1 (206) 555-0142",
    opening_hours: "Mon–Fri 8:30 AM – 6:00 PM · Sat 9:00 AM – 2:00 PM",
  },
  {
    id: CLINIC_IDS[1],
    name: "DentalCare Westside",
    address: "4555 Admiralty Way",
    city: "Seattle",
    state: "WA",
    postal_code: "98116",
    latitude: 47.5912,
    longitude: -122.3832,
    phone: "+1 (206) 555-0178",
    opening_hours: "Mon–Sat 9:00 AM – 6:00 PM",
  },
  {
    id: CLINIC_IDS[2],
    name: "DentalCare Northgate",
    address: "950 Northgate Mall, Unit 12",
    city: "Seattle",
    state: "WA",
    postal_code: "98125",
    latitude: 47.7075,
    longitude: -122.3271,
    phone: "+1 (206) 555-0193",
    opening_hours: "Mon–Sat 9:00 AM – 5:30 PM",
  },
];

const now = new Date();
const iso = (offsetDays: number) => {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays));
  return d.toISOString().slice(0, 10);
};

export const profiles: Profile[] = [
  {
    id: PROFILE_IDS[0],
    full_name: "Jamie Alvarez",
    email: DEMO_ACCOUNTS.patient.email,
    phone: "+1 (206) 555-0110",
    role: "patient",
    created_at: new Date(now.getTime() - 90 * 86400000).toISOString(),
  },
  {
    id: PROFILE_IDS[1],
    full_name: "Dr. Amara Osei",
    email: DEMO_ACCOUNTS.dentist.email,
    phone: "+1 (206) 555-0143",
    role: "dentist",
    created_at: new Date(now.getTime() - 800 * 86400000).toISOString(),
  },
  {
    id: PROFILE_IDS[2],
    full_name: "Dr. Daniel Reyes",
    email: "daniel.reyes@dentalcare.demo",
    phone: "+1 (206) 555-0179",
    role: "dentist",
    created_at: new Date(now.getTime() - 700 * 86400000).toISOString(),
  },
  {
    id: PROFILE_IDS[3],
    full_name: "Dr. Priya Nair",
    email: "priya.nair@dentalcare.demo",
    phone: "+1 (206) 555-0194",
    role: "dentist",
    created_at: new Date(now.getTime() - 600 * 86400000).toISOString(),
  },
  {
    id: PROFILE_IDS[4],
    full_name: "Dr. Marcus Chen",
    email: "marcus.chen@dentalcare.demo",
    phone: "+1 (206) 555-0144",
    role: "dentist",
    created_at: new Date(now.getTime() - 900 * 86400000).toISOString(),
  },
  {
    id: PROFILE_IDS[5],
    full_name: "Dr. Sofia Marchetti",
    email: "sofia.marchetti@dentalcare.demo",
    phone: "+1 (206) 555-0180",
    role: "dentist",
    created_at: new Date(now.getTime() - 500 * 86400000).toISOString(),
  },
  {
    id: PROFILE_IDS[6],
    full_name: "Clinic Administrator",
    email: DEMO_ACCOUNTS.admin.email,
    phone: "+1 (206) 555-0100",
    role: "admin",
    created_at: new Date(now.getTime() - 1000 * 86400000).toISOString(),
  },
];

export const dentists: Dentist[] = [
  {
    id: DENTIST_IDS[0],
    profile_id: PROFILE_IDS[1],
    specialization: "General & Family Dentistry",
    qualifications: "DDS, University of Washington · Member, American Dental Association",
    experience_years: 12,
    biography:
      "Dr. Osei focuses on preventive dentistry and building long-term relationships with families. She takes time to explain every treatment option in plain language.",
    clinic_id: CLINIC_IDS[0],
    is_active: true,
  },
  {
    id: DENTIST_IDS[1],
    profile_id: PROFILE_IDS[2],
    specialization: "Orthodontics",
    qualifications: "DMD, MS Orthodontics · Certified in clear-aligner therapy",
    experience_years: 15,
    biography:
      "Dr. Reyes has treated thousands of orthodontic cases, from traditional braces to modern clear-aligner systems for teens and adults.",
    clinic_id: CLINIC_IDS[1],
    is_active: true,
  },
  {
    id: DENTIST_IDS[2],
    profile_id: PROFILE_IDS[3],
    specialization: "Cosmetic Dentistry",
    qualifications: "BDS, MClinicalDent · Accredated member, American Academy of Cosmetic Dentistry",
    experience_years: 9,
    biography:
      "Dr. Nair combines artistry with clinical precision for whitening, veneers and smile-makeover planning.",
    clinic_id: CLINIC_IDS[2],
    is_active: true,
  },
  {
    id: DENTIST_IDS[3],
    profile_id: PROFILE_IDS[4],
    specialization: "Endodontics",
    qualifications: "DDS, MSc Endodontics · Diplomate, American Board of Endodontics",
    experience_years: 18,
    biography:
      "Dr. Chen specializes in root canal therapy and microsurgical procedures, with a focus on comfort and tooth preservation.",
    clinic_id: CLINIC_IDS[0],
    is_active: true,
  },
  {
    id: DENTIST_IDS[4],
    profile_id: PROFILE_IDS[5],
    specialization: "Pediatric Dentistry",
    qualifications: "DDS, Certificate in Pediatric Dentistry",
    experience_years: 11,
    biography:
      "Dr. Marchetti creates a calm, playful environment so children feel safe and learn to enjoy visiting the dentist.",
    clinic_id: CLINIC_IDS[1],
    is_active: true,
  },
  {
    id: DENTIST_IDS[5],
    profile_id: "00000000-0000-4000-8000-000000000207",
    specialization: "Oral Surgery & Implantology",
    qualifications: "DMD, FICOI · Fellowship in Oral Implantology",
    experience_years: 20,
    biography:
      "Dr. Haddad performs complex extractions and full-arch implant rehabilitation, using digital planning for predictable results.",
    clinic_id: CLINIC_IDS[2],
    is_active: true,
  },
];

/** Dr. Haddad's profile is intentionally stored in the store profile list. */
profiles.push({
  id: "00000000-0000-4000-8000-000000000207",
  full_name: "Dr. Omar Haddad",
  email: "omar.haddad@dentalcare.demo",
  phone: "+1 (206) 555-0195",
  role: "dentist",
  created_at: new Date(now.getTime() - 1100 * 86400000).toISOString(),
});

export const dentistServices: { dentist_id: string; service_id: string }[] = [
  { dentist_id: DENTIST_IDS[0], service_id: SERVICE_IDS[0] },
  { dentist_id: DENTIST_IDS[0], service_id: SERVICE_IDS[1] },
  { dentist_id: DENTIST_IDS[0], service_id: SERVICE_IDS[2] },
  { dentist_id: DENTIST_IDS[0], service_id: SERVICE_IDS[9] },
  { dentist_id: DENTIST_IDS[1], service_id: SERVICE_IDS[4] },
  { dentist_id: DENTIST_IDS[2], service_id: SERVICE_IDS[3] },
  { dentist_id: DENTIST_IDS[2], service_id: SERVICE_IDS[1] },
  { dentist_id: DENTIST_IDS[3], service_id: SERVICE_IDS[5] },
  { dentist_id: DENTIST_IDS[3], service_id: SERVICE_IDS[7] },
  { dentist_id: DENTIST_IDS[4], service_id: SERVICE_IDS[8] },
  { dentist_id: DENTIST_IDS[4], service_id: SERVICE_IDS[2] },
  { dentist_id: DENTIST_IDS[5], service_id: SERVICE_IDS[6] },
  { dentist_id: DENTIST_IDS[5], service_id: SERVICE_IDS[7] },
  { dentist_id: DENTIST_IDS[5], service_id: SERVICE_IDS[2] },
  { dentist_id: DENTIST_IDS[5], service_id: SERVICE_IDS[9] },
];

const av = (
  dentistIdx: number,
  day: number,
  start: string,
  end: string,
  breakStart: string | null = null,
  breakEnd: string | null = null,
): Availability => ({
  id: seedId(400 + dentistIdx * 10 + day),
  dentist_id: DENTIST_IDS[dentistIdx],
  day_of_week: day,
  start_time: start,
  end_time: end,
  break_start: breakStart,
  break_end: breakEnd,
});

export const availability: Availability[] = [
  // Dr. Osei — Mon–Fri + Sat morning
  av(0, 1, "09:00", "17:00", "12:00", "13:00"),
  av(0, 2, "09:00", "17:00", "12:00", "13:00"),
  av(0, 3, "09:00", "17:00", "12:00", "13:00"),
  av(0, 4, "09:00", "17:00", "12:00", "13:00"),
  av(0, 5, "09:00", "17:00", "12:00", "13:00"),
  av(0, 6, "09:00", "13:00"),
  // Dr. Reyes — Mon/Wed/Fri
  av(1, 1, "10:00", "18:00", "13:00", "14:00"),
  av(1, 3, "10:00", "18:00", "13:00", "14:00"),
  av(1, 5, "10:00", "18:00", "13:00", "14:00"),
  // Dr. Nair — Tue–Sat
  av(2, 2, "09:30", "17:30", "12:30", "13:30"),
  av(2, 3, "09:30", "17:30", "12:30", "13:30"),
  av(2, 4, "09:30", "17:30", "12:30", "13:30"),
  av(2, 5, "09:30", "17:30", "12:30", "13:30"),
  av(2, 6, "09:30", "14:30", "12:30", "13:30"),
  // Dr. Chen — Mon–Thu
  av(3, 1, "08:30", "16:30", "12:00", "12:45"),
  av(3, 2, "08:30", "16:30", "12:00", "12:45"),
  av(3, 3, "08:30", "16:30", "12:00", "12:45"),
  av(3, 4, "08:30", "16:30", "12:00", "12:45"),
  // Dr. Marchetti — Mon–Fri + Sat
  av(4, 1, "09:00", "16:00", "12:00", "13:00"),
  av(4, 2, "09:00", "16:00", "12:00", "13:00"),
  av(4, 3, "09:00", "16:00", "12:00", "13:00"),
  av(4, 4, "09:00", "16:00", "12:00", "13:00"),
  av(4, 5, "09:00", "16:00", "12:00", "13:00"),
  av(4, 6, "10:00", "14:00", "12:00", "12:30"),
  // Dr. Haddad — Tue–Fri
  av(5, 2, "09:00", "17:00", "13:00", "14:00"),
  av(5, 3, "09:00", "17:00", "13:00", "14:00"),
  av(5, 4, "09:00", "17:00", "13:00", "14:00"),
  av(5, 5, "09:00", "17:00", "13:00", "14:00"),
];

export const blockedDates: BlockedDate[] = [
  { id: seedId(501), dentist_id: DENTIST_IDS[0], blocked_date: iso(14), reason: "Clinical conference" },
  { id: seedId(502), dentist_id: DENTIST_IDS[2], blocked_date: iso(7), reason: "Annual leave" },
];

function appt(
  n: number,
  dentistIdx: number,
  serviceIdx: number,
  clinicIdx: number,
  date: string,
  start: string,
  duration: number,
  status: AppointmentStatus,
  patientId: string | null,
  patientName: string,
  patientEmail: string,
  patientPhone: string,
  notes?: string,
  createdOffsetDays = -30,
): Appointment {
  const [h, m] = start.split(":").map(Number);
  return {
    id: seedId(600 + n),
    reference: `DC-${date.replace(/-/g, "").slice(2)}-${String(1000 + n)}`,
    patient_id: patientId,
    dentist_id: DENTIST_IDS[dentistIdx],
    service_id: SERVICE_IDS[serviceIdx],
    clinic_id: CLINIC_IDS[clinicIdx],
    appointment_date: date,
    start_time: start,
    end_time: `${String(h + Math.floor((m + duration) / 60)).padStart(2, "0")}:${String((m + duration) % 60).padStart(2, "0")}`,
    status,
    patient_notes: notes ?? null,
    patient_name: patientName,
    patient_email: patientEmail,
    patient_phone: patientPhone,
    created_at: new Date(now.getTime() + createdOffsetDays * 86400000).toISOString(),
    updated_at: new Date(now.getTime() + createdOffsetDays * 86400000).toISOString(),
  };
}

const P1 = {
  name: "Jamie Alvarez",
  email: "patient@demo.com",
  phone: "+1 (206) 555-0110",
};

export const appointments: Appointment[] = [
  appt(1, 0, 2, 0, iso(3), "10:00", 30, "confirmed", PROFILE_IDS[0], P1.name, P1.email, P1.phone, "Routine six-month checkup", -12),
  appt(2, 0, 1, 0, iso(10), "14:30", 45, "pending", PROFILE_IDS[0], P1.name, P1.email, P1.phone, "Sensitive to cold drinks", -4),
  appt(3, 3, 5, 0, iso(-21), "09:00", 60, "completed", PROFILE_IDS[0], P1.name, P1.email, P1.phone, undefined, -40),
  appt(4, 0, 0, 0, iso(-35), "11:00", 30, "cancelled", PROFILE_IDS[0], P1.name, P1.email, P1.phone, "Schedule conflict", -45),
  appt(5, 4, 8, 1, iso(-6), "15:00", 30, "no_show", PROFILE_IDS[0], P1.name, P1.email, P1.phone, "First visit for my child", -20),
  // Busy today for Dr. Osei (dentist dashboard demo)
  appt(6, 0, 2, 0, iso(0), "09:30", 30, "confirmed", null, "Elena Rossi", "elena.rossi@example.com", "+1 (206) 555-0155", "New patient", -15),
  appt(7, 0, 1, 0, iso(0), "11:00", 45, "confirmed", null, "Tom Becker", "tom.becker@example.com", "+1 (206) 555-0166", undefined, -10),
  appt(8, 0, 9, 0, iso(0), "13:30", 30, "pending", null, "Aisha Khan", "aisha.khan@example.com", "+1 (206) 555-0177", "Chipped front tooth", -2),
  // Other dentists' appointments for admin/stats demo
  appt(9, 1, 4, 1, iso(2), "10:30", 45, "confirmed", null, "Liam Wright", "liam.wright@example.com", "+1 (206) 555-0188", undefined, -8),
  appt(10, 2, 3, 2, iso(5), "14:00", 60, "pending", null, "Nora Fischer", "nora.fischer@example.com", "+1 (206) 555-0199", undefined, -6),
  appt(11, 5, 6, 2, iso(8), "09:00", 90, "confirmed", null, "George Patel", "george.patel@example.com", "+1 (206) 555-0201", undefined, -5),
  appt(12, 3, 5, 0, iso(12), "08:30", 60, "confirmed", null, "Mia Torres", "mia.torres@example.com", "+1 (206) 555-0202", undefined, -3),
  appt(13, 1, 4, 1, iso(-3), "16:00", 45, "completed", null, "Owen Silva", "owen.silva@example.com", "+1 (206) 555-0203", undefined, -20),
  appt(14, 2, 3, 2, iso(-9), "10:00", 60, "completed", null, "Hana Kim", "hana.kim@example.com", "+1 (206) 555-0204", undefined, -25),
  appt(15, 0, 2, 0, iso(-14), "10:30", 30, "completed", null, "Ravi Menon", "ravi.menon@example.com", "+1 (206) 555-0205", undefined, -28),
  appt(16, 4, 8, 1, iso(-4), "11:30", 30, "cancelled", null, "Zoe Blake", "zoe.blake@example.com", "+1 (206) 555-0206", undefined, -12),
];

export const notifications: Notification[] = [
  {
    id: seedId(701),
    user_id: PROFILE_IDS[0],
    appointment_id: seedId(601),
    notification_type: "booking_confirmation",
    message: "Your appointment DC-003-1001 on Oct 12 at 10:00 AM has been received and is being confirmed.",
    is_read: false,
    created_at: new Date(now.getTime() - 12 * 86400000).toISOString(),
  },
  {
    id: seedId(702),
    user_id: PROFILE_IDS[0],
    appointment_id: seedId(602),
    notification_type: "reminder",
    message: "Reminder: you have an upcoming appointment in 3 days.",
    is_read: false,
    created_at: new Date(now.getTime() - 1 * 3600000).toISOString(),
  },
];

export const auditLogs: AuditLog[] = [
  {
    id: seedId(801),
    actor_id: PROFILE_IDS[6],
    action: "service.updated",
    entity: "services",
    entity_id: SERVICE_IDS[3],
    metadata: { field: "price", from: 300, to: 320 },
    created_at: new Date(now.getTime() - 5 * 86400000).toISOString(),
  },
  {
    id: seedId(802),
    actor_id: PROFILE_IDS[6],
    action: "dentist.deactivated",
    entity: "dentists",
    entity_id: DENTIST_IDS[4],
    metadata: { temporary: false },
    created_at: new Date(now.getTime() - 9 * 86400000).toISOString(),
  },
];

export interface DemoDB {
  profiles: Profile[];
  credentials: { profile_id: string; password_hash: string }[];
  dentists: Dentist[];
  clinics: Clinic[];
  services: Service[];
  dentistServices: { dentist_id: string; service_id: string }[];
  availability: Availability[];
  blockedDates: BlockedDate[];
  appointments: Appointment[];
  notifications: Notification[];
  auditLogs: AuditLog[];
}

export function createDemoDB(): DemoDB {
  return {
    profiles,
    credentials: profiles.map((p) => ({ profile_id: p.id, password_hash: hashPassword(DEMO_PASSWORD) })),
    dentists,
    clinics,
    services,
    dentistServices,
    availability,
    blockedDates,
    appointments,
    notifications,
    auditLogs,
  };
}

/** Serially-executed promise chain used to simulate DB-level locking in demo mode. */
export function withLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const chain = ((globalThis as Record<string, unknown>).__dentalcare_lock as Promise<unknown>) ?? Promise.resolve();
  const next = chain.then(async () => fn()).finally(() => {
    if ((globalThis as Record<string, unknown>).__dentalcare_lock === next) {
      (globalThis as Record<string, unknown>).__dentalcare_lock = undefined;
    }
  });
  (globalThis as Record<string, unknown>).__dentalcare_lock = next;
  return next;
}
