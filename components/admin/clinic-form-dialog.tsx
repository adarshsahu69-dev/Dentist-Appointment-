"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export interface ClinicFormValues {
  id?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  opening_hours: string;
}

const empty: ClinicFormValues = {
  name: "",
  address: "",
  city: "",
  state: "",
  postal_code: "",
  latitude: null,
  longitude: null,
  phone: "",
  opening_hours: "",
};

export function ClinicFormDialog({ clinic, trigger }: { clinic?: ClinicFormValues; trigger: React.ReactNode }) {
  const isEdit = Boolean(clinic?.id);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [values, setValues] = useState<ClinicFormValues>(clinic ?? empty);
  const router = useRouter();

  useEffect(() => {
    if (open) setValues(clinic ?? empty);
  }, [open, clinic]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/admin/clinics", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          latitude: values.latitude === null ? null : Number(values.latitude),
          longitude: values.longitude === null ? null : Number(values.longitude),
          ...(isEdit ? { id: clinic!.id } : {}),
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload.error ?? "Could not save this clinic.");
        return;
      }
      toast.success(isEdit ? "Clinic updated." : "Clinic added.");
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
          <DialogTitle>{isEdit ? "Edit clinic" : "Add clinic"}</DialogTitle>
          <DialogDescription>Coordinates power the Google Maps integration and directions links.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Clinic name</Label>
            <Input id="name" value={values.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Street address</Label>
            <Input id="address" value={values.address} onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={values.city} onChange={(e) => setValues((v) => ({ ...v, city: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" value={values.state} onChange={(e) => setValues((v) => ({ ...v, state: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="postal">Postal code</Label>
              <Input id="postal" value={values.postal_code} onChange={(e) => setValues((v) => ({ ...v, postal_code: e.target.value }))} required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                value={values.latitude ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, latitude: e.target.value === "" ? null : Number(e.target.value) }))}
                placeholder="47.6021"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                type="number"
                step="any"
                value={values.longitude ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, longitude: e.target.value === "" ? null : Number(e.target.value) }))}
                placeholder="-122.3363"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={values.phone} onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hours">Opening hours</Label>
              <Input
                id="hours"
                value={values.opening_hours}
                onChange={(e) => setValues((v) => ({ ...v, opening_hours: e.target.value }))}
                placeholder="Mon–Fri 9:00 AM – 6:00 PM"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add clinic"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
