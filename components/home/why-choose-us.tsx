import { CalendarClock, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";

const reasons = [
  {
    icon: CalendarClock,
    title: "Booking that fits your day",
    description:
      "Real-time availability, evening and Saturday slots at selected clinics, and instant confirmation — no phone tag.",
  },
  {
    icon: ShieldCheck,
    title: "Transparent, conservative care",
    description:
      "We recommend treatment only when it is clinically indicated and explain every option, cost and timeline first.",
  },
  {
    icon: Sparkles,
    title: "Modern, comfortable clinics",
    description:
      "Digital imaging, low-noise handpieces and calm treatment rooms designed to reduce anxiety for all ages.",
  },
  {
    icon: HeartHandshake,
    title: "Continuity of care",
    description:
      "Your records, notes and appointment history stay with your clinician, whether you visit Downtown or Northgate.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="container py-16 lg:py-20" aria-labelledby="why-heading">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Why DentalCare</p>
        <h2 id="why-heading" className="mt-2 text-3xl font-bold">
          A calmer way to look after your teeth
        </h2>
        <p className="mt-3 text-muted-foreground">
          We combine clinical excellence with the small things that make dental visits easier — clear pricing, punctual
          appointments and clinicians who listen.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {reasons.map((reason) => (
          <div key={reason.title} className="flex gap-4 rounded-xl border bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
              <reason.icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold">{reason.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{reason.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
