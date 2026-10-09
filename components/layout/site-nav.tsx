"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, CalendarCheck, LayoutDashboard, LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/types";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/dentists", label: "Our Dentists" },
  { href: "/clinics", label: "Clinics" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function dashboardHref(user: SessionUser | null): string {
  if (user?.role === "admin") return "/admin/dashboard";
  if (user?.role === "dentist") return "/dentist/dashboard";
  return "/dashboard";
}

export function SiteNav({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2" aria-label="DentalCare home">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5.5c-1.5-1.5-3.5-2-5-2C4.5 3.5 3 5.5 3 8.5c0 3 .8 4.6 1.5 7.3.5 2 .8 4.2 1.7 4.2 1.2 0 1.3-2.3 1.8-4.6.3-1.4.6-2.4 2-2.4s1.7 1 2 2.4c.5 2.3.6 4.6 1.8 4.6.9 0 1.2-2.2 1.7-4.2.7-2.7 1.5-4.3 1.5-7.3 0-3-1.5-5-4-5-1.5 0-3.5.5-5 2Z" />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight text-navy">
            Dental<span className="text-primary">Care</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                isActive(link.href) ? "text-primary" : "text-muted-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href={dashboardHref(user)}>
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <form action="/api/auth/signout" method="post">
                <Button variant="outline" size="sm" type="submit">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/book-appointment">
                  <CalendarCheck className="h-4 w-4" />
                  Book an Appointment
                </Link>
              </Button>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open ? (
        <div id="mobile-menu" className="border-t bg-background lg:hidden">
          <nav className="container flex flex-col gap-1 py-4" aria-label="Mobile">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary",
                  isActive(link.href) ? "bg-secondary text-primary" : "text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              {user ? (
                <>
                  <Button asChild variant="outline" onClick={() => setOpen(false)}>
                    <Link href={dashboardHref(user)}>
                      <UserCircle className="h-4 w-4" />
                      {user.full_name.split(" ")[0]} · Dashboard
                    </Link>
                  </Button>
                  <form action="/api/auth/signout" method="post">
                    <Button variant="ghost" className="w-full" type="submit">
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" onClick={() => setOpen(false)}>
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button asChild onClick={() => setOpen(false)}>
                    <Link href="/book-appointment">Book an Appointment</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
