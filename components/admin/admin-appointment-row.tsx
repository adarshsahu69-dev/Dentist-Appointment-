"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { formatTime12h } from "@/lib/availability";

const statusLabels: Record<string, string> = {
  confirmed: "Confirm",
  completed: "Complete",
  cancelled: "Cancel",
  no_show: "No-show",
};

export function AdminAppointmentRow({
  appointmentId,
  reference,
  patient,
  dentist,
  service,
  date,
  time,
  status,
  canCancel,
  transitions,
}: {
  appointmentId: string;
  reference: string;
  patient: string;
  dentist: string;
  service: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  canCancel: boolean;
  transitions: string[];
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function change(nextStatus: string) {
    setPending(true);
    try {
      const res = await fetch("/api/appointments/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_id: appointmentId, status: nextStatus }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload.error ?? "Could not update this appointment.");
        return;
      }
      toast.success(`Appointment ${reference} updated.`);
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <tr className="border-t">
      <td className="px-4 py-3 font-medium">{reference}</td>
      <td className="px-4 py-3">{patient}</td>
      <td className="px-4 py-3">{dentist}</td>
      <td className="px-4 py-3">{service}</td>
      <td className="px-4 py-3">
        {date}
        <span className="block text-xs text-muted-foreground">{formatTime12h(time)}</span>
      </td>
      <td className="px-4 py-3">
        <AppointmentStatusBadge status={status} />
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          {transitions.map((next) => (
            <Button
              key={next}
              size="sm"
              variant={next === "cancelled" ? "destructive" : "outline"}
              disabled={pending || (next === "cancelled" && !canCancel)}
              onClick={() => change(next)}
            >
              {statusLabels[next] ?? next}
            </Button>
          ))}
        </div>
      </td>
    </tr>
  );
}
