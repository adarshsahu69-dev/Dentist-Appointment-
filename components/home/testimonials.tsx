import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "Booking online took two minutes and I got a confirmation straight away. The hygienist explained everything before starting.",
    name: "R. Patel",
    detail: "Teeth cleaning · Downtown clinic",
  },
  {
    quote:
      "My son actually looks forward to his check-ups now. The pediatric team is patient and gentle with nervous children.",
    name: "L. Whitfield",
    detail: "Pediatric dentistry · Westside clinic",
  },
  {
    quote:
      "I had a broken tooth on a Sunday evening and was seen the next morning. Clear pricing, no pressure to upsell.",
    name: "M. Okafor",
    detail: "Emergency dental care · Northgate clinic",
  },
];

export function Testimonials() {
  return (
    <section className="border-y bg-accent/50 py-16 lg:py-20" aria-labelledby="testimonials-heading">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Patient stories</p>
          <h2 id="testimonials-heading" className="mt-2 text-3xl font-bold">
            What our patients say
          </h2>
          <p className="mt-3 text-sm text-amber-800">
            Demo content — these are illustrative sample reviews, not real patient testimonials. They will be replaced
            with verified reviews before launch.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <figure key={item.name} className="flex h-full flex-col rounded-xl border bg-white p-6 shadow-card">
              <Quote className="h-6 w-6 text-primary" aria-hidden="true" />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground">“{item.quote}”</blockquote>
              <figcaption className="mt-5 border-t pt-4 text-sm">
                <span className="font-semibold text-navy">{item.name}</span>
                <span className="block text-xs text-muted-foreground">{item.detail}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
