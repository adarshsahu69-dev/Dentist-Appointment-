import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CancelAppointmentButton } from "@/components/appointments/cancel-appointment-button";
import { data } from "@/lib/data";
import { formatDateLong, formatTime12h, toISODate } from "@/lib/availability";

export const dynamic = "force-dynamic";

export const metadata = { title: "My Appointments" };

export default async function PatientAppointmentsPage() {
  const user = await data.getSessionUser();
  if (!user || (user.role !== "patient" && user.role !== "admin")) redirect("/login?next=/dashboard/appointments");

  const appointments = await data.listAppointmentsForPatient(user.id);
  const details = await data.enrichAppointments(appointments);
  const today = toISODate(new Date());

  const upcoming = details.filter((d) => d.appointment.appointment_date >= today && d.appointment.status !== "completed" && d.appointment.status !== "cancelled" && d.appointment.status !== "no_show");
  const past = details.filter((d) => !upcoming.includes(d));

  return (
    <div className="container py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">My appointments</h1>
          <p className="mt-1 text-muted-foreground">Upcoming visits, past visits and every booking reference in one place.</p>
        </div>
        <Button asChild>
          <Link href="/book-appointment">
            <CalendarPlus className="h-4 w-4" />
            Book an appointment
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="mt-8">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcoming.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="No upcoming appointments"
              description="Book your next check-up, cleaning or treatment and it will appear here."
              action={
                <Button asChild size="sm">
                  <Link href="/book-appointment">Book an appointment</Link>
                </Button>
              }
            />
          ) : (
            <div className="mt-4 space-y-4">
              {upcoming.map((item) => (
                <Card key={item.appointment.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-base font-semibold">{item.service.name}</h2>
                          <AppointmentStatusBadge status={item.appointment.status} />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatDateLong(item.appointment.appointment_date)} · {formatTime12h(item.appointment.start_time)} –{" "}
                          {formatTime12h(item.appointment.end_time)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.dentist.profile.full_name} · {item.clinic.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">Reference: {item.appointment.reference}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/appointments/${item.appointment.id}`}>Details</Link>
                        </Button>
                        <CancelAppointmentButton appointmentId={item.appointment.id} reference={item.appointment.reference} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {past.length === 0 ? (
            <EmptyState title="No past appointments" description="Completed and cancelled appointments will be listed here." />
          ) : (
            <div className="mt-4 space-y-4">
              {past.map((item) => (
                <Card key={item.appointment.id}>
                  <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-base font-semibold">{item.service.name}</h2>
                        <AppointmentStatusBadge status={item.appointment.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDateLong(item.appointment.appointment_date)} · {formatTime12h(item.appointment.start_time)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.dentist.profile.full_name} · {item.clinic.name}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/appointments/${item.appointment.id}`}>Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
