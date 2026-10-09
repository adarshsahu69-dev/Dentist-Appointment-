import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { isDemoMode } from "@/lib/config";

export const metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <div className="container flex min-h-[calc(100vh-16rem)] items-center justify-center py-12">
      <AuthCard
        title="Forgot your password?"
        description="Enter the email address you registered with and we'll send a secure reset link."
        footer={
          <>
            Remembered it?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Back to sign in
            </Link>
          </>
        }
      >
        <ForgotPasswordForm />
        {isDemoMode ? (
          <p className="mt-4 text-xs text-muted-foreground">Demo mode: the reset link is displayed on screen instead of being emailed.</p>
        ) : null}
      </AuthCard>
    </div>
  );
}
