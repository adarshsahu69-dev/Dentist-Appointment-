import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Unauthorized" };

export default function UnauthorizedPage() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="h-7 w-7" />
      </span>
      <h1 className="mt-6 text-3xl font-bold">You don&apos;t have access to this area</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        This page is restricted to a specific role. If you believe this is a mistake, sign in with an account that has
        the right permissions or contact the clinic.
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/">Back to homepage</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Sign in as another user</Link>
        </Button>
      </div>
    </div>
  );
}
