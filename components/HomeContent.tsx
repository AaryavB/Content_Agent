"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function HomeContent() {
  const searchParams = useSearchParams();
  const onboardingComplete = searchParams.get("onboarding") === "complete";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Content Agent</h1>
      <p className="mt-3 text-center text-zinc-600">
        AI Ghostwriter Agent for personalized LinkedIn posts.
      </p>

      {onboardingComplete ? (
        <div className="mt-6 w-full rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Onboarding complete. Your profile and writing style are saved and
          ready for post generation.
        </div>
      ) : null}

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        {onboardingComplete ? (
          <Link
            href="/dashboard"
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Generate posts
          </Link>
        ) : null}
        <Link
          href="/onboarding"
          className={`rounded-lg px-5 py-2.5 text-sm font-medium transition ${
            onboardingComplete
              ? "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
              : "bg-zinc-900 text-white hover:bg-zinc-800"
          }`}
        >
          {onboardingComplete ? "Review onboarding" : "Start onboarding"}
        </Link>
      </div>
    </main>
  );
}
