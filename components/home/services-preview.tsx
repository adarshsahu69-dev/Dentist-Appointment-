import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServiceIcon } from "@/components/services/service-icon";

export function ServicesPreview({ services }: { services: { id: string; name: string; description: string; duration_minutes: number; price: number | null }[] }) {
  return (
    <section className="container py-16 lg:py-20" aria-labelledby="services-heading">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Popular treatments</p>
          <h2 id="services-heading" className="mt-2 text-3xl font-bold">
            Dental services for every stage of life
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            From routine hygiene to complex restorative work, our clinicians explain each option — including costs and
            realistic timelines — before any treatment begins.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/services">
            View all services
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id} className="group transition-shadow hover:shadow-card-hover">
            <CardHeader>
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <ServiceIcon name={service.name} className="h-5 w-5" />
              </span>
              <CardTitle className="text-base">{service.name}</CardTitle>
              <CardDescription className="line-clamp-3">{service.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{service.duration_minutes} min</Badge>
                {service.price ? <Badge variant="outline">from ${service.price}</Badge> : null}
              </div>
              <Button asChild size="sm" variant="ghost">
                <Link href={`/book-appointment?service=${service.id}`}>Book</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
