import Link from "next/link";
import { Clock, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClinicMap } from "@/components/clinic-map";
import { SectionHeading } from "@/components/section-heading";
import { data } from "@/lib/data";

export const metadata = {
  title: "Our Clinics",
  description: "Find DentalCare clinic locations, opening hours and directions.",
};

export const dynamic = "force-dynamic";

export default async function ClinicsPage() {
  const [clinics, dentists] = await Promise.all([data.listClinics(), data.listDentists()]);

  return (
    <div className="container py-12">
      <SectionHeading
        eyebrow="Locations"
        title="Our clinics"
        description="Three modern clinics across Seattle, each with on-site digital imaging, sterilization suites and step-free access."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {clinics.map((clinic) => {
          const team = dentists.filter((d) => d.clinic_id === clinic.id);
          return (
            <Card key={clinic.id} className="transition-shadow hover:shadow-card-hover">
              <CardHeader>
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-primary">
                  <MapPin className="h-5 w-5" />
                </span>
                <CardTitle className="text-base">{clinic.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  {clinic.address}, {clinic.city}, {clinic.state} {clinic.postal_code}
                </p>
                <p className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {clinic.opening_hours}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <a href={`tel:${clinic.phone.replace(/[^\d+]/g, "")}`} className="hover:text-primary">
                    {clinic.phone}
                  </a>
                </p>
                <p className="pt-1 text-xs">
                  {team.length} dentist{team.length === 1 ? "" : "s"} based here
                </p>
                <div className="flex flex-wrap gap-2 pt-3">
                  <Button asChild size="sm">
                    <Link href={`/book-appointment?clinic=${clinic.id}`}>Book here</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/contact?clinic=${clinic.id}`}>Contact</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <section className="mt-14">
        <h2 className="text-2xl font-bold">Find us on the map</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Each clinic has on-site or nearby parking, and all locations are reachable by public transport.
        </p>
        <div className="mt-6">
          <ClinicMap clinics={clinics} />
        </div>
      </section>
    </div>
  );
}
