import { cn } from "@/lib/cn";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full rounded-[12px] border border-border bg-surface px-3.5 py-3 text-sm leading-relaxed text-foreground",
        "placeholder:text-subtle",
        "focus-ring resize-y transition-colors hover:border-subtle/60",
        "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted",
        className,
      )}
      {...props}
    />
  );
}
