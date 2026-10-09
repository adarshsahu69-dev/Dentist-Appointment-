"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export interface ServiceFormValues {
  id?: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number | null;
  is_active: boolean;
}

const empty: ServiceFormValues = {
  name: "",
  description: "",
  duration_minutes: 30,
  price: null,
  is_active: true,
};

export function ServiceFormDialog({ service, trigger }: { service?: ServiceFormValues; trigger: React.ReactNode }) {
  const isEdit = Boolean(service?.id);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [values, setValues] = useState<ServiceFormValues>(service ?? empty);
  const router = useRouter();

  useEffect(() => {
    if (open) setValues(service ?? empty);
  }, [open, service]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/admin/services", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, price: values.price === null ? null : Number(values.price) }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload.error ?? "Could not save this service.");
        return;
      }
      toast.success(isEdit ? "Service updated." : "Service created.");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit service" : "Add service"}</DialogTitle>
          <DialogDescription>
            Appointment duration controls the slot length used by the booking calendar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={values.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={values.description}
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={10}
                max={240}
                step={5}
                value={values.duration_minutes}
                onChange={(e) => setValues((v) => ({ ...v, duration_minutes: Number(e.target.value) }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (optional)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step={5}
                value={values.price ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, price: e.target.value === "" ? null : Number(e.target.value) }))}
                placeholder="Leave empty if quoted at consultation"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Switch checked={values.is_active} onCheckedChange={(v) => setValues((val) => ({ ...val, is_active: v }))} />
            Published (visible to patients)
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
