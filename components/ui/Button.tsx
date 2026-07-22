import { cn } from "@/lib/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

const variantStyles = {
  primary:
    "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover active:translate-y-px disabled:bg-primary/40 disabled:shadow-none",
  secondary:
    "border border-border bg-surface text-foreground hover:border-border hover:bg-surface-muted active:translate-y-px disabled:bg-surface-muted",
  ghost:
    "text-muted hover:bg-surface-muted hover:text-foreground disabled:text-subtle",
  danger:
    "border border-destructive/20 bg-destructive-subtle text-destructive-foreground hover:bg-destructive-subtle/70 active:translate-y-px",
} as const;

const sizeStyles = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
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
        "inline-flex items-center justify-center rounded-[12px] font-medium transition-all duration-150",
        "focus-ring disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-y-0",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}
