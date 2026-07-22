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
        "rounded-[18px] border border-border/80 bg-surface shadow-md",
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
    <div className={cn("space-y-1.5", className)}>
      <h2 className="font-display text-xl font-medium tracking-tight text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="text-sm leading-relaxed text-muted">{description}</p>
      ) : null}
    </div>
  );
}
