import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServiceIcon } from "@/components/services/service-icon";
import { SectionHeading } from "@/components/section-heading";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const service = await data.getService(params.id);
  return { title: service?.name ?? "Service", description: service?.description };
}

export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
  const [service, dentists] = await Promise.all([data.getService(params.id), data.listDentists()]);
  if (!service) notFound();

  const offering = dentists.filter((d) => d.service_ids.includes(service.id));

  return (
    <div className="container py-12">
      <Link href="/services" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" />
        All services
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
              <ServiceIcon name={service.name} className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-3xl font-bold">{service.name}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <Clock className="mr-1 h-3 w-3" />
                  Approx. {service.duration_minutes} minutes
                </Badge>
                {service.price ? (
                  <Badge variant="outline">
                    <DollarSign className="mr-1 h-3 w-3" />
                    From ${service.price}
                  </Badge>
                ) : (
                  <Badge variant="outline">Price confirmed at consultation</Badge>
                )}
                {!service.is_active ? <Badge variant="destructive">Currently unavailable</Badge> : null}
              </div>
            </div>
          </div>

          <p className="mt-6 text-lg text-muted-foreground">{service.description}</p>

          <div className="mt-8 rounded-xl border bg-accent/40 p-5">
            <h2 className="text-sm font-semibold">What to expect</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Your clinician reviews your history and explains the plan before any treatment begins.
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                You receive a written estimate for anything beyond the booked appointment.
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Treatment outcomes vary between patients; no result is guaranteed.
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Book this service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {offering.length} dentist{offering.length === 1 ? "" : "s"} currently offers this service.
              </p>
              <Button asChild className="w-full">
                <Link href={`/book-appointment?service=${service.id}`}>Book an appointment</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/contact">Ask a question</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dentists offering this service</CardTitle>
            </CardHeader>
            <CardContent>
              {offering.length === 0 ? (
                <p className="text-sm text-muted-foreground">No dentists are currently assigned to this service.</p>
              ) : (
                <ul className="space-y-3">
                  {offering.map((dentist) => (
                    <li key={dentist.id}>
                      <Link href={`/dentists/${dentist.id}`} className="group block rounded-lg border p-3 transition-colors hover:bg-accent/60">
                        <p className="text-sm font-semibold group-hover:text-primary">{dentist.profile.full_name}</p>
                        <p className="text-xs text-muted-foreground">{dentist.specialization}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <section className="mt-16">
        <SectionHeading
          eyebrow="Related care"
          title="Other services you may need"
          description="Combine treatments in a single visit where clinically appropriate — the clinic team will advise."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RelatedServices currentId={service.id} />
        </div>
      </section>
    </div>
  );
}

async function RelatedServices({ currentId }: { currentId: string }) {
  const services = (await data.listServices()).filter((s) => s.id !== currentId).slice(0, 3);
  return (
    <>
      {services.map((service) => (
        <Link key={service.id} href={`/services/${service.id}`} className="rounded-xl border p-5 transition-shadow hover:shadow-card">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
            <ServiceIcon name={service.name} />
          </span>
          <h3 className="mt-3 text-sm font-semibold">{service.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
        </Link>
      ))}
    </>
  );
}
