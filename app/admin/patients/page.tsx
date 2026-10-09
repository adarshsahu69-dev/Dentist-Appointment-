import { redirect } from "next/navigation";
import { Mail, Phone, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { data } from "@/lib/data";
import { formatDateLong } from "@/lib/availability";
import type { Appointment, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Patients" };

export default async function AdminPatientsPage() {
  const user = await data.getSessionUser();
  if (!user || user.role !== "admin") redirect("/unauthorized");

  const [patients, appointments] = await Promise.all([
    data.listProfiles("patient"),
    data.listAllAppointments({ page: 1, page_size: 1000 }),
  ]);

  const counts: Record<string, number> = {};
  for (const appt of appointments.items as Appointment[]) {
    if (appt.patient_id) counts[appt.patient_id] = (counts[appt.patient_id] ?? 0) + 1;
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold">Patients</h1>
      <p className="mt-1 text-muted-foreground">
        Registered patient accounts and their booking activity. Patient medical records stay with the clinical team.
      </p>

      {patients.length === 0 ? (
        <EmptyState className="mt-8" icon="search" title="No patients yet" description="Registered patients will appear here." />
      ) : (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {(patients as Profile[]).map((patient) => (
            <Card key={patient.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary">
                    <Users className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold">{patient.full_name}</h2>
                    <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {patient.email}
                    </p>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {patient.phone ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Registered {formatDateLong(patient.created_at.slice(0, 10))}</p>
                  </div>
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">
                    {counts[patient.id] ?? 0} booking{(counts[patient.id] ?? 0) === 1 ? "" : "s"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
