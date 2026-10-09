import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-6xl font-extrabold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold">We couldn&apos;t find that page</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The page may have moved, or the link may be out of date. Try our services or dentists directory instead.
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/">Back to homepage</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/services">Browse services</Link>
        </Button>
      </div>
    </div>
  );
}
