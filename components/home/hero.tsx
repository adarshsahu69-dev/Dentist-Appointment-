import Link from "next/link";
import { ArrowRight, CalendarCheck, ShieldCheck, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const stats = [
  { icon: Users, value: "12,000+", label: "patients treated" },
  { icon: Star, value: "4.9/5", label: "patient satisfaction" },
  { icon: ShieldCheck, value: "3 clinics", label: "across Seattle" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-b from-mint via-background to-background">
      <div className="absolute inset-0 -z-10 opacity-[0.35]">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-soft-blue blur-3xl" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-mint blur-3xl" />
      </div>
      <div className="container grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div className="animate-fade-up">
          <Badge variant="secondary" className="mb-5 bg-white/80">
            Accepting new patients · Same-week appointments
          </Badge>
          <h1 className="text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
            Your Smile Deserves <span className="text-primary">the Best Care.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            DentalCare brings together experienced dentists, modern equipment and honest advice. Book a check-up,
            cleaning, orthodontic consultation or urgent visit online — in under two minutes, any time of day.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/book-appointment">
                <CalendarCheck className="h-5 w-5" />
                Book an Appointment
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/services">
                Explore Our Services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border bg-white/70 p-4 text-center shadow-sm">
                <stat.icon className="mx-auto h-5 w-5 text-primary" />
                <dt className="mt-2 text-lg font-bold text-navy">{stat.value}</dt>
                <dd className="text-xs text-muted-foreground">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative animate-fade-up [animation-delay:150ms]">
          <div className="overflow-hidden rounded-2xl border bg-white shadow-card-hover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=900&q=80"
              alt="Dentist treating a patient in a modern dental clinic"
              className="h-[380px] w-full object-cover lg:h-[460px]"
              loading="eager"
            />
          </div>
          <div className="absolute -bottom-6 left-4 hidden rounded-xl border bg-white p-4 shadow-card sm:block">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next available</p>
            <p className="mt-1 text-sm font-semibold text-navy">Tomorrow · 09:30 AM · Downtown</p>
          </div>
        </div>
      </div>
    </section>
  );
}
