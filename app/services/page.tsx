import Link from "next/link";
import { Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServiceIcon } from "@/components/services/service-icon";
import { SectionHeading } from "@/components/section-heading";
import { data } from "@/lib/data";

export const metadata = {
  title: "Dental Services",
  description: "Explore the full range of dental treatments available at DentalCare clinics.",
};

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await data.listServices();

  return (
    <div className="container py-12">
      <SectionHeading
        eyebrow="Treatments"
        title="Our dental services"
        description="Every treatment starts with an assessment and a clear plan. Prices shown are indicative starting points; your clinician confirms the final cost before any treatment begins."
      />

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id} className="flex flex-col transition-shadow hover:shadow-card-hover">
            <CardHeader>
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-primary">
                <ServiceIcon name={service.name} className="h-5 w-5" />
              </span>
              <CardTitle className="text-base">{service.name}</CardTitle>
              <CardDescription>{service.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                <Clock className="mr-1 h-3 w-3" />
                {service.duration_minutes} min
              </Badge>
              {service.price ? (
                <Badge variant="outline">
                  <DollarSign className="mr-1 h-3 w-3" />
                  from ${service.price}
                </Badge>
              ) : null}
              <Button asChild size="sm" variant="outline" className="ml-auto">
                <Link href={`/services/${service.id}`}>Details</Link>
              </Button>
              <Button asChild size="sm">
                <Link href={`/book-appointment?service=${service.id}`}>Book</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 rounded-xl border bg-accent/40 p-6 text-sm text-muted-foreground">
        <strong className="text-navy">A note on treatment outcomes:</strong> dental results depend on each
        patient&apos;s oral health, habits and adherence to aftercare instructions. We never guarantee specific
        outcomes, and we always present alternatives — including the option of no treatment.
      </div>
    </div>
  );
}
