"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface DashboardLink {
  href: string;
  label: string;
}

export function DashboardNav({ links, homeHref }: { links: DashboardLink[]; homeHref: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard sections" className="border-b bg-white">
      <div className="container flex flex-wrap items-center gap-1 py-2">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-accent text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={homeHref}>View site</Link>
          </Button>
          <form action="/api/auth/signout" method="post">
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </nav>
  );
}
