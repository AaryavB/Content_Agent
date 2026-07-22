import { cn } from "@/lib/cn";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full rounded-[10px] border border-border bg-surface px-3 py-2.5 text-sm leading-relaxed text-foreground",
        "placeholder:text-subtle",
        "focus-ring transition-colors",
        "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted",
        className,
      )}
      {...props}
    />
  );
}
