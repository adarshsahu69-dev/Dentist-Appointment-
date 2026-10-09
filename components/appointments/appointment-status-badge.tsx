import type { AppointmentStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const statusStyles: Record<AppointmentStatus, { label: string; className: string }> = {
  pending: { label: "Pending confirmation", className: "bg-amber-100 text-amber-800 border-amber-200" },
  confirmed: { label: "Confirmed", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  completed: { label: "Completed", className: "bg-slate-100 text-slate-700 border-slate-200" },
  cancelled: { label: "Cancelled", className: "bg-rose-100 text-rose-700 border-rose-200" },
  no_show: { label: "No-show", className: "bg-orange-100 text-orange-800 border-orange-200" },
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const config = statusStyles[status];
  return (
    <Badge variant="outline" className={`${config.className} font-medium`}>
      {config.label}
    </Badge>
  );
}
