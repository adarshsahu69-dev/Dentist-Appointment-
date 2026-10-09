-- =====================================================================
-- DentalCare — initial schema
-- Run with: supabase db push  (or paste into the Supabase SQL editor)
-- =====================================================================

create extension if not exists "btree_gist";
create extension if not exists "pgcrypto";

-- ------------------------------- enums -------------------------------
do $$ begin
  create type user_role as enum ('patient', 'dentist', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum ('booking_confirmation', 'approved', 'rejected', 'cancelled', 'rescheduled', 'reminder', 'system');
exception when duplicate_object then null; end $$;

-- ------------------------------ profiles -----------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 80),
  email text not null unique,
  phone text,
  role user_role not null default 'patient',
  created_at timestamptz not null default now()
);

-- ------------------------------- clinics -----------------------------
create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  latitude double precision,
  longitude double precision,
  phone text not null,
  opening_hours text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------ services -----------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  duration_minutes integer not null check (duration_minutes between 10 and 240),
  price numeric(10, 2) check (price is null or price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------ dentists -----------------------------
create table if not exists public.dentists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  specialization text not null,
  qualifications text not null,
  experience_years integer not null default 0 check (experience_years between 0 and 70),
  biography text not null default '',
  clinic_id uuid not null references public.clinics (id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists dentists_clinic_id_idx on public.dentists (clinic_id);
create index if not exists dentists_specialization_idx on public.dentists (specialization);

-- ------------------------- dentist_services --------------------------
create table if not exists public.dentist_services (
  dentist_id uuid not null references public.dentists (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  primary key (dentist_id, service_id)
);

-- ------------------------ dentist_availability -----------------------
create table if not exists public.dentist_availability (
  id uuid primary key default gen_random_uuid(),
  dentist_id uuid not null references public.dentists (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  break_start time,
  break_end time,
  constraint working_hours_valid check (end_time > start_time),
  constraint break_within_hours check (
    break_start is null
    or break_end is null
    or (break_start >= start_time and break_end <= end_time and break_end > break_start)
  )
);

create index if not exists availability_dentist_idx on public.dentist_availability (dentist_id, day_of_week);

-- ---------------------------- blocked_dates --------------------------
create table if not exists public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  dentist_id uuid not null references public.dentists (id) on delete cascade,
  blocked_date date not null,
  reason text,
  unique (dentist_id, blocked_date)
);

-- ---------------------------- appointments ---------------------------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  patient_id uuid references public.profiles (id) on delete set null,
  dentist_id uuid not null references public.dentists (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete restrict,
  clinic_id uuid not null references public.clinics (id) on delete restrict,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status appointment_status not null default 'pending',
  patient_notes text,
  patient_name text not null,
  patient_email text not null,
  patient_phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_times_valid check (end_time > start_time)
);

-- Prevents overlapping pending/confirmed appointments for the same dentist.
alter table public.appointments
  drop constraint if exists appointments_no_overlap;
alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    dentist_id with =,
    appointment_date with =,
    tsrange(
      (appointment_date + start_time)::timestamp,
      (appointment_date + end_time)::timestamp
    ) with &&
  ) where (status in ('pending', 'confirmed'));

create index if not exists appointments_dentist_date_idx on public.appointments (dentist_id, appointment_date);
create index if not exists appointments_patient_idx on public.appointments (patient_id);
create index if not exists appointments_status_idx on public.appointments (status);

-- --------------------------- notifications ---------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete cascade,
  notification_type notification_type not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, is_read);

-- ----------------------------- audit_logs ----------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------- updated_at trigger ------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists appointments_touch_updated_at on public.appointments;
create trigger appointments_touch_updated_at
  before update on public.appointments
  for each row execute function public.touch_updated_at();

-- ------------- create a profile row for every new auth user ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New patient'),
    new.email,
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    -- Public signup can never grant dentist or admin roles.
    case
      when coalesce(new.raw_user_meta_data ->> 'role', 'patient') in ('dentist', 'admin') then 'patient'
      else 'patient'
    end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
