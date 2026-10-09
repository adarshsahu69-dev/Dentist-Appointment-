import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, CalendarDays, Inbox, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { data } from "@/lib/data";
import { formatDateLong, formatTime12h, toISODate } from "@/lib/availability";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dentist Dashboard" };

export default async function DentistDashboardPage() {
  const user = await data.getSessionUser();
  if (!user || user.role !== "dentist") redirect("/unauthorized");
  if (!user.dentist_id) redirect("/unauthorized");

  const [stats, appointments] = await Promise.all([
    data.getDentistStats(user.dentist_id),
    data.listAppointmentsForDentist(user.dentist_id),
  ]);
  const details = await data.enrichAppointments(appointments);
  const today = toISODate(new Date());

  const todays = details.filter((d) => d.appointment.appointment_date === today && d.appointment.status !== "cancelled");
  const pending = details.filter((d) => d.appointment.status === "pending");
  const upcoming = details.filter(
    (d) => d.appointment.appointment_date > today && (d.appointment.status === "pending" || d.appointment.status === "confirmed"),
  );

  return (
    <div className="container py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Dr. {user.full_name.replace("Dr. ", "")}</h1>
          <p className="mt-1 text-muted-foreground">Your schedule, requests and patient list at a glance.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dentist/schedule">Manage availability</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarDays} label="Today's appointments" value={stats.today} />
        <StatCard icon={CalendarCheck} label="Upcoming" value={stats.upcoming} />
        <StatCard icon={Inbox} label="Pending requests" value={stats.pending} />
        <StatCard icon={Users} label="Completed" value={stats.completed} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Today</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dentist/appointments">All appointments</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {todays.length === 0 ? (
              <EmptyState icon="calendar" title="No appointments today" description="Enjoy the quiet day — or check upcoming bookings." />
            ) : (
              <ul className="divide-y">
                {todays.map(({ appointment, service, clinic }) => (
                  <li key={appointment.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium">
                        {formatTime12h(appointment.start_time)} · {service.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.patient_name} · {clinic.name}
                      </p>
                    </div>
                    <AppointmentStatusBadge status={appointment.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Pending requests</CardTitle>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <EmptyState title="No pending requests" description="New bookings will appear here for your approval." />
            ) : (
              <ul className="divide-y">
                {pending.slice(0, 6).map(({ appointment, service }) => (
                  <li key={appointment.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium">
                        {service.name} · {formatDateLong(appointment.appointment_date)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime12h(appointment.start_time)} · {appointment.patient_name}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/dentist/appointments">Review</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">This week</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming appointments scheduled.</p>
          ) : (
            <ul className="divide-y">
              {upcoming.slice(0, 8).map(({ appointment, service, patient }) => (
                <li key={appointment.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium">{formatDateLong(appointment.appointment_date)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime12h(appointment.start_time)} · {service.name} · {patient?.full_name ?? appointment.patient_name}
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
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
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
