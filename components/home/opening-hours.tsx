import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClinicMap } from "@/components/clinic-map";
import type { Clinic } from "@/lib/types";

export function OpeningHours({ clinics }: { clinics: Clinic[] }) {
  return (
    <section className="container py-16 lg:py-20" aria-labelledby="hours-heading">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Visit us</p>
          <h2 id="hours-heading" className="mt-2 text-3xl font-bold">
            Opening hours &amp; locations
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Walk-ins are welcome but appointments are strongly recommended — emergency slots are reserved every day at
            each clinic.
          </p>

          <div className="mt-8 space-y-4">
            {clinics.map((clinic) => (
              <Card key={clinic.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{clinic.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{clinic.opening_hours}</span>
                  </p>
                  <p>
                    {clinic.address}, {clinic.city}, {clinic.state} {clinic.postal_code} · {clinic.phone}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <ClinicMap clinics={clinics} />
          <p className="text-xs text-muted-foreground">
            Map data © Google. If the interactive map is unavailable, use the directions links to open the address in
            Google Maps.
          </p>
        </div>
      </div>
    </section>
  );
}
