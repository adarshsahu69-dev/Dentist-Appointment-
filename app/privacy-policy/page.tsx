import { Metadata } from "next";
import { SectionHeading } from "@/components/section-heading";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Privacy Policy" };

const sections = [
  {
    title: "What we collect",
    body: "We collect only the information needed to provide dental care and manage appointments: your name, contact details, appointment notes and the clinical records created during treatment. We do not ask for sensitive medical history through the public booking form.",
  },
  {
    title: "How we use it",
    body: "Your details are used to confirm and remind you about appointments, to provide treatment, to meet legal record-keeping obligations and to communicate with you about your care.",
  },
  {
    title: "Who can see it",
    body: "Access is restricted by role. Patients see only their own appointments; dentists see the records of patients booked with them; clinic administrators can manage bookings across the clinic. Access rules are enforced at the database level with row-level security policies.",
  },
  {
    title: "How long we keep it",
    body: "Dental records are retained for the period required by applicable regulations, after which they are securely destroyed or anonymised.",
  },
  {
    title: "Your rights",
    body: "You can request a copy of your records, ask for corrections, or ask us to delete information we are not legally required to keep. Contact care@dentalcare.example to make a request.",
  },
  {
    title: "Cookies",
    body: "We use a single session cookie to keep you signed in. It is httpOnly, is not used for advertising, and is removed when you sign out.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-3xl py-12">
      <SectionHeading eyebrow="Legal" title="Privacy Policy" description="Last updated: January 2026" />
      <div className="mt-10 space-y-4">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardContent className="p-6">
              <h2 className="text-base font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{section.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        This is a sample policy for demonstration. Have your final wording reviewed by a qualified legal professional
        before going live.
      </p>
    </div>
  );
}
