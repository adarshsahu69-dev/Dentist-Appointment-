# DentalCare — Smart Dentist Appointment Booking System

A production-oriented dental clinic platform built with **Next.js 14 (App Router)**, **React 18**, **TypeScript**, **Tailwind CSS**, **shadcn/ui-style components**, **Supabase (PostgreSQL + Auth + RLS)** and **Google Maps**.

Patients can browse services and dentists, check live availability and book appointments. Dentists manage their schedule and confirm requests. Clinic administrators manage dentists, services, clinics, appointments and reports.

The app runs in **demo mode out of the box** (no credentials required) and switches to Supabase automatically when environment variables are configured.

---

## 1. Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional — demo mode works without it)
cp .env.example .env.local

# 3. Run the development server
npm run dev          # http://localhost:3000
```

### Demo accounts (demo mode only)

| Role | Email | Password |
| --- | --- | --- |
| Patient | `patient@demo.com` | `Password123` |
| Dentist | `dentist@demo.com` | `Password123` |
| Admin | `admin@demo.com` | `Password123` |

The login page lists these accounts with one-click fill buttons.

---

## 2. Feature overview

### Public website
- Homepage with hero, featured dentists, popular treatments, “Why choose us”, opening hours, map, FAQ and footer.
- Services catalogue (10 services) with detail pages.
- Dentist directory with search and filters (specialization, clinic, availability day).
- Dentist profiles with qualifications, availability table, blocked dates and services offered.
- Clinics page with Google Maps integration and “Get directions” links.
- About, contact (validated form), privacy policy and terms pages.
- Testimonials are clearly labelled as **demo content**.

### Authentication & authorization
- Email/password signup with validation and privacy-policy consent.
- Login, logout, forgot password and password reset flows.
- Session persistence via httpOnly, HMAC-signed cookies (demo mode) or Supabase Auth cookies (production).
- Role-based access control enforced in **middleware**, **server route handlers** and **database RLS policies**.
- Public signup can only create **patient** accounts — dentist/admin roles are assigned by administrators.

### Appointment booking (primary feature)
Multi-step flow: **service → dentist → date → time → patient details → confirmation**

- Live availability grid generated from each dentist’s working hours, breaks and service duration.
- Double booking prevented by an in-process lock (demo) and a Postgres **exclusion constraint** (production).
- Server-side validation of every field; guests may book, signed-in patients are linked automatically.
- Cancellation and rescheduling release the original slot immediately.
- Appointment statuses: `pending`, `confirmed`, `completed`, `cancelled`, `no_show` with enforced transitions.
- Reference numbers, email confirmations (when configured) and in-app notifications.

### Dashboards
- **Patient**: overview, upcoming/past appointments, details, cancel, reschedule, profile settings.
- **Dentist**: today/upcoming/completed/pending, confirm or reject requests, mark completed, notes, weekly schedule, availability editor, blocked dates.
- **Admin**: clinic KPIs, appointment search/filters, patient list, dentist management, service and clinic management, reports with charts, audit log.

### Notifications
- In-app notifications plus transactional email via **Resend** when `RESEND_API_KEY` is set.
- Reminder endpoint (`/api/reminders`) protected by `CRON_SECRET`.
- Duplicate notifications are suppressed.

---

## 3. Project structure

```
app/
  page.tsx, layout.tsx, error.tsx, loading.tsx, not-found.tsx
  (public)            services/ · dentists/ · clinics/ · about/ · contact/ ·
                      login/ · signup/ · forgot-password/ · reset-password/ ·
                      privacy-policy/ · terms/ · unauthorized/
  book-appointment/   multi-step booking wizard
  dashboard/          patient dashboard, appointments, profile
  dentist/            dashboard, appointments, schedule, profile
  admin/              dashboard, appointments, patients, dentists, services, clinics, reports
  api/                auth/ · appointments/ · availability/ · dentist/ · admin/ · profile/ · contact/ · reminders/
components/
  ui/                 shadcn/ui-style primitives (button, card, dialog, select, tabs, table, calendar…)
  layout/             header, footer, dashboard navigation
  home/ · booking/ · appointments/ · dentist/ · admin/ · auth/ · dashboard/
lib/
  availability.ts     pure slot-generation + validation logic (unit-tested)
  booking logic       lib/data/{provider,demo,supabase,demo-support}.ts
  auth/               password hashing (scrypt), HMAC session cookies
  rbac.ts             pure role/ownership rules (unit-tested)
  validation.ts       zod schemas shared by client and server
  notifications.ts    Resend integration with graceful demo fallback
  rate-limit.ts       fixed-window limiter for sensitive endpoints
supabase/migrations/  0001_schema.sql · 0002_rls.sql · 0003_functions.sql · seed.sql
tests/                vitest suites for auth, availability, booking and validation
```

All writes go through validated API route handlers; read paths use server components. Business rules live in `lib/` so they are shared by demo mode, production mode and the tests.

---

## 4. Environment configuration

Copy `.env.example` to `.env.local`:

| Variable | Purpose | Required |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for privileged operations | Production |
| `AUTH_SECRET` | Signs demo-mode session cookies | Production (recommended) |
| `RESEND_API_KEY` | Enables transactional email | Optional |
| `NOTIFICATIONS_FROM_EMAIL` | Sender address | Optional |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Browser key for Maps (restrict by HTTP referrer) | Optional |
| `CRON_SECRET` | Protects `/api/reminders` | Optional |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL | Recommended |

**Demo mode** activates automatically when the Supabase variables are missing: the app uses seeded in-memory data, the same validation rules and the same UI. A banner makes it obvious when demo mode is active. Demo data resets when the server restarts.

> Demo mode keeps state in the server process, so it is intended for local development. On serverless platforms (Vercel, Netlify) configure Supabase so data persists between requests.

> Never expose `SUPABASE_SERVICE_ROLE_KEY` through a `NEXT_PUBLIC_` variable, and restrict the Google Maps browser key to your domains in the Google Cloud console.

---

## 5. Supabase setup

```bash
# 1. Create a project at https://supabase.com
# 2. Apply migrations (SQL editor or Supabase CLI)
supabase db push                       # or paste supabase/migrations/*.sql in order

# 3. Optional demo data
#    run supabase/seed.sql in the SQL editor
```

Migrations create:
- Normalized tables (`profiles`, `clinics`, `services`, `dentists`, `dentist_services`, `dentist_availability`, `blocked_dates`, `appointments`, `notifications`, `audit_logs`) with foreign keys, indexes and constraints.
- `appointments_no_overlap` — a GiST exclusion constraint preventing overlapping pending/confirmed appointments per dentist.
- RLS policies: patients see only their own records, dentists only their appointments, admins everything.
- Security-definer functions: `book_appointment`, `cancel_appointment`, `reschedule_appointment`, `set_appointment_status` — all writes are validated inside the database.
- `handle_new_user` trigger that creates a **patient** profile for every new auth user (role escalation is impossible through public signup).

Recommended: also enable email confirmations in Supabase Auth → Providers for production.

---

## 6. Testing

```bash
npm test           # vitest (71 tests)
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm run build      # production build
```

Test coverage includes:
- **Authentication** — password hashing/verification, no plain-text storage, signed session cookies (tamper + expiry rejection), RBAC area access.
- **Appointment booking** — slot generation (working hours, breaks, blocked dates, past times, duration alignment), server-side slot validation, double-booking prevention (sequential and concurrent), cancellation releasing slots, rescheduling, status transitions, guest→patient linking.
- **Role permissions** — appointment visibility/mutation ownership rules and status transition matrix.
- **Validation** — zod schemas for signup, login, booking, profile and contact forms.

---

## 7. Security practices

- Server-side validation on every endpoint (zod), never trusting client input.
- RBAC checks in middleware, route handlers and RLS policies; the UI never relies on hidden buttons.
- Passwords hashed with scrypt (demo) or Supabase Auth (production); never stored in plain text.
- Rate limiting on login, signup, booking, cancellation, availability and password reset endpoints.
- httpOnly, SameSite session cookies with HMAC signatures (Web Crypto, Edge-compatible).
- Minimal personal data collection; no sensitive medical history in the public booking form.
- Audit log entries for administrative actions (dentist/service/clinic changes).
- Generic error messages for authentication failures (no account enumeration).

---

## 8. Deployment (Vercel)

1. Push the repository to GitHub and import it in Vercel.
2. Add the environment variables from section 4.
3. Deploy — the app runs in production mode with Supabase when configured.
4. Schedule `GET /api/reminders` with the `CRON_SECRET` bearer token (e.g. Vercel Cron) to send appointment reminders.

```json
// vercel.json (optional cron example)
{ "crons": [{ "path": "/api/reminders", "schedule": "0 8 * * *" }] }
```

---

## 9. Notes and limitations

- Demo mode stores data in memory and resets on restart; production data lives in Supabase.
- In production, email notifications require a Resend account; without it the app still records in-app notifications and never claims an email was sent.
- Google Maps requires a browser key restricted by HTTP referrer; without it the UI shows addresses and plain directions links.
- Testimonials and dentist photos are illustrative samples and are labelled as such.
- Payments are intentionally out of scope until a payment provider is configured.
