-- =====================================================================
-- DentalCare — booking / lifecycle functions
-- All writes are validated server-side and concurrency-safe. The
-- appointments_no_overlap exclusion constraint is the final guard
-- against double booking.
-- =====================================================================

create or replace function public.make_reference()
returns text language sql volatile as $$
  select 'DC-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(md5(random()::text), 1, 4))
$$;

create or replace function public.slot_is_valid(
  p_dentist_id uuid,
  p_date date,
  p_start time,
  p_duration int,
  p_ignore_appointment uuid default null
) returns text language plpgsql stable as $$
declare
  v_reason text;
begin
  if p_date < current_date then
    return 'Appointment date cannot be in the past.';
  end if;

  if exists (select 1 from public.blocked_dates b where b.dentist_id = p_dentist_id and b.blocked_date = p_date) then
    return 'The dentist is unavailable on the selected date.';
  end if;

  if not exists (
    select 1
    from public.dentist_availability a
    where a.dentist_id = p_dentist_id
      and a.day_of_week = extract(dow from p_date)::smallint
      and p_start >= a.start_time
      and (p_start + make_interval(mins => p_duration)) <= a.end_time
      and (
        a.break_start is null
        or a.break_end is null
        or (p_start + make_interval(mins => p_duration)) <= a.break_start
        or p_start >= a.break_end
      )
  ) then
    return 'Selected time is outside the dentist\'s working hours or falls inside a break.';
  end if;

  if exists (
    select 1
    from public.appointments ap
    where ap.dentist_id = p_dentist_id
      and ap.appointment_date = p_date
      and ap.status in ('pending', 'confirmed')
      and ap.id is distinct from p_ignore_appointment
      and tsrange((ap.appointment_date + ap.start_time)::timestamp, (ap.appointment_date + ap.end_time)::timestamp)
          && tsrange((p_date + p_start)::timestamp, (p_date + p_start + make_interval(mins => p_duration))::timestamp)
  ) then
    return 'This time slot is no longer available.';
  end if;

  return null;
end $$;

-- ----------------------------- booking -------------------------------
create or replace function public.book_appointment(
  p_service_id uuid,
  p_dentist_id uuid,
  p_clinic_id uuid,
  p_appointment_date date,
  p_start_time time,
  p_patient_name text,
  p_patient_email text,
  p_patient_phone text,
  p_patient_notes text default null
) returns json language plpgsql security definer set search_path = public as $$
declare
  v_duration int;
  v_problem text;
  v_patient uuid;
  v_appt public.appointments;
begin
  select s.duration_minutes into v_duration
  from public.services s
  where s.id = p_service_id and s.is_active;

  if v_duration is null then
    return json_build_object('ok', false, 'error', 'This service is not available.');
  end if;

  if not exists (select 1 from public.dentists d where d.id = p_dentist_id and d.is_active) then
    return json_build_object('ok', false, 'error', 'This dentist is not accepting appointments.');
  end if;

  if not exists (select 1 from public.clinics c where c.id = p_clinic_id) then
    return json_build_object('ok', false, 'error', 'Selected clinic does not exist.');
  end if;

  if not exists (
    select 1 from public.dentist_services ds
    where ds.dentist_id = p_dentist_id and ds.service_id = p_service_id
  ) then
    return json_build_object('ok', false, 'error', 'This dentist does not offer the selected service.');
  end if;

  v_problem := public.slot_is_valid(p_dentist_id, p_appointment_date, p_start_time, v_duration);
  if v_problem is not null then
    return json_build_object('ok', false, 'error', v_problem);
  end if;

  -- Attach the booking to the signed-in patient when applicable.
  v_patient := auth.uid();
  if v_patient is not null and not exists (
    select 1 from public.profiles p where p.id = v_patient and p.role = 'patient'
  ) then
    v_patient := null;
  end if;

  begin
    insert into public.appointments (
      reference, patient_id, dentist_id, service_id, clinic_id,
      appointment_date, start_time, end_time, status,
      patient_notes, patient_name, patient_email, patient_phone
    ) values (
      public.make_reference(), v_patient, p_dentist_id, p_service_id, p_clinic_id,
      p_appointment_date, p_start_time, p_start_time + make_interval(mins => v_duration), 'pending',
      nullif(trim(coalesce(p_patient_notes, '')), ''),
      trim(p_patient_name), lower(trim(p_patient_email)), trim(p_patient_phone)
    )
    returning * into v_appt;
  exception when exclusion_violation then
    return json_build_object('ok', false, 'error', 'This time slot was just taken. Please choose another time.');
  end;

  -- In-app notifications (dentist + patient).
  insert into public.notifications (user_id, appointment_id, notification_type, message)
  select d.profile_id, v_appt.id, 'system',
         format('New booking request %s from %s on %s at %s.', v_appt.reference, v_appt.patient_name, v_appt.appointment_date, v_appt.start_time)
  from public.dentists d where d.id = p_dentist_id;

  if v_patient is not null then
    insert into public.notifications (user_id, appointment_id, notification_type, message)
    values (v_patient, v_appt.id, 'booking_confirmation',
            format('Your appointment request %s has been received and is awaiting confirmation.', v_appt.reference));
  end if;

  return json_build_object('ok', true, 'appointment', to_jsonb(v_appt));
end $$;

-- ---------------------------- cancellation ---------------------------
create or replace function public.cancel_appointment(p_appointment_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_appt public.appointments;
begin
  select * into v_appt from public.appointments where id = p_appointment_id for update;
  if not found then
    return json_build_object('ok', false, 'error', 'Appointment not found.');
  end if;

  if not (
    v_appt.patient_id = auth.uid()
    or public.is_dentist_owner(v_appt.dentist_id)
    or public.is_admin()
  ) then
    return json_build_object('ok', false, 'error', 'You are not allowed to cancel this appointment.');
  end if;

  if v_appt.status not in ('pending', 'confirmed') then
    return json_build_object('ok', false, 'error', 'Only pending or confirmed appointments can be cancelled.');
  end if;

  update public.appointments set status = 'cancelled' where id = p_appointment_id returning * into v_appt;

  if v_appt.patient_id is not null then
    insert into public.notifications (user_id, appointment_id, notification_type, message)
    values (v_appt.patient_id, v_appt.id, 'cancelled',
            format('Appointment %s has been cancelled. The time slot has been released.', v_appt.reference))
    on conflict do nothing;
  end if;

  return json_build_object('ok', true, 'appointment', to_jsonb(v_appt));
end $$;

-- ---------------------------- rescheduling ---------------------------
create or replace function public.reschedule_appointment(
  p_appointment_id uuid,
  p_appointment_date date,
  p_start_time time
) returns json language plpgsql security definer set search_path = public as $$
declare
  v_appt public.appointments;
  v_duration int;
  v_problem text;
begin
  select * into v_appt from public.appointments where id = p_appointment_id for update;
  if not found then
    return json_build_object('ok', false, 'error', 'Appointment not found.');
  end if;

  if not (
    v_appt.patient_id = auth.uid()
    or public.is_dentist_owner(v_appt.dentist_id)
    or public.is_admin()
  ) then
    return json_build_object('ok', false, 'error', 'You are not allowed to reschedule this appointment.');
  end if;

  if v_appt.status not in ('pending', 'confirmed') then
    return json_build_object('ok', false, 'error', 'Only pending or confirmed appointments can be rescheduled.');
  end if;

  select s.duration_minutes into v_duration from public.services s where s.id = v_appt.service_id;
  v_problem := public.slot_is_valid(v_appt.dentist_id, p_appointment_date, p_start_time, v_duration, p_appointment_id);
  if v_problem is not null then
    return json_build_object('ok', false, 'error', v_problem);
  end if;

  begin
    update public.appointments
    set appointment_date = p_appointment_date,
        start_time = p_start_time,
        end_time = p_start_time + make_interval(mins => v_duration)
    where id = p_appointment_id
    returning * into v_appt;
  exception when exclusion_violation then
    return json_build_object('ok', false, 'error', 'This time slot was just taken. Please choose another time.');
  end;

  if v_appt.patient_id is not null then
    insert into public.notifications (user_id, appointment_id, notification_type, message)
    values (v_appt.patient_id, v_appt.id, 'rescheduled',
            format('Appointment %s has been rescheduled to %s at %s.', v_appt.reference, v_appt.appointment_date, v_appt.start_time));
  end if;

  return json_build_object('ok', true, 'appointment', to_jsonb(v_appt));
end $$;

-- --------------------------- status changes --------------------------
create or replace function public.set_appointment_status(
  p_appointment_id uuid,
  p_status appointment_status
) returns json language plpgsql security definer set search_path = public as $$
declare
  v_appt public.appointments;
  v_allowed boolean := false;
begin
  select * into v_appt from public.appointments where id = p_appointment_id for update;
  if not found then
    return json_build_object('ok', false, 'error', 'Appointment not found.');
  end if;

  if not (
    v_appt.patient_id = auth.uid()
    or public.is_dentist_owner(v_appt.dentist_id)
    or public.is_admin()
  ) then
    return json_build_object('ok', false, 'error', 'You are not allowed to change this appointment.');
  end if;

  -- Allowed transitions.
  if v_appt.status = 'pending' and p_status in ('confirmed', 'cancelled', 'no_show') then v_allowed := true; end if;
  if v_appt.status = 'confirmed' and p_status in ('completed', 'cancelled', 'no_show') then v_allowed := true; end if;
  if v_appt.status = 'cancelled' and p_status = 'pending' then v_allowed := true; end if;
  if v_appt.status = 'no_show' and p_status = 'confirmed' then v_allowed := true; end if;
  if not v_allowed then
    return json_build_object('ok', false, 'error', format('Cannot move a %s appointment to %s.', v_appt.status, p_status));
  end if;

  update public.appointments set status = p_status where id = p_appointment_id returning * into v_appt;

  if v_appt.patient_id is not null and p_status in ('confirmed', 'cancelled') then
    insert into public.notifications (user_id, appointment_id, notification_type, message)
    values (
      v_appt.patient_id, v_appt.id,
      case when p_status = 'confirmed' then 'approved' else 'cancelled' end,
      format('Appointment %s is now %s.', v_appt.reference, p_status)
    );
  end if;

  return json_build_object('ok', true, 'appointment', to_jsonb(v_appt));
end $$;

-- ------------------------------ grants -------------------------------
grant execute on function public.book_appointment(uuid, uuid, uuid, date, time, text, text, text, text) to anon, authenticated;
grant execute on function public.cancel_appointment(uuid) to authenticated;
grant execute on function public.reschedule_appointment(uuid, date, time) to authenticated;
grant execute on function public.set_appointment_status(uuid, appointment_status) to authenticated;
grant execute on function public.slot_is_valid(uuid, date, time, int, uuid) to anon, authenticated;
