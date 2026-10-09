"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarX2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import type { BlockedDate } from "@/lib/types";

export function BlockedDates({ blocked, dentistId }: { blocked: BlockedDate[]; dentistId: string }) {
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function onBlock(event: React.FormEvent) {
    event.preventDefault();
    if (!date) {
      toast.error("Choose a date to block.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/dentist/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dentist_id: dentistId, blocked_date: date, reason }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload.error ?? "Could not block this date.");
        return;
      }
      toast.success("Date blocked.");
      setDate("");
      setReason("");
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setPending(false);
    }
  }

  async function onUnblock(id: string) {
    setPending(true);
    try {
      const res = await fetch("/api/dentist/blocked-dates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked_date_id: id }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload.error ?? "Could not unblock this date.");
        return;
      }
      toast.success("Date unblocked.");
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 space-y-5">
      <form onSubmit={onBlock} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="blocked_date">Date</Label>
          <Input
            id="blocked_date"
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="reason">Reason (optional)</Label>
          <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Leave, conference, training…" />
        </div>
        <Button type="submit" disabled={pending}>
          <CalendarX2 className="h-4 w-4" />
          Block date
        </Button>
      </form>

      {blocked.length === 0 ? (
        <EmptyState icon="calendar" title="No blocked dates" description="Blocked dates are hidden from the booking calendar." />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blocked.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.blocked_date}</TableCell>
                  <TableCell className="text-muted-foreground">{item.reason ?? "Unavailable"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => onUnblock(item.id)}
                      aria-label={`Unblock ${item.blocked_date}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
