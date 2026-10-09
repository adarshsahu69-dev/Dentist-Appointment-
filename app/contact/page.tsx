import { isDemoMode } from "@/lib/config";
import { ContactForm } from "@/components/contact/contact-form";
import { ClinicMap } from "@/components/clinic-map";
import { SectionHeading } from "@/components/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { data } from "@/lib/data";

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with DentalCare clinics for questions, emergencies and appointment changes.",
};

export const dynamic = "force-dynamic";

export default async function ContactPage({ searchParams }: { searchParams: { clinic?: string } }) {
  const clinics = await data.listClinics();
  const selected = clinics.find((c) => c.id === searchParams.clinic) ?? clinics[0];

  return (
    <div className="container py-12">
      <SectionHeading
        eyebrow="Contact"
        title="We're here to help"
        description="For dental emergencies during opening hours, always call the clinic directly — phone lines are answered before online messages."
      />

      {isDemoMode ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          Demo mode — this form validates your input and shows a confirmation, but no message is transmitted.
        </p>
      ) : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <ContactForm clinics={clinics.map((c) => ({ id: c.id, name: c.name }))} defaultClinicId={selected?.id} />

        <div className="space-y-6">
          {selected ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Selected clinic</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="font-semibold text-navy">{selected.name}</p>
                <p>
                  {selected.address}, {selected.city}, {selected.state} {selected.postal_code}
                </p>
                <p>{selected.opening_hours}</p>
                <p>
                  Phone:{" "}
                  <a className="text-primary" href={`tel:${selected.phone.replace(/[^\d+]/g, "")}`}>
                    {selected.phone}
                  </a>
                </p>
                <p>Email: care@dentalcare.example</p>
              </CardContent>
            </Card>
          ) : null}

          <ClinicMap clinics={clinics} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Emergencies</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Severe bleeding, swelling that affects breathing or swallowing, or trauma after an accident: call your
                nearest clinic immediately or attend an emergency department if the clinic is closed.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
