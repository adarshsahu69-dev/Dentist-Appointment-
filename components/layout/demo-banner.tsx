import Link from "next/link";
import { isDemoMode } from "@/lib/config";

export function DemoBanner() {
  if (!isDemoMode) return null;
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900">
      Demo mode — data is stored in memory and resets on restart.{" "}
      <Link href="/login" className="underline underline-offset-2">
        Sign in with the sample accounts
      </Link>{" "}
      or configure Supabase to go live.
    </div>
  );
}
