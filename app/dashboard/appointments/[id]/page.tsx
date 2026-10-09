import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarClock, MapPin, Phone, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { CancelAppointmentButton } from "@/components/appointments/cancel-appointment-button";
import { RescheduleDialog } from "@/components/appointments/reschedule-dialog";
import { data } from "@/lib/data";
import { formatDateLong, formatTime12h } from "@/lib/availability";
import { canMutateAppointment, canViewAppointment } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  return { title: "Appointment details" };
}

export default async function AppointmentDetailPage({ params }: { params: { id: string } }) {
  const user = await data.getSessionUser();
  if (!user) redirect(`/login?next=/dashboard/appointments/${params.id}`);

  const details = await data.getAppointmentDetails(params.id);
  if (!details) notFound();

  const { appointment, patient, dentist, service, clinic } = details;
  if (!canViewAppointment(user, appointment)) {
    return (
      <div className="container py-16">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-bold">You can&apos;t view this appointment</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Appointments are private. You can only access bookings that belong to you.
            </p>
            <Button asChild className="mt-5">
              <Link href="/dashboard/appointments">Back to my appointments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canChange = canMutateAppointment(user, appointment, "cancel");

  return (
    <div className="container max-w-3xl py-10">
      <Link href="/dashboard/appointments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" />
        My appointments
      </Link>

      <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">{service.name}</h1>
          <p className="mt-1 text-muted-foreground">Reference {appointment.reference}</p>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date &amp; time</dt>
              <dd className="mt-1 text-sm font-medium">
                {formatDateLong(appointment.appointment_date)}
                <span className="block text-muted-foreground">
                  {formatTime12h(appointment.start_time)} – {formatTime12h(appointment.end_time)}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dentist</dt>
              <dd className="mt-1 flex items-center gap-2 text-sm font-medium">
                <Stethoscope className="h-4 w-4 text-primary" />
                {dentist.profile.full_name}
                <span className="text-xs font-normal text-muted-foreground">{dentist.specialization}</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Clinic</dt>
              <dd className="mt-1 flex items-start gap-2 text-sm font-medium">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <span>
                  {clinic.name}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {clinic.address}, {clinic.city}, {clinic.state} {clinic.postal_code}
                  </span>
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Clinic phone</dt>
              <dd className="mt-1 flex items-center gap-2 text-sm font-medium">
                <Phone className="h-4 w-4 text-primary" />
                <a href={`tel:${clinic.phone.replace(/[^\d+]/g, "")}`} className="hover:text-primary">
                  {clinic.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Patient</dt>
              <dd className="mt-1 text-sm font-medium">
                {patient?.full_name ?? appointment.patient_name}
                <span className="block text-xs font-normal text-muted-foreground">
                  {patient?.email ?? appointment.patient_email} · {patient?.phone ?? appointment.patient_phone}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Booked on</dt>
              <dd className="mt-1 text-sm font-medium">{new Date(appointment.created_at).toLocaleDateString()}</dd>
            </div>
          </dl>

          {appointment.patient_notes ? (
            <div className="mt-6 rounded-lg border bg-accent/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
              <p className="mt-1 text-sm">{appointment.patient_notes}</p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${clinic.latitude},${clinic.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin className="h-4 w-4" />
                Get directions
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/dentists/${dentist.id}`}>View dentist profile</Link>
            </Button>
            {canChange ? <RescheduleDialog appointmentId={appointment.id} dentistId={appointment.dentist_id} serviceId={appointment.service_id} /> : null}
            {canChange ? <CancelAppointmentButton appointmentId={appointment.id} reference={appointment.reference} /> : null}
          </div>

          {!canChange ? (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              Only pending or confirmed appointments can be rescheduled or cancelled.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
