"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { AppointmentStatus } from "@/lib/types";

const labels: Record<string, string> = {
  confirmed: "Confirm appointment",
  completed: "Mark as completed",
  cancelled: "Reject / cancel",
  no_show: "Mark as no-show",
};

export function AppointmentActions({
  appointmentId,
  status,
  allowedTransitions,
}: {
  appointmentId: string;
  status: AppointmentStatus;
  allowedTransitions: string[];
}) {
  const [pending, setPending] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const router = useRouter();

  async function changeStatus(nextStatus: string) {
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
      toast.success(`Appointment marked as ${nextStatus}.`);
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setPending(false);
    }
  }

  async function saveNotes() {
    setPending(true);
    try {
      const res = await fetch("/api/appointments/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_id: appointmentId, patient_notes: notes }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload.error ?? "Could not save notes.");
        return;
      }
      toast.success("Notes saved.");
      setNotesOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allowedTransitions.map((next) => (
        <Button
          key={next}
          size="sm"
          variant={next === "cancelled" ? "destructive" : next === "confirmed" ? "default" : "outline"}
          disabled={pending}
          onClick={() => changeStatus(next)}
        >
          {labels[next] ?? next}
        </Button>
      ))}

      {status !== "cancelled" && status !== "completed" ? (
        <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost">
              Notes
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Appointment notes</DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Clinical / administrative notes</Label>
              <Textarea id="notes" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNotesOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveNotes} disabled={pending}>
                Save notes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
