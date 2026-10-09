import { redirect } from "next/navigation";
import { data } from "@/lib/data";
import { DashboardNav } from "@/components/layout/dashboard-nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await data.getSessionUser();
  if (!user || user.role !== "admin") redirect("/unauthorized");

  return (
    <>
      <DashboardNav
        homeHref="/"
        links={[
          { href: "/admin/dashboard", label: "Overview" },
          { href: "/admin/appointments", label: "Appointments" },
          { href: "/admin/patients", label: "Patients" },
          { href: "/admin/dentists", label: "Dentists" },
          { href: "/admin/services", label: "Services" },
          { href: "/admin/clinics", label: "Clinics" },
          { href: "/admin/reports", label: "Reports" },
        ]}
      />
      {children}
    </>
  );
}
