import { redirect } from "next/navigation";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClinicFormDialog } from "@/components/admin/clinic-form-dialog";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = { title: "Manage Clinics" };

export default async function AdminClinicsPage() {
  const user = await data.getSessionUser();
  if (!user || user.role !== "admin") redirect("/unauthorized");

  const clinics = await data.listClinics();
  const dentists = await data.listDentists();

  return (
    <div className="container py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Clinics</h1>
          <p className="mt-1 text-muted-foreground">Locations, addresses, coordinates and opening hours.</p>
        </div>
        <ClinicFormDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              Add clinic
            </Button>
          }
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {clinics.map((clinic) => {
          const team = dentists.filter((d) => d.clinic_id === clinic.id);
          return (
            <Card key={clinic.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">{clinic.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {clinic.address}, {clinic.city}, {clinic.state} {clinic.postal_code}
                    </p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">
                    <MapPin className="h-4 w-4" />
                  </span>
                </div>

                <dl className="mt-4 space-y-1.5 text-xs">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="font-medium">{clinic.phone}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Hours</dt>
                    <dd className="text-right font-medium">{clinic.opening_hours}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Coordinates</dt>
                    <dd className="font-medium">
                      {clinic.latitude ?? "—"}, {clinic.longitude ?? "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Dentists</dt>
                    <dd className="font-medium">{team.length}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <ClinicFormDialog
                    clinic={{
                      id: clinic.id,
                      name: clinic.name,
                      address: clinic.address,
                      city: clinic.city,
                      state: clinic.state,
                      postal_code: clinic.postal_code,
                      latitude: clinic.latitude,
                      longitude: clinic.longitude,
                      phone: clinic.phone,
                      opening_hours: clinic.opening_hours,
                    }}
                    trigger={
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    }
                  />
                  <Button asChild size="sm" variant="ghost">
                    <a href={`https://www.google.com/maps/search/?api=1&query=${clinic.latitude},${clinic.longitude}`} target="_blank" rel="noopener noreferrer">
                      View on map
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
