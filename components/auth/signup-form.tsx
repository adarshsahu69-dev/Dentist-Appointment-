"use client";

import { useState } from "react";
import { Eye, EyeOff, Mail, Phone, User } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

export function SignupForm({ next }: { next?: string }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action="/api/auth/signup" method="post" className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />

      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="full_name" name="full_name" autoComplete="name" required className="pl-9" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="email" name="email" type="email" autoComplete="email" required className="pl-9" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone number</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="phone" name="phone" type="tel" autoComplete="tel" required className="pl-9" placeholder="+1 (206) 555-0000" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm_password">Confirm password</Label>
          <Input id="confirm_password" name="confirm_password" type={showPassword ? "text" : "password"} autoComplete="new-password" required />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        At least 8 characters, including an uppercase letter, a lowercase letter and a number.
      </p>

      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" name="consent" className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-ring" required />
        <span className="text-muted-foreground">
          I agree to the{" "}
          <a href="/privacy-policy" className="font-medium text-primary hover:underline">
            Privacy Policy
          </a>{" "}
          and consent to DentalCare storing my details to manage appointments.
        </span>
      </label>

      <SubmitButton className="w-full">Create account</SubmitButton>
    </form>
  );
}
