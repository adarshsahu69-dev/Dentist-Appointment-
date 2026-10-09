"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { DAY_NAMES } from "@/lib/constants";

interface Row {
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
}

const emptyRow = (day: number): Row => ({
  day_of_week: day,
  start_time: "09:00",
  end_time: "17:00",
  break_start: "12:00",
  break_end: "13:00",
});

export function ScheduleEditor({ dentistId, availability }: { dentistId: string; availability: Row[] }) {
  const buildInitial = (): (Row | null)[] =>
    Array.from({ length: 7 }, (_, day) => {
      const rows = availability.filter((a) => a.day_of_week === day);
      if (rows.length === 0) return null;
      const first = rows[0];
      return {
        day_of_week: day,
        start_time: first.start_time,
        end_time: first.end_time,
        break_start: first.break_start,
        break_end: first.break_end,
      };
    });

  const [rows, setRows] = useState<(Row | null)[]>(buildInitial);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function update(day: number, patch: Partial<Row>) {
    setRows((current) => current.map((row, index) => (index === day ? { ...(row ?? emptyRow(day)), ...patch } : row)));
  }

  function toggle(day: number, enabled: boolean) {
    setRows((current) => current.map((row, index) => (index === day ? (enabled ? emptyRow(day) : null) : row)));
  }

  async function onSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/dentist/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dentist_id: dentistId, rows: rows.filter((r): r is Row => r !== null) }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload.error ?? "Could not save your availability.");
        return;
      }
      toast.success("Working hours updated.");
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  const active = rows.filter((r): r is Row => r !== null);

  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-3">
        {DAY_NAMES.map((day, index) => {
          const row = rows[index];
          const enabled = row !== null;
          return (
            <Card key={day} className={enabled ? "" : "opacity-70"}>
              <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
                <div className="flex w-40 items-center justify-between gap-3">
                  <span className="text-sm font-semibold">{day}</span>
                  <Switch checked={enabled} onCheckedChange={(v) => toggle(index, v)} aria-label={`Work on ${day}`} />
                </div>

                {enabled && row ? (
                  <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                      <Label htmlFor={`start-${index}`} className="text-xs">
                        Start
                      </Label>
                      <Input id={`start-${index}`} type="time" value={row.start_time} onChange={(e) => update(index, { start_time: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`end-${index}`} className="text-xs">
                        End
                      </Label>
                      <Input id={`end-${index}`} type="time" value={row.end_time} onChange={(e) => update(index, { end_time: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`break-start-${index}`} className="text-xs">
                        Break start
                      </Label>
                      <Input
                        id={`break-start-${index}`}
                        type="time"
                        value={row.break_start ?? ""}
                        onChange={(e) => update(index, { break_start: e.target.value || null })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`break-end-${index}`} className="text-xs">
                        Break end
                      </Label>
                      <Input
                        id={`break-end-${index}`}
                        type="time"
                        value={row.break_end ?? ""}
                        onChange={(e) => update(index, { break_end: e.target.value || null })}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="flex-1 text-sm text-muted-foreground">Not working</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : "Save working hours"}
      </Button>
      <p className="text-xs text-muted-foreground">
        {active.length} working day{active.length === 1 ? "" : "s"} configured. Patients only see slots inside these hours,
        and never during a break.
      </p>
    </div>
  );
}
