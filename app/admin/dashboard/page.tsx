import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, CalendarDays, Inbox, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { data } from "@/lib/data";
import { formatDateLong, toISODate } from "@/lib/availability";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const user = await data.getSessionUser();
  if (!user || user.role !== "admin") redirect("/unauthorized");

  const [stats, recent, auditLogs] = await Promise.all([
    data.getStats(),
    data.listAllAppointments({ page: 1, page_size: 8 }),
    data.listAuditLogs(),
  ]);
  const details = await data.enrichAppointments(recent.items);
  const today = toISODate(new Date());

  return (
    <div className="container py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Clinic overview</h1>
          <p className="mt-1 text-muted-foreground">Live booking activity across all DentalCare locations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/dentists">Manage dentists</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/services">Manage services</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/reports">Reports</Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Registered patients" value={stats.total_patients} />
        <StatCard icon={CalendarDays} label="Today's appointments" value={stats.todays_appointments} />
        <StatCard icon={CalendarCheck} label="Upcoming appointments" value={stats.upcoming_appointments} />
        <StatCard icon={Inbox} label="Pending requests" value={stats.pending_requests} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Total dentists" value={stats.total_dentists} sub={`${stats.active_dentists} active`} />
        <MiniStat label="Completed" value={stats.completed_appointments} />
        <MiniStat label="Cancelled" value={stats.cancelled_appointments} />
        <MiniStat label="All appointments" value={stats.total_appointments} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Latest bookings</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/appointments">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {details.length === 0 ? (
              <p className="text-sm text-muted-foreground">No appointments yet.</p>
            ) : (
              <ul className="divide-y">
                {details.map(({ appointment, service, dentist }) => (
                  <li key={appointment.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {appointment.reference} · {service.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.patient_name} · {dentist.profile.full_name} · {formatDateLong(appointment.appointment_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {appointment.appointment_date === today ? (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">TODAY</span>
                      ) : null}
                      <AppointmentStatusBadge status={appointment.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin activity log</CardTitle>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No administrative actions recorded yet.</p>
            ) : (
              <ul className="divide-y text-sm">
                {auditLogs.slice(0, 8).map((log) => (
                  <li key={log.id} className="py-2.5">
                    <p className="font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.entity} · {new Date(log.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
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

function MiniStat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-bold">
          {value}
          {sub ? <span className="ml-2 text-xs font-normal text-muted-foreground">{sub}</span> : null}
        </p>
      </CardContent>
    </Card>
  );
}
