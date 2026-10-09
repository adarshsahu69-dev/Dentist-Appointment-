"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email") }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Could not send the reset link.");
        return;
      }
      setSent(true);
      setResetToken(payload.reset_token ?? null);
    } catch {
      setError("Network error — please try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {sent ? (
        <p className="rounded-lg border border-emerald-200 bg-accent px-3 py-2 text-sm text-emerald-900">
          If an account exists for that address, a password reset link is on its way. The link expires in 30 minutes.
        </p>
      ) : null}

      {sent && resetToken ? (
        <Link
          href={`/reset-password?token=${encodeURIComponent(resetToken)}`}
          className="block rounded-lg border bg-muted/50 px-3 py-2 text-sm text-primary hover:underline"
        >
          Open your demo reset link
        </Link>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="email" name="email" type="email" autoComplete="email" required className="pl-9" />
        </div>
      </div>

      <SubmitButton className="w-full">Send reset link</SubmitButton>
    </form>
  );
}
