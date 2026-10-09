import { redirect } from "next/navigation";
import { data } from "@/lib/data";
import { DashboardNav } from "@/components/layout/dashboard-nav";

export const dynamic = "force-dynamic";

export default async function PatientDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await data.getSessionUser();
  if (!user) redirect("/login?next=/dashboard");
  if (user.role !== "patient" && user.role !== "admin") redirect("/unauthorized");

  return (
    <>
      <DashboardNav
        homeHref="/"
        links={[
          { href: "/dashboard", label: "Overview" },
          { href: "/dashboard/appointments", label: "My appointments" },
          { href: "/dashboard/profile", label: "Profile" },
        ]}
      />
      {children}
    </>
  );
}
