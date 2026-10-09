-- =====================================================================
-- DentalCare — optional demo seed for Supabase mode
-- Run AFTER 0001/0002/0003 in the SQL editor.
-- Demo logins (password: Password123):
--   patient@demo.com · dentist@demo.com · admin@demo.com
-- =====================================================================

-- ------------------------------- clinics -----------------------------
insert into public.clinics (id, name, address, city, state, postal_code, latitude, longitude, phone, opening_hours) values
  ('00000000-0000-4000-8000-000000000101', 'DentalCare Downtown', '128 Harbour Street, Suite 400', 'Seattle', 'WA', '98104', 47.6021, -122.3363, '+1 (206) 555-0142', 'Mon–Fri 8:30 AM – 6:00 PM · Sat 9:00 AM – 2:00 PM'),
  ('00000000-0000-4000-8000-000000000102', 'DentalCare Westside', '4555 Admiralty Way', 'Seattle', 'WA', '98116', 47.5912, -122.3832, '+1 (206) 555-0178', 'Mon–Sat 9:00 AM – 6:00 PM'),
  ('00000000-0000-4000-8000-000000000103', 'DentalCare Northgate', '950 Northgate Mall, Unit 12', 'Seattle', 'WA', '98125', 47.7075, -122.3271, '+1 (206) 555-0193', 'Mon–Sat 9:00 AM – 5:30 PM')
on conflict (id) do nothing;

-- ------------------------------ services -----------------------------
insert into public.services (id, name, description, duration_minutes, price, is_active) values
  ('00000000-0000-4000-8000-000000000001', 'General Dentistry', 'Routine examinations, fillings and general dental care to keep your teeth and gums healthy year-round.', 30, 90, true),
  ('00000000-0000-4000-8000-000000000002', 'Teeth Cleaning', 'Professional scaling and polishing that removes plaque and tartar, helping prevent gum disease and decay.', 45, 120, true),
  ('00000000-0000-4000-8000-000000000003', 'Dental Checkups', 'A thorough oral examination, including screening for cavities, gum health and oral cancer risk factors.', 30, 75, true),
  ('00000000-0000-4000-8000-000000000004', 'Teeth Whitening', 'Clinician-supervised whitening treatments designed to reduce surface staining and brighten your smile.', 60, 320, true),
  ('00000000-0000-4000-8000-000000000005', 'Braces and Orthodontics', 'Assessment and treatment planning for crowded, spaced or misaligned teeth using modern orthodontic options.', 45, 250, true),
  ('00000000-0000-4000-8000-000000000006', 'Root Canal Treatment', 'Endodontic treatment to relieve tooth pain and save a badly infected or damaged tooth from extraction.', 60, 480, true),
  ('00000000-0000-4000-8000-000000000007', 'Dental Implants', 'Implant consultation, placement coordination and restoration planning for replacing missing teeth.', 90, 1500, true),
  ('00000000-0000-4000-8000-000000000008', 'Tooth Extraction', 'Safe, comfortable removal of severely damaged, decayed or impacted teeth, with aftercare guidance.', 45, 180, true),
  ('00000000-0000-4000-8000-000000000009', 'Pediatric Dentistry', 'Gentle, child-friendly dental care focused on prevention, early detection and building healthy habits.', 30, 85, true),
  ('00000000-0000-4000-8000-000000000010', 'Emergency Dental Care', 'Same-day assessment and urgent relief for dental pain, swelling, trauma or lost restorations.', 30, 150, true)
on conflict (id) do nothing;

-- --------------------------- demo auth users -------------------------
-- Public signup always creates patients; the seed explicitly escalates the
-- demo admin/dentist accounts. Real dentist and admin accounts should be
-- created by an administrator, never through the public signup form.
do $$
declare
  v_patient uuid := '00000000-0000-4000-8000-000000000301';
  v_dentist  uuid := '00000000-0000-4000-8000-000000000302';
  v_admin    uuid := '00000000-0000-4000-8000-000000000303';
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
  values
    ('00000000-0000-0000-0000-000000000000', v_patient, 'authenticated', 'authenticated', 'patient@demo.com', crypt('Password123', gen_salt('bf')), now(), now(), now(), '{"full_name":"Jamie Alvarez","phone":"+1 (206) 555-0110"}'::jsonb),
    ('00000000-0000-0000-0000-000000000000', v_dentist,  'authenticated', 'authenticated', 'dentist@demo.com',  crypt('Password123', gen_salt('bf')), now(), now(), now(), '{"full_name":"Dr. Amara Osei","phone":"+1 (206) 555-0143"}'::jsonb),
    ('00000000-0000-0000-0000-000000000000', v_admin,    'authenticated', 'authenticated', 'admin@demo.com',    crypt('Password123', gen_salt('bf')), now(), now(), now(), '{"full_name":"Clinic Administrator","phone":"+1 (206) 555-0100"}'::jsonb)
  on conflict (id) do nothing;

  -- The handle_new_user trigger creates patient profiles; escalate roles here.
  update public.profiles set role = 'dentist' where id = v_dentist;
  update public.profiles set role = 'admin'   where id = v_admin;
end $$;

-- ------------------------------ dentists -----------------------------
insert into public.dentists (id, profile_id, specialization, qualifications, experience_years, biography, clinic_id, is_active) values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000302', 'General & Family Dentistry', 'DDS, University of Washington · Member, American Dental Association', 12, 'Dr. Osei focuses on preventive dentistry and building long-term relationships with families.', '00000000-0000-4000-8000-000000000101', true)
on conflict (id) do nothing;

insert into public.dentist_services (dentist_id, service_id) values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000003'),
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000010')
on conflict do nothing;

-- ------------------------ dentist availability -----------------------
insert into public.dentist_availability (dentist_id, day_of_week, start_time, end_time, break_start, break_end) values
  ('00000000-0000-4000-8000-000000000201', 1, '09:00', '17:00', '12:00', '13:00'),
  ('00000000-0000-4000-8000-000000000201', 2, '09:00', '17:00', '12:00', '13:00'),
  ('00000000-0000-4000-8000-000000000201', 3, '09:00', '17:00', '12:00', '13:00'),
  ('00000000-0000-4000-8000-000000000201', 4, '09:00', '17:00', '12:00', '13:00'),
  ('00000000-0000-4000-8000-000000000201', 5, '09:00', '17:00', '12:00', '13:00'),
  ('00000000-0000-4000-8000-000000000201', 6, '09:00', '13:00', null, null)
on conflict do nothing;

-- --------------------- sample appointment (future) --------------------
insert into public.appointments (
  reference, patient_id, dentist_id, service_id, clinic_id,
  appointment_date, start_time, end_time, status,
  patient_notes, patient_name, patient_email, patient_phone
) values (
  'DC-000000-DEMO', '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000201',
  '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000101',
  current_date + 3, '10:00', '10:30', 'pending',
  'Routine six-month checkup', 'Jamie Alvarez', 'patient@demo.com', '+1 (206) 555-0110'
) on conflict do nothing;
