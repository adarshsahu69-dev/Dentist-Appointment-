import { redirect } from "next/navigation";
import { BadgeCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DentistFormDialog } from "@/components/admin/dentist-form-dialog";
import { DentistActiveToggle } from "@/components/admin/dentist-active-toggle";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = { title: "Manage Dentists" };

export default async function AdminDentistsPage() {
  const user = await data.getSessionUser();
  if (!user || user.role !== "admin") redirect("/unauthorized");

  const [dentists, clinics, services] = await Promise.all([data.listDentists(), data.listClinics(), data.listServices()]);

  return (
    <div className="container py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Dentists</h1>
          <p className="mt-1 text-muted-foreground">Add clinicians, assign specializations and manage account status.</p>
        </div>
        <DentistFormDialog
          clinics={clinics.map((c) => ({ id: c.id, name: c.name }))}
          services={services.map((s) => ({ id: s.id, name: s.name }))}
          trigger={
            <Button>
              <UserPlus className="h-4 w-4" />
              Add dentist
            </Button>
          }
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {dentists.map((dentist) => (
          <Card key={dentist.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">{dentist.profile.full_name}</h2>
                    <Badge variant={dentist.is_active ? "success" : "muted"}>{dentist.is_active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <p className="text-sm text-primary">{dentist.specialization}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{dentist.qualifications}</p>
                </div>
                <span className="hidden h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary sm:flex">
                  <BadgeCheck className="h-5 w-5" />
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Experience</dt>
                  <dd className="font-medium">{dentist.experience_years} years</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Clinic</dt>
                  <dd className="font-medium">{dentist.clinic.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="truncate font-medium">{dentist.profile.email}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Services</dt>
                  <dd className="font-medium">{dentist.service_ids.length} assigned</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                <DentistFormDialog
                  clinics={clinics.map((c) => ({ id: c.id, name: c.name }))}
                  services={services.map((s) => ({ id: s.id, name: s.name }))}
                  dentist={{
                    id: dentist.id,
                    full_name: dentist.profile.full_name,
                    email: dentist.profile.email,
                    specialization: dentist.specialization,
                    qualifications: dentist.qualifications,
                    experience_years: dentist.experience_years,
                    biography: dentist.biography,
                    clinic_id: dentist.clinic_id,
                    is_active: dentist.is_active,
                    service_ids: dentist.service_ids,
                  }}
                  trigger={
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  }
                />
                <DentistActiveToggle id={dentist.id} isActive={dentist.is_active} />
                <Button asChild size="sm" variant="ghost">
                  <a href={`/dentists/${dentist.id}`}>Public profile</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
