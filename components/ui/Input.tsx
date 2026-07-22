import { cn } from "@/lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[12px] border border-border bg-surface px-3.5 text-sm text-foreground",
        "placeholder:text-subtle",
        "focus-ring transition-colors hover:border-subtle/60",
        "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted",
        className,
      )}
      {...props}
    />
  );
}
