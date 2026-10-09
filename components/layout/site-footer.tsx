import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { data } from "@/lib/data";

export async function SiteFooter() {
  const clinics = await data.listClinics();
  const primary = clinics[0];

  return (
    <footer className="mt-16 border-t bg-navy text-slate-200">
      <div className="container grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5.5c-1.5-1.5-3.5-2-5-2C4.5 3.5 3 5.5 3 8.5c0 3 .8 4.6 1.5 7.3.5 2 .8 4.2 1.7 4.2 1.2 0 1.3-2.3 1.8-4.6.3-1.4.6-2.4 2-2.4s1.7 1 2 2.4c.5 2.3.6 4.6 1.8 4.6.9 0 1.2-2.2 1.7-4.2.7-2.7 1.5-4.3 1.5-7.3 0-3-1.5-5-4-5-1.5 0-3.5.5-5 2Z" />
              </svg>
            </span>
            <span className="text-lg font-bold text-white">
              Dental<span className="text-teal-300">Care</span>
            </span>
          </div>
          <p className="mt-4 text-sm text-slate-300">
            Modern, gentle dental care for the whole family. Book online in under two minutes and manage every
            appointment from your dashboard.
          </p>
          <div className="mt-5 flex gap-3" aria-label="Social links">
            {["Twitter", "Facebook", "Instagram"].map((label) => (
              <span
                key={label}
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-slate-200"
                title={`${label} (demo link)`}
              >
                {label.slice(0, 2)}
              </span>
            ))}
          </div>
        </div>

        <nav aria-label="Services">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Services</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              ["Teeth Cleaning", "/services"],
              ["Dental Checkups", "/services"],
              ["Teeth Whitening", "/services"],
              ["Braces & Orthodontics", "/services"],
              ["Root Canal Treatment", "/services"],
              ["Emergency Dental Care", "/services"],
            ].map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="text-slate-300 transition-colors hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Clinic">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Clinic</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              ["Our dentists", "/dentists"],
              ["Locations", "/clinics"],
              ["About us", "/about"],
              ["Contact", "/contact"],
              ["Book an appointment", "/book-appointment"],
              ["Patient dashboard", "/dashboard"],
            ].map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="text-slate-300 transition-colors hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {primary ? (
              <>
                <li className="flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
                  <span>
                    {primary.address}, {primary.city}, {primary.state} {primary.postal_code}
                  </span>
                </li>
                <li className="flex gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-teal-300" />
                  <a href={`tel:${primary.phone.replace(/[^\d+]/g, "")}`} className="hover:text-white">
                    {primary.phone}
                  </a>
                </li>
                <li className="flex gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-teal-300" />
                  <a href="mailto:care@dentalcare.example" className="hover:text-white">
                    care@dentalcare.example
                  </a>
                </li>
                <li className="flex gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-teal-300" />
                  <span>{primary.opening_hours}</span>
                </li>
              </>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-slate-400 md:flex-row">
          <p>© {new Date().getFullYear()} DentalCare. All rights reserved.</p>
          <nav aria-label="Policies" className="flex flex-wrap gap-4">
            <Link href="/privacy-policy" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-white">
              Support
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
