import { cn } from "@/lib/utils";

/**
 * Sample dentist imagery. Demo mode shows initials; replace this component
 * with real clinic photography (e.g. next/image from /public/dentists).
 */
export function DentistPhoto({ name, className }: { name: string; className?: string }) {
  const initials = name
    .replace("Dr. ", "")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br from-soft-blue to-mint", className)} role="img" aria-label={`Portrait placeholder for ${name}`}>
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-4xl font-bold text-primary/70">{initials}</span>
      </div>
    </div>
  );
}
