import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "success" | "warning" | "primary";

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-muted text-muted",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  primary: "bg-primary-subtle text-primary",
};

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
