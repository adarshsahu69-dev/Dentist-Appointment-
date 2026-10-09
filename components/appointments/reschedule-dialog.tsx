"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarClock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import type { Availability, BlockedDate, Slot } from "@/lib/types";
import { formatTime12h } from "@/lib/availability";

export function RescheduleDialog({
  appointmentId,
  dentistId,
  serviceId,
}: {
  appointmentId: string;
  dentistId: string;
  serviceId: string;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [blocked, setBlocked] = useState<BlockedDate[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetch(`/api/dentists/${dentistId}/availability`).then((r) => r.json()),
      fetch(`/api/dentists/${dentistId}/blocked-dates`).then((r) => r.json()),
    ]).then(([avail, blockedDates]) => {
      setAvailability(avail.availability ?? []);
      setBlocked(blockedDates.blocked_dates ?? []);
    });
  }, [open, dentistId]);

  useEffect(() => {
    if (!date) {
      setSlots([]);
      return;
    }
    let active = true;
    setLoading(true);
    fetch(`/api/availability?dentistId=${dentistId}&serviceId=${serviceId}&date=${date}`)
      .then((r) => r.json())
      .then((payload) => {
        if (active) setSlots(payload.slots ?? []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [date, dentistId, serviceId]);

  const workingDays = new Set(availability.map((a) => a.day_of_week));
  const blockedSet = new Set(blocked.map((b) => b.blocked_date));

  async function onSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/appointments/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_id: appointmentId, appointment_date: date, start_time: time }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload.error ?? "Could not reschedule this appointment.");
        return;
      }
      toast.success("Appointment rescheduled.");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <CalendarClock className="h-4 w-4" />
          Reschedule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reschedule appointment</DialogTitle>
          <DialogDescription>Pick a new date and time. Your current slot is released when the change is saved.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-2">
            <DayPicker
              mode="single"
              selected={date ? new Date(`${date}T00:00:00`) : undefined}
              onSelect={(day) => {
                if (!day) return;
                const next = format(day, "yyyy-MM-dd");
                setDate(next);
                setTime("");
              }}
              disabled={(day) => {
                if (day < new Date(new Date().toDateString())) return true;
                if (!workingDays.has(day.getDay())) return true;
                return blockedSet.has(format(day, "yyyy-MM-dd"));
              }}
              fromDate={new Date()}
            />
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="reschedule-date">Date</Label>
              <Input id="reschedule-date" value={date} readOnly />
            </div>
            <div className="space-y-1.5">
              <Label>Available times</Label>
              {!date ? (
                <p className="text-xs text-muted-foreground">Select a date first.</p>
              ) : loading ? (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading…
                </p>
              ) : slots.length === 0 ? (
                <p className="text-xs text-muted-foreground">No availability on this date.</p>
              ) : (
                <div className="grid max-h-48 grid-cols-3 gap-1.5 overflow-y-auto">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setTime(slot.time)}
                      className={`rounded-md border px-1 py-1 text-[11px] font-medium transition-colors ${
                        slot.available ? "hover:border-primary hover:bg-accent" : "cursor-not-allowed bg-muted text-muted-foreground line-through"
                      } ${time === slot.time ? "border-primary bg-primary text-primary-foreground" : ""}`}
                    >
                      {formatTime12h(slot.time)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!date || !time || saving}>
            {saving ? "Saving…" : "Save new time"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
