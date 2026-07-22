import { cn } from "@/lib/cn";

type AlertVariant = "error" | "warning" | "success" | "info";

type AlertProps = {
  children: React.ReactNode;
  variant?: AlertVariant;
  className?: string;
};

const variantStyles: Record<AlertVariant, string> = {
  error: "border-destructive/20 bg-destructive-subtle text-destructive-foreground",
  warning: "border-warning/20 bg-warning-subtle text-warning",
  success: "border-success/20 bg-success-subtle text-success",
  info: "border-primary/20 bg-primary-subtle text-primary",
};

export function Alert({
  children,
  variant = "error",
  className,
}: AlertProps) {
  return (
    <p
      role="alert"
      className={cn(
        "rounded-[10px] border px-3 py-2.5 text-sm leading-relaxed",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </p>
  );
}
