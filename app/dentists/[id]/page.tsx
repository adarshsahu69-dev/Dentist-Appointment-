import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarCheck, Clock, Mail, MapPin, Phone, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DentistPhoto } from "@/components/dentists/dentist-photo";
import { SectionHeading } from "@/components/section-heading";
import { ServiceIcon } from "@/components/services/service-icon";
import { data } from "@/lib/data";
import { DAY_NAMES } from "@/lib/constants";
import { formatTime12h } from "@/lib/availability";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const dentist = await data.getDentist(params.id);
  return { title: dentist ? dentist.profile.full_name : "Dentist" };
}

export default async function DentistDetailPage({ params }: { params: { id: string } }) {
  const [dentist, availability, blockedDates, services] = await Promise.all([
    data.getDentist(params.id),
    data.listAvailability(params.id),
    data.listBlockedDates(params.id),
    data.listServices(),
  ]);
  if (!dentist) notFound();

  const offered = services.filter((s) => dentist.service_ids.includes(s.id));
  const days = [...new Set(availability.map((a) => a.day_of_week))].sort();
  const upcomingBlocks = blockedDates.filter((b) => b.blocked_date >= new Date().toISOString().slice(0, 10));

  return (
    <div className="container py-12">
      <Link href="/dentists" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" />
        All dentists
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <DentistPhoto name={dentist.profile.full_name} className="h-72 w-full rounded-xl border shadow-card" />
          <Card className="mt-6">
            <CardContent className="space-y-3 p-5 text-sm">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {dentist.clinic.name}
              </p>
              <p className="flex items-start gap-2 text-muted-foreground">
                <Phone className="mt-0.5 h-4 w-4 text-primary" />
                <a href={`tel:${dentist.clinic.phone.replace(/[^\d+]/g, "")}`} className="hover:text-primary">
                  {dentist.clinic.phone}
                </a>
              </p>
              <p className="flex items-start gap-2 text-muted-foreground">
                <Clock className="mt-0.5 h-4 w-4 text-primary" />
                {dentist.clinic.opening_hours}
              </p>
              <p className="flex items-start gap-2 text-muted-foreground">
                <Mail className="mt-0.5 h-4 w-4 text-primary" />
                {dentist.profile.email}
              </p>
              <Button asChild className="w-full">
                <Link href={`/book-appointment?dentist=${dentist.id}`}>
                  <CalendarCheck className="h-4 w-4" />
                  Book Appointment
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <Badge variant={dentist.is_active ? "success" : "muted"}>{dentist.is_active ? "Accepting new patients" : "Not currently accepting bookings"}</Badge>
          <h1 className="mt-3 text-3xl font-bold">{dentist.profile.full_name}</h1>
          <p className="mt-1 flex items-center gap-2 text-primary">
            <Stethoscope className="h-4 w-4" />
            {dentist.specialization}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Badge variant="secondary">{dentist.experience_years} years experience</Badge>
            <Badge variant="secondary">{dentist.clinic.city} clinic</Badge>
            {offered.slice(0, 3).map((service) => (
              <Badge key={service.id} variant="outline">
                {service.name}
              </Badge>
            ))}
          </div>

          <p className="mt-6 text-muted-foreground">{dentist.biography}</p>

          <section className="mt-8">
            <h2 className="text-lg font-semibold">Qualifications</h2>
            <p className="mt-2 text-sm text-muted-foreground">{dentist.qualifications}</p>
          </section>

          <Separator className="my-8" />

          <section>
            <h2 className="text-lg font-semibold">Availability</h2>
            {days.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No availability published yet.</p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">Day</th>
                      <th className="px-4 py-2 text-left font-semibold">Hours</th>
                      <th className="px-4 py-2 text-left font-semibold">Break</th>
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((day) =>
                      availability
                        .filter((a) => a.day_of_week === day)
                        .map((row) => (
                          <tr key={row.id} className="border-t">
                            <td className="px-4 py-2 font-medium">{DAY_NAMES[row.day_of_week]}</td>
                            <td className="px-4 py-2">
                              {formatTime12h(row.start_time)} – {formatTime12h(row.end_time)}
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {row.break_start && row.break_end ? `${formatTime12h(row.break_start)} – ${formatTime12h(row.break_end)}` : "—"}
                            </td>
                          </tr>
                        )),
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {upcomingBlocks.length > 0 ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Upcoming unavailable dates</p>
                <ul className="mt-1 list-disc pl-5">
                  {upcomingBlocks.map((b) => (
                    <li key={b.id}>
                      {b.blocked_date}
                      {b.reason ? ` — ${b.reason}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold">Services offered</h2>
            {offered.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No services assigned yet.</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {offered.map((service) => (
                  <Link
                    key={service.id}
                    href={`/services/${service.id}`}
                    className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-accent/60"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                      <ServiceIcon name={service.name} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{service.name}</span>
                      <span className="block text-xs text-muted-foreground">{service.duration_minutes} min</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <section className="mt-16">
        <SectionHeading eyebrow="Clinic" title={dentist.clinic.name} description={dentist.clinic.opening_hours} />
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              {dentist.clinic.address}, {dentist.clinic.city}, {dentist.clinic.state} {dentist.clinic.postal_code}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" size="sm">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${dentist.clinic.latitude},${dentist.clinic.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get directions
                </a>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/contact?clinic=${dentist.clinic.id}`}>Contact this clinic</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
