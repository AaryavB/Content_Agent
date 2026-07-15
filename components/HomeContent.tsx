"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  clearStoredUserId,
  getStoredUserId,
  setStoredUserId,
} from "@/lib/onboardingSession";

function formatCreatedAt(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function HomeContent() {
  const router = useRouter();
  const profiles = useQuery(api.users.listUsers);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  useEffect(() => {
    setActiveUserId(getStoredUserId());
  }, []);

  function handleSelectProfile(
    userId: Id<"users">,
    hasStyleProfile: boolean,
  ): void {
    setStoredUserId(userId);
    setActiveUserId(userId);
    router.push(hasStyleProfile ? "/dashboard" : "/onboarding");
  }

  function handleCreateProfile(): void {
    clearStoredUserId();
    setActiveUserId(null);
    router.push("/onboarding");
  }

  const isLoading = profiles === undefined;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Content Agent</h1>
        <p className="mt-3 text-zinc-600">
          Select a profile to generate LinkedIn posts, or create a new one.
        </p>
      </div>

      <div className="mt-10 flex-1">
        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-sm text-zinc-500">Loading profiles...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
            <p className="text-sm text-zinc-600">No profiles yet.</p>
            <p className="mt-1 text-sm text-zinc-500">
              Create your first profile to start onboarding.
            </p>
            <button
              type="button"
              onClick={handleCreateProfile}
              className="mt-6 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Create profile
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-700">Your profiles</h2>
              <button
                type="button"
                onClick={handleCreateProfile}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Create new profile
              </button>
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
                      className={`w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:border-zinc-400 ${
                        isActive
                          ? "border-zinc-900 ring-1 ring-zinc-900"
                          : "border-zinc-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-zinc-900">
                            {profile.name}
                          </p>
                          <p className="mt-1 text-sm text-zinc-600">
                            {profile.role} at {profile.organization}
                          </p>
                          <p className="mt-2 text-xs text-zinc-500">
                            Created {formatCreatedAt(profile.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                            profile.hasStyleProfile
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {profile.hasStyleProfile ? "Ready" : "Continue setup"}
                        </span>
                      </div>
                      {isActive ? (
                        <p className="mt-3 text-xs text-zinc-500">
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
    </main>
  );
}
