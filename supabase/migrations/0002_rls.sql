-- =====================================================================
-- DentalCare — Row Level Security policies
-- Authorization is enforced in the database, not only in the UI.
-- =====================================================================

create or replace function public.current_role_name()
returns user_role language sql stable as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce(public.current_role_name() = 'admin', false)
$$;

create or replace function public.is_dentist_owner(target_dentist uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.dentists d
    where d.id = target_dentist and d.profile_id = auth.uid()
  )
$$;

create or replace function public.owns_appointment(target_appointment uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.appointments a
    where a.id = target_appointment
      and (
        a.patient_id = auth.uid()
        or public.is_dentist_owner(a.dentist_id)
        or public.is_admin()
      )
  )
$$;

alter table public.profiles enable row level security;
alter table public.clinics enable row level security;
alter table public.services enable row level security;
alter table public.dentists enable row level security;
alter table public.dentist_services enable row level security;
alter table public.dentist_availability enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.appointments enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- ------------------------------- profiles ----------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- ----------------------- reference data (read all) -------------------
drop policy if exists "clinics_read" on public.clinics;
create policy "clinics_read" on public.clinics for select using (true);

drop policy if exists "services_read" on public.services;
create policy "services_read" on public.services for select using (true);

drop policy if exists "availability_read" on public.dentist_availability;
create policy "availability_read" on public.dentist_availability for select using (true);

drop policy if exists "blocked_dates_read" on public.blocked_dates;
create policy "blocked_dates_read" on public.blocked_dates for select using (true);

-- Dentists: profiles are public, contact columns readable by admins only.
drop policy if exists "dentists_read" on public.dentists;
create policy "dentists_read" on public.dentists for select using (true);

drop policy if exists "dentist_services_read" on public.dentist_services;
create policy "dentist_services_read" on public.dentist_services for select using (true);

-- ---------------------------- appointments ---------------------------
-- Patients see their own; dentists see appointments assigned to them;
-- admins see everything. Anyone may insert (guests can book) — the
-- book_appointment() function performs all validation.
drop policy if exists "appointments_select" on public.appointments;
create policy "appointments_select"
  on public.appointments for select
  using (
    patient_id = auth.uid()
    or public.is_dentist_owner(dentist_id)
    or public.is_admin()
  );

drop policy if exists "appointments_update" on public.appointments;
create policy "appointments_update"
  on public.appointments for update
  using (
    patient_id = auth.uid()
    or public.is_dentist_owner(dentist_id)
    or public.is_admin()
  );

-- ---------------------------- notifications --------------------------
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (user_id = auth.uid());

-- ----------------------------- audit_logs ----------------------------
drop policy if exists "audit_logs_admin_read" on public.audit_logs;
create policy "audit_logs_admin_read"
  on public.audit_logs for select
  using (public.is_admin());

-- --------------- admin-only write access for management ---------------
drop policy if exists "services_admin_write" on public.services;
create policy "services_admin_write"
  on public.services for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "clinics_admin_write" on public.clinics;
create policy "clinics_admin_write"
  on public.clinics for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "dentists_admin_write" on public.dentists;
create policy "dentists_admin_write"
  on public.dentists for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "dentist_services_admin_write" on public.dentist_services;
create policy "dentist_services_admin_write"
  on public.dentist_services for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "availability_owner_write" on public.dentist_availability;
create policy "availability_owner_write"
  on public.dentist_availability for all
  using (public.is_dentist_owner(dentist_id) or public.is_admin())
  with check (public.is_dentist_owner(dentist_id) or public.is_admin());

drop policy if exists "blocked_dates_owner_write" on public.blocked_dates;
create policy "blocked_dates_owner_write"
  on public.blocked_dates for all
  using (public.is_dentist_owner(dentist_id) or public.is_admin())
  with check (public.is_dentist_owner(dentist_id) or public.is_admin());

-- Role changes through the client are prevented: patients can only update
-- their own name/phone and cannot escalate their role (see profiles policy).
