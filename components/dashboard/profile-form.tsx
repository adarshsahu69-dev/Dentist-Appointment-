"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import type { SessionUser } from "@/lib/types";

export function ProfileForm({ user }: { user: SessionUser }) {
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: form.get("full_name"), phone: form.get("phone") }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload.error ?? "Could not update your profile.");
        if (payload.fieldErrors) {
          for (const [field, message] of Object.entries(payload.fieldErrors)) {
            toast.error(`${field}: ${message}`);
          }
        }
        return;
      }
      toast.success("Profile updated.");
      setSaved(true);
    } catch {
      toast.error("Network error — please try again.");
    }
  }

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 4000);
    return () => window.clearTimeout(timer);
  }, [saved]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base">Contact details</CardTitle>
        <CardDescription>Your email is used for sign-in and appointment notifications.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" defaultValue={user.full_name} autoComplete="name" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" name="phone" defaultValue={user.phone ?? ""} autoComplete="tel" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email (read-only)</Label>
            <Input id="email" value={user.email} readOnly disabled />
            <p className="text-xs text-muted-foreground">Contact the clinic to change the email on your account.</p>
          </div>

          {saved ? (
            <p className="rounded-lg border border-emerald-200 bg-accent px-3 py-2 text-sm text-emerald-900">Profile updated.</p>
          ) : null}

          <SubmitButton>Save changes</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
