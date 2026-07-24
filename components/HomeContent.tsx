"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAppNavigation } from "@/components/AppNavigationProvider";
import {
  clearStoredUserId,
  getStoredUserId,
  setStoredUserId,
} from "@/lib/onboardingSession";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { cn } from "@/lib/cn";

function formatCreatedAt(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function HomeContent() {
  const { push } = useAppNavigation();
  const profiles = useQuery(api.profiles.listProfiles);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  useEffect(() => {
    setActiveUserId(getStoredUserId());
  }, []);

  function handleSelectProfile(
    userId: Id<"profiles">,
    hasStyleProfile: boolean,
  ): void {
    setStoredUserId(userId);
    setActiveUserId(userId);
    if (hasStyleProfile) {
      push({ kind: "route", href: "/dashboard" });
    } else {
      push({ kind: "route", href: "/onboarding" });
    }
  }

  function handleCreateProfile(): void {
    clearStoredUserId();
    setActiveUserId(null);
    push({ kind: "onboarding-step", step: 1 });
  }

  const isLoading = profiles === undefined;

  return (
    <PageShell>
      <PageHeader
        align="center"
        title="Your profiles"
        description="Select a profile to generate LinkedIn posts, or create a new one."
      />

      <div className="mt-10 flex-1">
        {isLoading ? (
          <LoadingState message="Loading profiles..." />
        ) : profiles.length === 0 ? (
          <EmptyState
            title="No profiles yet"
            description="Create your first profile to start onboarding."
            actionLabel="Create profile"
            onAction={handleCreateProfile}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-medium text-muted">
                {profiles.length} profile{profiles.length === 1 ? "" : "s"}
              </h2>
              <Button variant="secondary" size="sm" onClick={handleCreateProfile}>
                Create new profile
              </Button>
            </div>

            <ul className="space-y-3">
              {profiles.map((profile) => {
                const isActive = activeUserId === profile.userId;

                return (
                  <li key={profile.userId}>
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectProfile(
                          profile.userId,
                          profile.hasStyleProfile,
                        )
                      }
                      className={cn(
                        "focus-ring w-full rounded-[14px] border bg-surface p-5 text-left shadow-sm transition-all",
                        "hover:border-border hover:shadow-md",
                        isActive
                          ? "border-primary/40 ring-1 ring-primary/20"
                          : "border-border",
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1">
                          <p className="font-semibold text-foreground">
                            {profile.name}
                          </p>
                          <p className="text-sm text-muted">
                            {profile.role} at {profile.organization}
                          </p>
                          <p className="text-xs text-subtle">
                            Created {formatCreatedAt(profile.createdAt)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            profile.hasStyleProfile ? "success" : "warning"
                          }
                        >
                          {profile.hasStyleProfile ? "Ready" : "Continue setup"}
                        </Badge>
                      </div>
                      {isActive ? (
                        <p className="mt-3 text-xs text-primary">
                          Last selected profile
                        </p>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </PageShell>
  );
}
