import { cn } from "@/lib/utils";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border bg-white p-7 shadow-card">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description ? <p className="mt-1.5 text-sm text-muted-foreground">{description}</p> : null}
        <div className={cn("mt-6")}>{children}</div>
      </div>
      {footer ? <p className="mt-5 text-center text-sm text-muted-foreground">{footer}</p> : null}
    </div>
  );
}
