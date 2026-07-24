"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAppNavigation } from "@/components/AppNavigationProvider";
import { NavigationControls } from "@/components/ui/NavigationControls";
import { Button } from "@/components/ui/Button";
import { clearStoredUserId } from "@/lib/onboardingSession";

const AUTH_ROUTES = new Set(["/login", "/signup"]);

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { reset } = useAppNavigation();
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const isAuthRoute = AUTH_ROUTES.has(pathname);
  const showProfilesLink = isAuthenticated && !isAuthRoute && pathname !== "/";

  async function handleLogout(): Promise<void> {
    clearStoredUserId();
    await signOut();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-1.5">
            {!isAuthRoute ? <NavigationControls className="-ml-1.5" /> : null}
            <Link
              href={isAuthenticated ? "/" : "/login"}
              onClick={() => reset()}
              aria-label="Content Agent home"
              className="focus-ring group flex items-center gap-2 rounded-[8px] px-1.5 py-1"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-primary transition-transform duration-200 group-hover:scale-125"
                aria-hidden="true"
              />
              <span className="font-display text-[17px] font-medium tracking-tight text-foreground">
                Content Agent
              </span>
            </Link>
          </div>

          {isAuthenticated && !isAuthRoute ? (
            <nav
              aria-label="Main navigation"
              className="flex shrink-0 items-center gap-2"
            >
              {showProfilesLink ? (
                <Link
                  href="/"
                  onClick={() => reset()}
                  className="focus-ring rounded-full px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                >
                  Profiles
                </Link>
              ) : null}
              <Button variant="ghost" size="sm" onClick={() => void handleLogout()}>
                Log out
              </Button>
            </nav>
          ) : null}
        </div>
      </header>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
