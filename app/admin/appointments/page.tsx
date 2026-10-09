import { redirect } from "next/navigation";
import { AppointmentFilters } from "@/components/admin/appointment-filters";
import { AdminAppointmentRow } from "@/components/admin/admin-appointment-row";
import { data } from "@/lib/data";
import type { AppointmentFilter } from "@/lib/data";
import { EmptyState } from "@/components/ui/empty-state";
import { canMutateAppointment, canTransition } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export const metadata = { title: "Manage Appointments" };

export default async function AdminAppointmentsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const user = await data.getSessionUser();
  if (!user || user.role !== "admin") redirect("/unauthorized");

  const filter: AppointmentFilter = {
    status: (typeof searchParams.status === "string" ? searchParams.status : "all") as AppointmentFilter["status"],
    dentist_id: typeof searchParams.dentist_id === "string" ? searchParams.dentist_id : undefined,
    date: typeof searchParams.date === "string" ? searchParams.date : undefined,
    query: typeof searchParams.q === "string" ? searchParams.q : undefined,
    page: typeof searchParams.page === "string" ? Number(searchParams.page) : 1,
    page_size: 20,
  };

  const [result, dentists] = await Promise.all([data.listAllAppointments(filter), data.listDentists()]);
  const details = await data.enrichAppointments(result.items);

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold">Appointments</h1>
      <p className="mt-1 text-muted-foreground">Every booking across the clinic, with search and filters.</p>

      <AppointmentFilters dentists={dentists.map((d) => ({ id: d.id, name: d.profile.full_name }))} />

      <p className="mt-6 text-sm text-muted-foreground">{result.total} appointment{result.total === 1 ? "" : "s"} found</p>

      {details.length === 0 ? (
        <EmptyState className="mt-6" icon="search" title="No appointments match these filters" description="Adjust the filters above or clear the search." />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Reference</th>
                <th className="px-4 py-3 text-left font-semibold">Patient</th>
                <th className="px-4 py-3 text-left font-semibold">Dentist</th>
                <th className="px-4 py-3 text-left font-semibold">Service</th>
                <th className="px-4 py-3 text-left font-semibold">Date &amp; time</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {details.map((item) => (
                <AdminAppointmentRow
                  key={item.appointment.id}
                  appointmentId={item.appointment.id}
                  reference={item.appointment.reference}
                  patient={item.patient?.full_name ?? item.appointment.patient_name}
                  dentist={item.dentist.profile.full_name}
                  service={item.service.name}
                  date={item.appointment.appointment_date}
                  time={item.appointment.start_time}
                  status={item.appointment.status}
                  canCancel={canMutateAppointment(user, item.appointment, "cancel")}
                  transitions={["confirmed", "completed", "cancelled", "no_show"].filter((s) => canTransition(item.appointment.status, s))}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.total > result.items.length ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Showing the first {result.items.length} of {result.total} results. Use the filters to narrow the list.
        </p>
      ) : null}
    </div>
  );
}
