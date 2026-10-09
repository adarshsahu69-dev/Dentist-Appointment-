import Link from "next/link";
import { Award, HeartPulse, ShieldCheck, Users } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { data } from "@/lib/data";

export const metadata = {
  title: "About DentalCare",
  description: "Our story, our values and the technology we use to keep your smile healthy.",
};

export const dynamic = "force-dynamic";

const values = [
  {
    icon: ShieldCheck,
    title: "Evidence first",
    description: "Treatment recommendations follow current clinical guidelines — never sales targets.",
  },
  {
    icon: Users,
    title: "One team, one record",
    description: "Shared notes across all three clinics mean you never repeat your story twice.",
  },
  {
    icon: HeartPulse,
    title: "Comfort matters",
    description: "Anxiety-friendly techniques, unhurried appointments and clear communication at every step.",
  },
];

export default async function AboutPage() {
  const [dentists, clinics] = await Promise.all([data.listDentists(), data.listClinics()]);

  return (
    <div className="container py-12">
      <SectionHeading
        eyebrow="About us"
        title="Gentle, modern dentistry in Seattle"
        description="DentalCare was founded on a simple idea: dental care should be easy to access, easy to understand and genuinely comfortable. Since 2009 our three clinics have looked after more than 12,000 patients."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {values.map((value) => (
          <Card key={value.title}>
            <CardHeader>
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-primary">
                <value.icon className="h-5 w-5" />
              </span>
              <CardTitle className="text-base">{value.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{value.description}</CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-16 grid gap-8 rounded-2xl border bg-accent/40 p-8 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">Technology and safety</h2>
          <p className="mt-3 text-muted-foreground">
            Digital intraoral cameras, low-dose X-rays and instrument tracking give us accurate diagnostics with
            transparent records. Sterilization cycles are logged and audited, and every clinical room is disinfected
            between patients.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <Award className="mt-0.5 h-4 w-4 text-primary" />
              All clinicians maintain current licensure and continuing education.
            </li>
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
              Patient records are access-controlled; only you and your care team can view them.
            </li>
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { value: "2009", label: "Founded" },
            { value: "12,000+", label: "Patients treated" },
            { value: String(dentists.length), label: "Specialist dentists" },
            { value: String(clinics.length), label: "Seattle clinics" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border bg-white p-5 text-center shadow-card">
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold">Careers</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          We are always interested in meeting associates, hygienists and dental nurses who share our approach. Send your
          CV to{" "}
          <a className="text-primary underline" href="mailto:careers@dentalcare.example">
            careers@dentalcare.example
          </a>
          .
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Badge variant="secondary">Associate Dentist — Downtown</Badge>
          <Badge variant="secondary">Dental Hygienist — Westside</Badge>
          <Badge variant="secondary">Front Desk Coordinator — Northgate</Badge>
        </div>
      </section>
    </div>
  );
}
