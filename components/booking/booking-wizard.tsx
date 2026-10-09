"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Check,
  CircleAlert,
  Clock,
  Loader2,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import type { Availability, Clinic, DentistWithDetails, Service, SessionUser, Slot } from "@/lib/types";
import { DAY_NAMES_SHORT } from "@/lib/constants";
import { formatTime12h } from "@/lib/availability";

export interface BookingWizardProps {
  services: Service[];
  dentists: DentistWithDetails[];
  clinics: Clinic[];
  availability: Record<string, Availability[]>;
  blockedDates: Record<string, string[]>;
  user: SessionUser | null;
  initialServiceId?: string;
  initialDentistId?: string;
  initialClinicId?: string;
}

const STEPS = ["Service", "Dentist", "Date & time", "Your details", "Confirm"];

export function BookingWizard(props: BookingWizardProps) {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(() => {
    if (props.initialServiceId && props.initialDentistId) return 2;
    if (props.initialServiceId) return 1;
    return 0;
  });

  const [serviceId, setServiceId] = useState<string | null>(props.initialServiceId ?? null);
  const [dentistId, setDentistId] = useState<string | null>(props.initialDentistId ?? null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [details, setDetails] = useState({
    patient_name: props.user?.full_name ?? "",
    patient_email: props.user?.email ?? "",
    patient_phone: props.user?.phone ?? "",
    patient_notes: "",
    consent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const service = useMemo(() => props.services.find((s) => s.id === serviceId) ?? null, [props.services, serviceId]);
  const dentist = useMemo(() => props.dentists.find((d) => d.id === dentistId) ?? null, [props.dentists, dentistId]);
  const clinic = useMemo(() => props.clinics.find((c) => c.id === dentist?.clinic_id) ?? null, [props.clinics, dentist]);

  const eligibleDentists = useMemo(
    () => (serviceId ? props.dentists.filter((d) => d.is_active && d.service_ids.includes(serviceId)) : []),
    [props.dentists, serviceId],
  );

  const workingDays = useMemo(() => {
    if (!dentistId) return new Set<number>();
    const rows = props.availability[dentistId] ?? [];
    return new Set(rows.map((r) => r.day_of_week));
  }, [dentistId, props.availability]);

  const blocked = useMemo(() => {
    if (!dentistId) return [];
    return (props.blockedDates[dentistId] ?? []).map((d) => new Date(`${d}T00:00:00`));
  }, [dentistId, props.blockedDates]);

  const isDayDisabled = useCallback(
    (day: Date) => {
      if (day < new Date(new Date().toDateString())) return true;
      if (!workingDays.has(day.getDay())) return true;
      return blocked.some((b) => b.toDateString() === day.toDateString());
    },
    [workingDays, blocked],
  );

  // Slots are fetched live from the API whenever the date changes.
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  useEffect(() => {
    if (!dentistId || !serviceId || !date) {
      setSlots([]);
      return;
    }
    let active = true;
    setSlotsLoading(true);
    setSlotsError(null);
    fetch(`/api/availability?dentistId=${dentistId}&serviceId=${serviceId}&date=${date}`)
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error ?? "Could not load availability.");
        return payload.slots as Slot[];
      })
      .then((data) => {
        if (active) setSlots(data);
      })
      .catch((err: Error) => {
        if (active) setSlotsError(err.message);
      })
      .finally(() => {
        if (active) setSlotsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dentistId, serviceId, date]);

  // Deep link support: /book-appointment?service=ID&dentist=ID&clinic=ID
  useEffect(() => {
    const pService = searchParams.get("service");
    const pDentist = searchParams.get("dentist");
    const pClinic = searchParams.get("clinic");
    if (pService && props.services.some((s) => s.id === pService)) setServiceId(pService);
    if (pDentist && props.dentists.some((d) => d.id === pDentist)) setDentistId(pDentist);
    if (pClinic && props.clinics.some((c) => c.id === pClinic)) {
      const found = props.dentists.find((d) => d.clinic_id === pClinic);
      if (found && !pDentist) setDentistId(found.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetDownstream(from: "service" | "dentist" | "date" | "time") {
    if (from === "service") {
      setDentistId(null);
      setDate(null);
      setTime(null);
    }
    if (from === "dentist") {
      setDate(null);
      setTime(null);
    }
    if (from === "date") setTime(null);
  }

  async function submitBooking() {
    setError(null);
    setFieldErrors({});

    // Client-side mirror of the server rules — the server always revalidates.
    if (!details.patient_name.trim() || details.patient_name.trim().length < 2) {
      setFieldErrors({ patient_name: "Enter the patient's full name." });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(details.patient_email)) {
      setFieldErrors({ patient_email: "Enter a valid email address." });
      return;
    }
    if (details.patient_phone.replace(/[^\d]/g, "").length < 7) {
      setFieldErrors({ patient_phone: "Enter a valid contact number." });
      return;
    }
    if (!details.consent) {
      setFieldErrors({ consent: "Please confirm the appointment details are accurate." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          dentist_id: dentistId,
          clinic_id: clinic?.id,
          appointment_date: date,
          start_time: time,
          patient_name: details.patient_name,
          patient_email: details.patient_email,
          patient_phone: details.patient_phone,
          patient_notes: details.patient_notes,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        if (res.status === 409) setTime(null); // slot was taken — force re-selection
        setError(payload.error ?? "Booking failed. Please try again.");
        setFieldErrors(payload.fieldErrors ?? {});
        return;
      }
      setReference(payload.appointment.reference);
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (reference) {
    return <BookingSuccess reference={reference} service={service} dentist={dentist} date={date} time={time} clinic={clinic} signedIn={Boolean(props.user)} />;
  }

  return (
    <div className="container max-w-5xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Book an appointment</h1>
        <p className="mt-2 text-muted-foreground">
          Four quick steps. You&apos;ll receive a confirmation email as soon as the clinic approves your slot.
        </p>
      </div>

      <ol className="mb-8 flex flex-wrap gap-2" aria-label="Booking progress">
        {STEPS.map((label, index) => {
          const state = index === step ? "current" : index < step ? "done" : "upcoming";
          return (
            <li key={label} className="flex-1">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium",
                  state === "current" && "border-primary bg-accent text-primary",
                  state === "done" && "border-primary/30 bg-primary/5 text-primary",
                  state === "upcoming" && "bg-muted/50 text-muted-foreground",
                )}
                aria-current={state === "current" ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                    state === "upcoming" ? "bg-muted-foreground/20" : "bg-primary text-primary-foreground",
                  )}
                >
                  {state === "done" ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                {label}
              </div>
            </li>
          );
        })}
      </ol>

      <Card>
        <CardContent className="p-6">
          {step === 0 ? (
            <div>
              <h2 className="text-lg font-semibold">1. Choose a service</h2>
              <p className="mt-1 text-sm text-muted-foreground">Select the treatment you need — you can ask questions before anything is done.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {props.services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setServiceId(s.id);
                      resetDownstream("service");
                    }}
                    aria-pressed={serviceId === s.id}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/50",
                      serviceId === s.id && "border-primary bg-accent ring-1 ring-primary",
                    )}
                  >
                    <span className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{s.name}</span>
                      {s.price ? <span className="text-xs text-muted-foreground">from ${s.price}</span> : null}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">{s.duration_minutes} min appointment</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div>
              <h2 className="text-lg font-semibold">2. Choose your dentist</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Dentists below offer <strong>{service?.name}</strong>.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {eligibleDentists.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No dentists currently offer this service. Please choose another service.</p>
                ) : (
                  eligibleDentists.map((d) => {
                    const days = [...new Set((props.availability[d.id] ?? []).map((r) => r.day_of_week))].sort();
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setDentistId(d.id);
                          resetDownstream("dentist");
                        }}
                        aria-pressed={dentistId === d.id}
                        className={cn(
                          "rounded-xl border p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/50",
                          dentistId === d.id && "border-primary bg-accent ring-1 ring-primary",
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
                            {d.profile.full_name.replace("Dr. ", "").split(" ").map((p) => p[0]).slice(0, 2).join("")}
                          </span>
                          <span>
                            <span className="block text-sm font-semibold">{d.profile.full_name}</span>
                            <span className="block text-xs text-muted-foreground">{d.specialization}</span>
                          </span>
                        </span>
                        <span className="mt-3 flex flex-wrap gap-1">
                          {days.map((day) => (
                            <Badge key={day} variant="secondary" className="text-[10px]">
                              {DAY_NAMES_SHORT[day]}
                            </Badge>
                          ))}
                        </span>
                        <span className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {d.clinic.name}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <h2 className="text-lg font-semibold">3. Pick a date &amp; time</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Availability for {dentist?.profile.full_name} · {service?.duration_minutes} minute appointments.
              </p>
              <div className="mt-5 grid gap-6 lg:grid-cols-[auto_1fr]">
                <div className="rounded-xl border p-3">
                  <DayPicker
                    mode="single"
                    selected={date ? new Date(`${date}T00:00:00`) : undefined}
                    onSelect={(day) => {
                      if (!day) return;
                      setDate(format(day, "yyyy-MM-dd"));
                      resetDownstream("date");
                    }}
                    disabled={isDayDisabled}
                    fromDate={new Date()}
                    showOutsideDays
                  />
                </div>

                <div>
                  {!date ? (
                    <div className="rounded-xl border border-dashed bg-accent/40 p-6 text-sm text-muted-foreground">
                      Select a date to see live availability.
                    </div>
                  ) : slotsLoading ? (
                    <div className="flex items-center gap-2 rounded-xl border p-6 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking live availability…
                    </div>
                  ) : slotsError ? (
                    <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                      {slotsError}
                    </p>
                  ) : slots.length === 0 ? (
                    <p className="rounded-xl border border-dashed bg-accent/40 p-6 text-sm text-muted-foreground">
                      This dentist has no working hours on the selected date. Please choose another date.
                    </p>
                  ) : (
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-medium">
                        <Clock className="h-4 w-4 text-primary" />
                        Available times for {date}
                      </p>
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {slots.map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setTime(slot.time)}
                            title={slot.available ? "Select this time" : slotReason(slot.reason)}
                            className={cn(
                              "rounded-lg border px-2 py-2 text-xs font-medium transition-colors",
                              slot.available
                                ? "hover:border-primary hover:bg-accent"
                                : "cursor-not-allowed bg-muted/60 text-muted-foreground line-through opacity-70",
                              time === slot.time && "border-primary bg-primary text-primary-foreground hover:bg-primary",
                            )}
                          >
                            {formatTime12h(slot.time)}
                          </button>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Greyed-out times are already booked, inside the dentist&apos;s break, or in the past.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <h2 className="text-lg font-semibold">4. Patient details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Only the details the clinic needs to confirm your appointment. No medical history is required here.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="patient_name">Patient full name</Label>
                  <Input
                    id="patient_name"
                    value={details.patient_name}
                    onChange={(e) => setDetails((d) => ({ ...d, patient_name: e.target.value }))}
                    autoComplete="name"
                  />
                  {fieldErrors.patient_name ? <p className="text-xs text-destructive">{fieldErrors.patient_name}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="patient_phone">Contact number</Label>
                  <Input
                    id="patient_phone"
                    value={details.patient_phone}
                    onChange={(e) => setDetails((d) => ({ ...d, patient_phone: e.target.value }))}
                    autoComplete="tel"
                  />
                  {fieldErrors.patient_phone ? <p className="text-xs text-destructive">{fieldErrors.patient_phone}</p> : null}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="patient_email">Email address</Label>
                  <Input
                    id="patient_email"
                    type="email"
                    value={details.patient_email}
                    onChange={(e) => setDetails((d) => ({ ...d, patient_email: e.target.value }))}
                    autoComplete="email"
                  />
                  {fieldErrors.patient_email ? <p className="text-xs text-destructive">{fieldErrors.patient_email}</p> : null}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="patient_notes">Notes for the clinic (optional)</Label>
                  <Textarea
                    id="patient_notes"
                    rows={4}
                    value={details.patient_notes}
                    onChange={(e) => setDetails((d) => ({ ...d, patient_notes: e.target.value }))}
                    placeholder="Anything the dentist should know — e.g. a chipped tooth, sensitivity, preferred language."
                  />
                  {fieldErrors.patient_notes ? <p className="text-xs text-destructive">{fieldErrors.patient_notes}</p> : null}
                </div>
              </div>

              <label className="mt-4 flex items-start gap-2.5 text-sm">
                <Checkbox checked={details.consent} onCheckedChange={(v) => setDetails((d) => ({ ...d, consent: v === true }))} />
                <span className="text-muted-foreground">
                  These details are accurate and I agree to the{" "}
                  <a href="/privacy-policy" className="font-medium text-primary hover:underline">
                    privacy policy
                  </a>
                  .
                </span>
              </label>
              {fieldErrors.consent ? <p className="mt-1 text-xs text-destructive">{fieldErrors.consent}</p> : null}
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <h2 className="text-lg font-semibold">5. Confirm your booking</h2>
              <p className="mt-1 text-sm text-muted-foreground">Please review the details below before confirming.</p>

              <dl className="mt-5 divide-y rounded-xl border">
                <SummaryRow label="Dentist" value={dentist?.profile.full_name ?? "—"} sub={dentist?.specialization} />
                <SummaryRow label="Service" value={service?.name ?? "—"} sub={service ? `${service.duration_minutes} minutes` : undefined} />
                <SummaryRow label="Date" value={date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "—"} />
                <SummaryRow label="Time" value={time ? formatTime12h(time) : "—"} />
                <SummaryRow
                  label="Clinic"
                  value={clinic?.name ?? "—"}
                  sub={clinic ? `${clinic.address}, ${clinic.city}, ${clinic.state} ${clinic.postal_code}` : undefined}
                />
                <SummaryRow label="Patient" value={details.patient_name} sub={`${details.patient_email} · ${details.patient_phone}`} />
                {details.patient_notes ? <SummaryRow label="Notes" value={details.patient_notes} /> : null}
              </dl>

              {!props.user ? (
                <p className="mt-4 rounded-lg border border-soft-blue bg-soft-blue/40 p-3 text-xs text-navy">
                  Booking as a guest.{" "}
                  <a href="/login?next=/book-appointment" className="font-medium text-primary hover:underline">
                    Sign in
                  </a>{" "}
                  to manage this appointment from your dashboard.
                </p>
              ) : null}

              {error ? (
                <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </p>
              ) : null}
            </div>
          ) : null}

          {error && step !== 4 ? (
            <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          ) : null}

          <Separator className="my-6" />

          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {step < 4 ? (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={
                  (step === 0 && !serviceId) ||
                  (step === 1 && !dentistId) ||
                  (step === 2 && (!date || !time))
                }
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={submitBooking} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
                {submitting ? "Confirming…" : "Confirm booking"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">
        {value}
        {sub ? <span className="block text-xs font-normal text-muted-foreground">{sub}</span> : null}
      </dd>
    </div>
  );
}

function slotReason(reason?: string): string {
  if (reason === "booked") return "Already booked";
  if (reason === "break") return "Dentist break";
  if (reason === "past") return "Time has passed";
  return "Unavailable";
}

function BookingSuccess({
  reference,
  service,
  dentist,
  date,
  time,
  clinic,
  signedIn,
}: {
  reference: string;
  service: Service | null;
  dentist: DentistWithDetails | null;
  date: string | null;
  time: string | null;
  clinic: Clinic | null;
  signedIn: boolean;
}) {
  return (
    <div className="container max-w-2xl py-14">
      <div className="rounded-2xl border bg-white p-8 text-center shadow-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-emerald-600">
          <Check className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Appointment request received</h1>
        <p className="mt-2 text-muted-foreground">
          The clinic will confirm your slot shortly. A confirmation email has been sent when email delivery is
          configured.
        </p>

        <div className="mt-7 rounded-xl border bg-accent/40 p-5 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Appointment reference</p>
          <p className="mt-1 text-2xl font-extrabold tracking-wide text-navy">{reference}</p>
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Dentist</dt>
              <dd className="font-medium">{dentist?.profile.full_name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Service</dt>
              <dd className="font-medium">{service?.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">When</dt>
              <dd className="font-medium">
                {date} {time ? `at ${formatTime12h(time)}` : ""}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Clinic</dt>
              <dd className="text-right font-medium">
                {clinic?.name}
                <span className="block text-xs font-normal text-muted-foreground">{clinic?.address}</span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          {signedIn ? (
            <Button asChild>
              <a href="/dashboard/appointments">View my appointments</a>
            </Button>
          ) : (
            <Button asChild>
              <a href="/signup">Create an account to manage it</a>
            </Button>
          )}
          <Button asChild variant="outline">
            <a href="/">Back to homepage</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
