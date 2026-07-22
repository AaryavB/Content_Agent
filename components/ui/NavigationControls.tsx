"use client";

import { useAppNavigation } from "@/components/AppNavigationProvider";
import { cn } from "@/lib/cn";

type NavigationControlsProps = {
  className?: string;
};

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d={direction === "left" ? "M10 12L6 8L10 4" : "M6 12L10 8L6 4"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NavigationControls({ className }: NavigationControlsProps) {
  const { goBack, goForward, canGoBack, canGoForward } = useAppNavigation();

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        onClick={goBack}
        disabled={!canGoBack}
        aria-label="Go back"
        className={cn(
          "focus-ring flex h-8 w-8 items-center justify-center rounded-[8px] text-muted transition-colors",
          canGoBack
            ? "hover:bg-surface-muted hover:text-foreground"
            : "cursor-not-allowed opacity-40",
        )}
      >
        <ArrowIcon direction="left" />
      </button>

      {canGoForward ? (
        <button
          type="button"
          onClick={goForward}
          aria-label="Go forward"
          className="focus-ring flex h-8 w-8 items-center justify-center rounded-[8px] text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <ArrowIcon direction="right" />
        </button>
      ) : null}
    </div>
  );
}
