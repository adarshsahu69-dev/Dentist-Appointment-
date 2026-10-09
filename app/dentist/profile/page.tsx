import { redirect } from "next/navigation";
import { Mail, MapPin, Phone, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { data } from "@/lib/data";
import { formatTime12h } from "@/lib/availability";
import { DAY_NAMES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "My Profile" };

export default async function DentistProfilePage() {
  const user = await data.getSessionUser();
  if (!user || user.role !== "dentist" || !user.dentist_id) redirect("/unauthorized");

  const [dentist, availability, blockedDates] = await Promise.all([
    data.getDentist(user.dentist_id),
    data.listAvailability(user.dentist_id),
    data.listBlockedDates(user.dentist_id),
  ]);
  if (!dentist) redirect("/unauthorized");

  return (
    <div className="container max-w-3xl py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">{dentist.profile.full_name}</h1>
          <p className="mt-1 flex items-center gap-2 text-primary">
            <Stethoscope className="h-4 w-4" />
            {dentist.specialization}
          </p>
        </div>
        <Badge variant={dentist.is_active ? "success" : "muted"}>{dentist.is_active ? "Active" : "Deactivated"}</Badge>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">{dentist.biography}</p>
          <Separator />
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Experience</dt>
              <dd className="mt-1 font-medium">{dentist.experience_years} years</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Qualifications</dt>
              <dd className="mt-1 font-medium">{dentist.qualifications}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Clinic</dt>
              <dd className="mt-1 flex items-center gap-2 font-medium">
                <MapPin className="h-4 w-4 text-primary" />
                {dentist.clinic.name}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</dt>
              <dd className="mt-1 flex items-center gap-2 font-medium">
                <Phone className="h-4 w-4 text-primary" />
                {dentist.profile.phone ?? dentist.clinic.phone}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</dt>
              <dd className="mt-1 flex items-center gap-2 font-medium">
                <Mail className="h-4 w-4 text-primary" />
                {dentist.profile.email}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            Profile details are managed by the clinic administrator. Contact the front desk to request changes.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Weekly schedule</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dentist/schedule">Edit</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {availability.length === 0 ? (
            <p className="text-sm text-muted-foreground">No working hours published.</p>
          ) : (
            <ul className="divide-y text-sm">
              {availability.map((row) => (
                <li key={row.id} className="flex items-center justify-between py-2">
                  <span className="font-medium">{DAY_NAMES[row.day_of_week]}</span>
                  <span className="text-muted-foreground">
                    {formatTime12h(row.start_time)} – {formatTime12h(row.end_time)}
                    {row.break_start && row.break_end ? ` (break ${formatTime12h(row.break_start)}–${formatTime12h(row.break_end)})` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {blockedDates.length > 0 ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              {blockedDates.length} blocked date{blockedDates.length === 1 ? "" : "s"} configured.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
