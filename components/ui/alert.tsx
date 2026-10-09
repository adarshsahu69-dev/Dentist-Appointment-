import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground [&>svg]:text-foreground",
        info: "border-soft-blue bg-soft-blue/40 text-navy [&>svg]:text-primary",
        success: "border-emerald-200 bg-accent text-emerald-900 [&>svg]:text-emerald-600",
        warning: "border-amber-200 bg-amber-50 text-amber-900 [&>svg]:text-amber-600",
        destructive: "border-destructive/30 bg-destructive/10 text-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

const icons = { default: Info, info: Info, success: CheckCircle2, warning: TriangleAlert, destructive: AlertCircle };

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  icon?: React.ReactNode;
}

function Alert({ className, variant = "default", icon, children, ...props }: AlertProps) {
  const Icon = icons[variant ?? "default"];
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      {icon ?? <Icon className="h-4 w-4" />}
      <div className="text-sm [&_p]:leading-relaxed">{children}</div>
    </div>
  );
}

export { Alert };
