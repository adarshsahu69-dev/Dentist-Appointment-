import { redirect } from "next/navigation";
import { data } from "@/lib/data";
import { DashboardNav } from "@/components/layout/dashboard-nav";

export const dynamic = "force-dynamic";

export default async function DentistLayout({ children }: { children: React.ReactNode }) {
  const user = await data.getSessionUser();
  if (!user || user.role !== "dentist") redirect("/unauthorized");

  return (
    <>
      <DashboardNav
        homeHref="/"
        links={[
          { href: "/dentist/dashboard", label: "Overview" },
          { href: "/dentist/appointments", label: "Appointments" },
          { href: "/dentist/schedule", label: "Schedule" },
          { href: "/dentist/profile", label: "Profile" },
        ]}
      />
      {children}
    </>
  );
}
