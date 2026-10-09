import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = { title: "Choose a new password" };

export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  return (
    <div className="container flex min-h-[calc(100vh-16rem)] items-center justify-center py-12">
      <AuthCard
        title="Choose a new password"
        description="Your new password must be at least 8 characters and include a number."
        footer={
          <>
            Need a new link?{" "}
            <Link href="/forgot-password" className="font-medium text-primary hover:underline">
              Request another reset link
            </Link>
          </>
        }
      >
        {searchParams.token ? (
          <ResetPasswordForm token={searchParams.token} />
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            This page needs a valid reset token. Use the link from your reset email.
          </p>
        )}
      </AuthCard>
    </div>
  );
}
