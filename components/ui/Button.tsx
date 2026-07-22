import { cn } from "@/lib/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

const variantStyles = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm disabled:bg-primary/40",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-surface-muted disabled:bg-surface-muted",
  ghost:
    "text-muted hover:bg-surface-muted hover:text-foreground disabled:text-subtle",
  danger:
    "border border-destructive/20 bg-destructive-subtle text-destructive-foreground hover:bg-destructive-subtle/80",
} as const;

const sizeStyles = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-[10px] font-medium transition-colors",
        "focus-ring disabled:cursor-not-allowed disabled:opacity-60",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}
