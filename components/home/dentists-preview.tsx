import Link from "next/link";
import { ArrowRight, GraduationCap, MapPin, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DentistPhoto } from "@/components/dentists/dentist-photo";
import type { DentistWithDetails } from "@/lib/types";

export function DentistsPreview({ dentists }: { dentists: DentistWithDetails[] }) {
  return (
    <section className="border-y bg-accent/50 py-16 lg:py-20" aria-labelledby="dentists-heading">
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Meet the team</p>
            <h2 id="dentists-heading" className="mt-2 text-3xl font-bold">
              Experienced clinicians you can trust
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Every dentist at DentalCare is licensed, continuously trained and happy to talk through your options
              before treatment starts.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dentists">
              All dentists
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dentists.slice(0, 3).map((dentist) => (
            <Card key={dentist.id} className="overflow-hidden transition-shadow hover:shadow-card-hover">
              <DentistPhoto name={dentist.profile.full_name} className="h-56 w-full" />
              <CardContent className="p-5">
                <h3 className="text-base font-semibold">{dentist.profile.full_name}</h3>
                <p className="mt-1 text-sm text-primary">{dentist.specialization}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Stethoscope className="h-3.5 w-3.5" />
                    {dentist.experience_years} yrs experience
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {dentist.clinic.name.replace("DentalCare ", "")}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{dentist.qualifications}</p>
                <div className="mt-4 flex items-center justify-between">
                  <Badge variant="secondary">
                    <GraduationCap className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dentists/${dentist.id}`}>View profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
