import { cn } from "@/lib/cn";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  padding?: "md" | "lg";
};

const paddingStyles = {
  md: "p-6",
  lg: "p-6 sm:p-8",
} as const;

export function Card({ children, className, padding = "lg" }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-border bg-surface shadow-sm",
        paddingStyles[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

type CardHeaderProps = {
  title: string;
  description?: React.ReactNode;
  className?: string;
};

export function CardHeader({ title, description, className }: CardHeaderProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="text-sm leading-relaxed text-muted">{description}</p>
      ) : null}
    </div>
  );
}
