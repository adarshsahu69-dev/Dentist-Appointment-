import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ReportCharts } from "@/components/admin/report-charts";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  const user = await data.getSessionUser();
  if (!user || user.role !== "admin") redirect("/unauthorized");

  const reports = await data.getReports();

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold">Reports</h1>
      <p className="mt-1 text-muted-foreground">Booking volume, outcomes and the most popular services across the clinic.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <RateCard label="Completion rate" value={reports.completionRate} tone="success" />
        <RateCard label="Cancellation rate" value={reports.cancellationRate} tone="warning" />
        <RateCard label="No-show rate" value={reports.noShowRate} tone="warning" />
      </div>

      <ReportCharts reports={reports} />
    </div>
  );
}

function RateCard({ label, value, tone }: { label: string; value: number; tone: "success" | "warning" }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-1 text-3xl font-bold ${tone === "success" ? "text-emerald-600" : "text-amber-600"}`}>{value}%</p>
      </CardContent>
    </Card>
  );
}
