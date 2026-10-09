import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentActions } from "@/components/dentist/appointment-actions";
import { data } from "@/lib/data";
import { formatDateLong, formatTime12h, toISODate } from "@/lib/availability";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { canTransition } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export const metadata = { title: "My Appointments" };

export default async function DentistAppointmentsPage() {
  const user = await data.getSessionUser();
  if (!user || user.role !== "dentist" || !user.dentist_id) redirect("/unauthorized");

  const appointments = await data.listAppointmentsForDentist(user.dentist_id);
  const details = await data.enrichAppointments(appointments);
  const today = toISODate(new Date());

  const todayList = details.filter((d) => d.appointment.appointment_date === today && d.appointment.status !== "cancelled");
  const pending = details.filter((d) => d.appointment.status === "pending");
  const upcoming = details.filter(
    (d) => d.appointment.appointment_date >= today && d.appointment.status !== "cancelled" && d.appointment.status !== "completed" && d.appointment.status !== "no_show" && d.appointment.status !== "pending",
  );
  const past = details.filter((d) => d.appointment.status === "completed" || d.appointment.status === "no_show" || d.appointment.status === "cancelled");

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold">Appointments</h1>
      <p className="mt-1 text-muted-foreground">Confirm requests, mark treatments complete and review patient notes.</p>

      <Tabs defaultValue="today" className="mt-8">
        <TabsList>
          <TabsTrigger value="today">Today ({todayList.length})</TabsTrigger>
          <TabsTrigger value="pending">Requests ({pending.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>

        {([
          ["today", todayList],
          ["pending", pending],
          ["upcoming", upcoming],
          ["past", past],
        ] as const).map(([key, list]) => (
          <TabsContent key={key} value={key}>
            {list.length === 0 ? (
              <EmptyState title="Nothing here" description="New bookings and changes will appear in this list." />
            ) : (
              <div className="mt-4 space-y-4">
                {list.map((item) => (
                  <div key={item.appointment.id} className="rounded-xl border bg-white p-5 shadow-card">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
                          {item.patient?.full_name ?? item.appointment.patient_name} ·{" "}
                          {item.patient?.email ?? item.appointment.patient_email} · {item.patient?.phone ?? item.appointment.patient_phone}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.clinic.name} · Reference {item.appointment.reference}
                        </p>
                        {item.appointment.patient_notes ? (
                          <p className="mt-2 rounded-lg border bg-accent/40 p-3 text-sm">
                            <span className="font-medium">Patient notes: </span>
                            {item.appointment.patient_notes}
                          </p>
                        ) : null}
                      </div>
                      <AppointmentActions
                        appointmentId={item.appointment.id}
                        status={item.appointment.status}
                        allowedTransitions={["confirmed", "completed", "cancelled", "no_show"].filter((s) =>
                          canTransition(item.appointment.status, s),
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
