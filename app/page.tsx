import Link from "next/link";
import { ArrowRight, CalendarCheck, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/home/hero";
import { ServicesPreview } from "@/components/home/services-preview";
import { DentistsPreview } from "@/components/home/dentists-preview";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { Testimonials } from "@/components/home/testimonials";
import { OpeningHours } from "@/components/home/opening-hours";
import { Faq } from "@/components/home/faq";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [services, dentists, clinics] = await Promise.all([
    data.listServices(),
    data.listDentists(),
    data.listClinics(),
  ]);

  return (
    <>
      <Hero />
      <ServicesPreview services={services.slice(0, 6)} />
      <DentistsPreview dentists={dentists} />
      <WhyChooseUs />
      <Testimonials />
      <OpeningHours clinics={clinics} />

      <section className="container pb-4">
        <div className="rounded-2xl bg-navy px-6 py-12 text-center text-white lg:px-16">
          <h2 className="text-3xl font-bold text-white">Ready to book your visit?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Choose your service, pick a time that suits you and we&apos;ll confirm your appointment by email. It takes
            less than two minutes.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary" className="bg-white text-navy hover:bg-slate-100">
              <Link href="/book-appointment">
                <CalendarCheck className="h-5 w-5" />
                Book an Appointment
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
              <Link href="/contact">
                <Phone className="h-5 w-5" />
                Talk to the clinic
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Faq />
    </>
  );
}
