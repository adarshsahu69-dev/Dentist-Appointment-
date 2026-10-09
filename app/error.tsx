"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-5xl font-extrabold text-destructive">Something went wrong</p>
      <h1 className="mt-4 text-2xl font-bold">We hit an unexpected problem</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The error has been logged. You can try again, or head back to the homepage and rebook your appointment.
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Back to homepage</Link>
        </Button>
      </div>
    </div>
  );
}
