import Link from "next/link";
import { CalendarDays, GraduationCap, MapPin, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DentistFilters } from "@/components/dentists/dentist-filters";
import { DentistPhoto } from "@/components/dentists/dentist-photo";
import { SectionHeading } from "@/components/section-heading";
import { data } from "@/lib/data";
import { isDemoMode } from "@/lib/config";

export const metadata = {
  title: "Our Dentists",
  description: "Browse DentalCare dentists by specialization, clinic and availability.",
};

export const dynamic = "force-dynamic";

export default async function DentistsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const filters = {
    specialization: typeof searchParams.specialization === "string" ? searchParams.specialization : undefined,
    clinic_id: typeof searchParams.clinic_id === "string" ? searchParams.clinic_id : undefined,
    query: typeof searchParams.q === "string" ? searchParams.q : undefined,
    available_day: typeof searchParams.day === "string" && searchParams.day !== "all" ? Number(searchParams.day) : undefined,
  };

  const [dentists, clinics] = await Promise.all([data.listDentists(filters), data.listClinics()]);
  const specializations = [...new Set((await data.listDentists()).map((d) => d.specialization))].sort();

  return (
    <div className="container py-12">
      <SectionHeading
        eyebrow="The team"
        title="Find your dentist"
        description="Filter by specialization, clinic location and the days you are available. Sample profiles are used in demo mode."
      />

      {isDemoMode ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          Demo data — these dentist profiles are fictional samples for demonstration purposes.
        </p>
      ) : null}

      <div className="mt-8">
        <DentistFilters specializations={specializations} clinics={clinics.map((c) => ({ id: c.id, name: c.name }))} />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        {dentists.length} dentist{dentists.length === 1 ? "" : "s"} found
      </p>

      {dentists.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon="search"
          title="No dentists match these filters"
          description="Try widening your search — for example, remove the specialization filter or choose a different day."
          action={
            <Button asChild variant="outline">
              <Link href="/dentists">Reset filters</Link>
            </Button>
          }
        />
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dentists.map((dentist) => (
            <article key={dentist.id} className="flex flex-col overflow-hidden rounded-xl border bg-white shadow-card transition-shadow hover:shadow-card-hover">
              <DentistPhoto name={dentist.profile.full_name} className="h-48 w-full" />
              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-base font-semibold">{dentist.profile.full_name}</h2>
                <p className="mt-0.5 text-sm text-primary">{dentist.specialization}</p>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{dentist.qualifications}</p>

                <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    {dentist.experience_years} years of experience
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {dentist.clinic.name}
                  </li>
                  <li className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Working days listed on profile
                  </li>
                </ul>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant={dentist.is_active ? "success" : "muted"}>{dentist.is_active ? "Accepting bookings" : "Not available"}</Badge>
                </div>

                <div className="mt-5 flex gap-2">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link href={`/dentists/${dentist.id}`}>
                      <GraduationCap className="h-4 w-4" />
                      Profile
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1" disabled={!dentist.is_active}>
                    <Link href={`/book-appointment?dentist=${dentist.id}`}>Book</Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
