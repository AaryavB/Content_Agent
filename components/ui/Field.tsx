import { cn } from "@/lib/cn";

type FieldProps = {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
};

export function Field({ label, hint, children, className }: FieldProps) {
  return (
    <label className={cn("block space-y-2", className)}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint ? <span className="block text-sm text-muted">{hint}</span> : null}
    </label>
  );
}
