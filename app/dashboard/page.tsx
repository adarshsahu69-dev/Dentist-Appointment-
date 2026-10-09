import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus, CalendarX, Clock, Stethoscope, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { data } from "@/lib/data";
import { formatDateLong, formatTime12h, toISODate } from "@/lib/availability";

export const dynamic = "force-dynamic";

export const metadata = { title: "My Dashboard" };

export default async function PatientDashboardPage() {
  const user = await data.getSessionUser();
  if (!user || (user.role !== "patient" && user.role !== "admin")) redirect("/login?next=/dashboard");

  const appointments = await data.listAppointmentsForPatient(user.id);
  const details = await data.enrichAppointments(appointments);
  const today = toISODate(new Date());

  const upcoming = details.filter((d) => d.appointment.appointment_date >= today && d.appointment.status !== "cancelled" && d.appointment.status !== "completed");
  const next = upcoming[0];
  const recent = details.slice(0, 5);

  return (
    <div className="container py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Hello, {user.full_name.split(" ")[0]}</h1>
          <p className="mt-1 text-muted-foreground">Here&apos;s an overview of your dental care at DentalCare.</p>
        </div>
        <Button asChild>
          <Link href="/book-appointment">
            <CalendarPlus className="h-4 w-4" />
            Book an appointment
          </Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarPlus} label="Total appointments" value={String(details.length)} />
        <StatCard icon={Clock} label="Upcoming" value={String(upcoming.length)} />
        <StatCard icon={Stethoscope} label="Completed" value={String(details.filter((d) => d.appointment.status === "completed").length)} />
        <StatCard icon={CalendarX} label="Cancelled" value={String(details.filter((d) => d.appointment.status === "cancelled").length)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Next appointment</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/appointments">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {next ? (
              <div className="rounded-xl border bg-accent/40 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{next.service.name}</p>
                    <p className="text-sm text-muted-foreground">with {next.dentist.profile.full_name}</p>
                  </div>
                  <AppointmentStatusBadge status={next.appointment.status} />
                </div>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Date</dt>
                    <dd className="font-medium">{formatDateLong(next.appointment.appointment_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Time</dt>
                    <dd className="font-medium">{formatTime12h(next.appointment.start_time)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Clinic</dt>
                    <dd className="font-medium">{next.clinic.name}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Reference</dt>
                    <dd className="font-medium">{next.appointment.reference}</dd>
                  </div>
                </dl>
                <Button asChild size="sm" variant="outline" className="mt-4">
                  <Link href={`/dashboard/appointments/${next.appointment.id}`}>Manage appointment</Link>
                </Button>
              </div>
            ) : (
              <EmptyState
                title="No upcoming appointments"
                description="When you book your next visit it will appear here with the option to reschedule or cancel."
                action={
                  <Button asChild size="sm">
                    <Link href="/book-appointment">Book an appointment</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No appointments yet.</p>
            ) : (
              <ul className="divide-y">
                {recent.map(({ appointment, service, dentist }) => (
                  <li key={appointment.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link href={`/dashboard/appointments/${appointment.id}`} className="truncate text-sm font-medium hover:text-primary">
                        {service.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatDateLong(appointment.appointment_date)} · {dentist.profile.full_name}
                      </p>
                    </div>
                    <AppointmentStatusBadge status={appointment.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Your details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary">
              <UserCircle className="h-5 w-5" />
            </span>
            <div className="text-sm">
              <p className="font-medium">{user.full_name}</p>
              <p className="text-muted-foreground">
                {user.email}
                {user.phone ? ` · ${user.phone}` : ""}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/profile">Edit profile</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
