import { cn } from "@/lib/cn";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-2xl flex-col px-5 pb-24 pt-12 sm:px-8 sm:pt-16",
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
        <h1 className="font-display text-[2rem] font-medium leading-[1.1] tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {titleAddon}
      </div>
      {description ? (
        <p
          className={cn(
            "mt-3 max-w-xl text-base leading-relaxed text-muted",
            align === "center" ? "mx-auto" : undefined,
          )}
        >
          {description}
        </p>
      ) : null}
    </header>
  );
}
