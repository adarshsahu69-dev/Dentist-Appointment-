import { cn } from "@/lib/utils";
import { CalendarX2, FileQuestion, SearchX } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  icon = "empty",
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: "empty" | "search" | "calendar";
  className?: string;
}) {
  const Icon = icon === "search" ? SearchX : icon === "calendar" ? CalendarX2 : FileQuestion;
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed bg-accent/40 px-6 py-12 text-center", className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
