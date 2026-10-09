"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface DentistFormValues {
  id?: string;
  full_name: string;
  email: string;
  specialization: string;
  qualifications: string;
  experience_years: number;
  biography: string;
  clinic_id: string;
  is_active: boolean;
  service_ids: string[];
}

const empty: DentistFormValues = {
  full_name: "",
  email: "",
  specialization: "",
  qualifications: "",
  experience_years: 1,
  biography: "",
  clinic_id: "",
  is_active: true,
  service_ids: [],
};

export function DentistFormDialog({
  clinics,
  services,
  dentist,
  trigger,
}: {
  clinics: { id: string; name: string }[];
  services: { id: string; name: string }[];
  dentist?: DentistFormValues;
  trigger: React.ReactNode;
}) {
  const isEdit = Boolean(dentist?.id);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [values, setValues] = useState<DentistFormValues>(dentist ?? empty);
  const router = useRouter();

  useEffect(() => {
    if (open) setValues(dentist ?? { ...empty, clinic_id: clinics[0]?.id ?? "" });
  }, [open, dentist, clinics]);

  function toggleService(serviceId: string) {
    setValues((v) => ({
      ...v,
      service_ids: v.service_ids.includes(serviceId)
        ? v.service_ids.filter((s) => s !== serviceId)
        : [...v.service_ids, serviceId],
    }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/admin/dentists", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? { ...values, id: dentist!.id }
            : { ...values, password: "Password123" /* initial password, changed at first login */ },
        ),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload.error ?? "Could not save this dentist.");
        return;
      }
      toast.success(isEdit ? "Dentist updated." : "Dentist added.");
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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit dentist" : "Add dentist"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the clinician's profile, clinic assignment and services."
              : "The new dentist receives an account with a temporary password they should change at first sign-in."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={values.full_name}
                onChange={(e) => setValues((v) => ({ ...v, full_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={values.specialization}
                onChange={(e) => setValues((v) => ({ ...v, specialization: e.target.value }))}
                placeholder="General & Family Dentistry"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="experience">Years of experience</Label>
              <Input
                id="experience"
                type="number"
                min={0}
                max={60}
                value={values.experience_years}
                onChange={(e) => setValues((v) => ({ ...v, experience_years: Number(e.target.value) }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clinic">Clinic</Label>
              <Select value={values.clinic_id} onValueChange={(v) => setValues((val) => ({ ...val, clinic_id: v }))}>
                <SelectTrigger id="clinic">
                  <SelectValue placeholder="Select clinic" />
                </SelectTrigger>
                <SelectContent>
                  {clinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qualifications">Qualifications</Label>
              <Input
                id="qualifications"
                value={values.qualifications}
                onChange={(e) => setValues((v) => ({ ...v, qualifications: e.target.value }))}
                placeholder="DDS, University X"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="biography">Biography</Label>
            <Textarea
              id="biography"
              rows={3}
              value={values.biography}
              onChange={(e) => setValues((v) => ({ ...v, biography: e.target.value }))}
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Services offered</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {services.map((service) => (
                <label key={service.id} className="flex items-center gap-2 rounded-lg border p-2 text-sm">
                  <input
                    type="checkbox"
                    checked={values.service_ids.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  />
                  {service.name}
                </label>
              ))}
            </div>
          </fieldset>

          {isEdit ? (
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={values.is_active} onCheckedChange={(v) => setValues((val) => ({ ...val, is_active: v }))} />
              Account active (can receive bookings)
            </label>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add dentist"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
