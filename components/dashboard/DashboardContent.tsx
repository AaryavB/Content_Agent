"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getStoredUserId } from "@/lib/onboardingSession";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function DashboardContent() {
  const router = useRouter();
  const generatePost = useAction(api.postActions.generatePost);

  const [storedUserId, setStoredUserId] = useState<string | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  const [topic, setTopic] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [postId, setPostId] = useState<Id<"posts"> | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  useEffect(() => {
    setStoredUserId(getStoredUserId());
    setHasCheckedSession(true);
  }, []);

  const user = useQuery(
    api.users.getUser,
    storedUserId ? { userId: storedUserId as Id<"users"> } : "skip",
  );
  const styleProfile = useQuery(
    api.users.getStyleProfile,
    storedUserId ? { userId: storedUserId as Id<"users"> } : "skip",
  );

  useEffect(() => {
    if (!hasCheckedSession) {
      return;
    }

    if (!storedUserId) {
      router.replace("/onboarding");
      return;
    }

    if (user === undefined || styleProfile === undefined) {
      return;
    }

    if (user === null || styleProfile === null) {
      router.replace("/onboarding");
    }
  }, [hasCheckedSession, storedUserId, user, styleProfile, router]);

  const isLoading =
    !hasCheckedSession ||
    !storedUserId ||
    user === undefined ||
    styleProfile === undefined;

  const canGenerate = topic.trim().length > 0 && !isGenerating;

  async function handleGenerate() {
    if (!storedUserId || !canGenerate) {
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generatePost({
        userId: storedUserId as Id<"users">,
        topic: topic.trim(),
        userInput: userInput.trim() || undefined,
        mode: "user-led",
      });

      setPostId(result.postId);
      setGeneratedContent(result.generatedContent);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <p className="text-sm text-zinc-500">Loading dashboard...</p>
      </div>
    );
  }

  if (!user || !styleProfile) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Generate a post
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Enter a topic and your take. The agent writes in your style.
            </p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700">Topic</span>
            <input
              type="text"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
              placeholder="e.g. Startup building"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700">
              Your take (optional)
            </span>
            <textarea
              value={userInput}
              onChange={(event) => setUserInput(event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
              placeholder="What's your angle or opinion on this topic?"
            />
          </label>

          <p className="text-sm text-zinc-500">
            The agent gets better after 5-6 finalized posts. Keep reviewing and
            editing.
          </p>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Generate"}
          </button>
        </div>
      </section>

      {generatedContent ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight">Your draft</h2>
          <p className="mt-1 text-sm text-zinc-600">Topic: {topic.trim()}</p>
          <div className="mt-4 whitespace-pre-wrap rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-800">
            {generatedContent}
          </div>
        </section>
      ) : null}
    </div>
  );
}
