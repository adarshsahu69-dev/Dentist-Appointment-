import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { isDemoMode } from "@/lib/config";
import { DEMO_ACCOUNTS } from "@/lib/demo/constants";

export const metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: { searchParams: { next?: string; reset?: string; error?: string } }) {
  return (
    <div className="container flex min-h-[calc(100vh-16rem)] items-center justify-center py-12">
      <AuthCard
        title="Welcome back"
        description="Sign in to manage your appointments, or use a sample account in demo mode."
        footer={
          <>
            New to DentalCare?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </>
        }
      >
        {searchParams.reset === "success" ? (
          <p className="mb-4 rounded-lg border border-emerald-200 bg-accent px-4 py-2 text-sm text-emerald-900">
            Your password has been updated. You can now sign in.
          </p>
        ) : null}
        {searchParams.error ? (
          <p role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {searchParams.error}
          </p>
        ) : null}
        <LoginForm next={searchParams.next} />
        {isDemoMode ? (
          <div className="mt-6 rounded-lg border bg-muted/50 p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-navy">Demo accounts (password: {DEMO_ACCOUNTS.patient.password})</p>
            <ul className="mt-2 space-y-1">
              <li>{DEMO_ACCOUNTS.patient.email} — patient dashboard</li>
              <li>{DEMO_ACCOUNTS.dentist.email} — dentist dashboard</li>
              <li>{DEMO_ACCOUNTS.admin.email} — admin panel</li>
            </ul>
          </div>
        ) : null}
      </AuthCard>
    </div>
  );
}
