import { cn } from "@/lib/cn";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <main
      className={cn(
        "mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-10 sm:px-8",
        className,
      )}
    >
      {children}
    </main>
  );
}

type PageHeaderProps = {
  title: string;
  description?: string;
  titleAddon?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
};

export function PageHeader({
  title,
  description,
  titleAddon,
  align = "left",
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3",
          align === "center" ? "justify-center" : "justify-between",
          titleAddon ? "flex-wrap" : undefined,
        )}
      >
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {titleAddon}
      </div>
      {description ? (
        <p className="mt-2 text-base leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
    </header>
  );
}
