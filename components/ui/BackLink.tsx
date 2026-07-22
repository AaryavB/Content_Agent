import Link from "next/link";
import { cn } from "@/lib/cn";

type BackLinkProps = {
  href: string;
  label?: string;
  className?: string;
};

export function BackLink({ href, label = "Back", className }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "focus-ring inline-flex items-center gap-1.5 rounded-[8px] text-sm font-medium text-muted transition-colors hover:text-foreground",
        className,
      )}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M10 12L6 8L10 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </Link>
  );
}
