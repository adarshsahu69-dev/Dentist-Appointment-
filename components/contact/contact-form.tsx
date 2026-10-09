"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { contactSchema, formatZodError } from "@/lib/validation";

const reasons = [
  "General question",
  "Appointment change",
  "Billing or insurance",
  "Emergency",
  "Feedback",
];

export function ContactForm({ clinics, defaultClinicId }: { clinics: { id: string; name: string }[]; defaultClinicId?: string }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const raw = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      clinic_id: String(form.get("clinic_id") ?? ""),
      reason: String(form.get("reason") ?? ""),
      message: String(form.get("message") ?? ""),
    };

    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) {
      setErrors(formatZodError(parsed.error));
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setErrors({});
    setPending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload.error ?? "Could not send your message.");
        return;
      }
      toast.success(payload.message ?? "Message received. The clinic will reply within one working day.");
      (event.target as HTMLFormElement).reset();
    } catch {
      toast.error("Could not send your message. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-xl border bg-white p-6 shadow-card" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" autoComplete="name" required />
          {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
          {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" name="phone" autoComplete="tel" />
          {errors.phone ? <p className="text-xs text-destructive">{errors.phone}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="clinic_id">Clinic</Label>
          <Select name="clinic_id" defaultValue={defaultClinicId ?? clinics[0]?.id}>
            <SelectTrigger id="clinic_id">
              <SelectValue placeholder="Select a clinic" />
            </SelectTrigger>
            <SelectContent>
              {clinics.map((clinic) => (
                <SelectItem key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.clinic_id ? <p className="text-xs text-destructive">{errors.clinic_id}</p> : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reason">Reason for contact</Label>
        <Select name="reason" defaultValue={reasons[0]}>
          <SelectTrigger id="reason">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {reasons.map((reason) => (
              <SelectItem key={reason} value={reason}>
                {reason}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" rows={5} required placeholder="How can we help?" />
        {errors.message ? <p className="text-xs text-destructive">{errors.message}</p> : null}
      </div>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
