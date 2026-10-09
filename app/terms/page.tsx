import { Metadata } from "next";
import { SectionHeading } from "@/components/section-heading";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Terms of Service" };

const sections = [
  {
    title: "Appointments",
    body: "Appointment requests are confirmed by the clinic. Please arrive 10 minutes before your slot. Late arrivals may need to be rebooked so other patients are not delayed.",
  },
  {
    title: "Cancellations",
    body: "You can cancel or reschedule from your dashboard up to the appointment time. Repeated no-shows may require a deposit for future bookings.",
  },
  {
    title: "Fees",
    body: "Fees are confirmed before treatment. Where a payment feature is not enabled on this site, payment is taken at the clinic.",
  },
  {
    title: "Medical advice",
    body: "Information on this website is general in nature and is not a substitute for an in-person assessment. Treatment outcomes vary and are never guaranteed.",
  },
  {
    title: "Accounts",
    body: "You are responsible for keeping your password secure. Tell us immediately if you believe your account has been accessed without permission.",
  },
];

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-12">
      <SectionHeading eyebrow="Legal" title="Terms of Service" description="Last updated: January 2026" />
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
    </div>
  );
}
