"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppNavigation } from "@/components/AppNavigationProvider";
import { NavigationControls } from "@/components/ui/NavigationControls";
import { cn } from "@/lib/cn";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { reset } = useAppNavigation();
  const showProfilesLink = pathname !== "/";

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-border bg-surface px-4 py-6">
        <Link
          href="/"
          onClick={() => reset()}
          className="focus-ring flex items-center gap-2 rounded-[8px] px-2 py-1.5 text-sm font-semibold text-foreground"
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-primary"
            aria-hidden="true"
          />
          Content Agent
        </Link>

        <NavigationControls className="mt-6" />

        {showProfilesLink ? (
          <nav aria-label="Main navigation" className="mt-6">
            <ul className="space-y-1">
              <li>
                <Link
                  href="/"
                  onClick={() => reset()}
                  className={cn(
                    "focus-ring block rounded-[8px] px-3 py-2 text-sm font-medium transition-colors",
                    "text-muted hover:bg-surface-muted hover:text-foreground",
                  )}
                >
                  Profiles
                </Link>
              </li>
            </ul>
          </nav>
        ) : null}
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
