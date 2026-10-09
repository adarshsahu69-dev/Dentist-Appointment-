import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "@/components/auth/signup-form";
import { data } from "@/lib/data";

export const metadata = { title: "Create your account" };

export const dynamic = "force-dynamic";

export default async function SignupPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  const user = await data.getSessionUser();
  if (user) redirect(user.role === "admin" ? "/admin/dashboard" : user.role === "dentist" ? "/dentist/dashboard" : "/dashboard");

  return (
    <div className="container flex min-h-[calc(100vh-16rem)] items-center justify-center py-12">
      <AuthCard
        title="Create your account"
        description="Book and manage appointments, and keep your details for next time."
        footer={
          <>
            Already registered?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </>
        }
      >
        {searchParams.error ? (
          <p role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {searchParams.error}
          </p>
        ) : null}
        <SignupForm next={searchParams.next} />
      </AuthCard>
    </div>
  );
}
