"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getStoredUserId } from "@/lib/onboardingSession";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function pickRandomTopic(topics: string[]): string {
  return topics[Math.floor(Math.random() * topics.length)];
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function previewContent(content: string, maxChars = 100): string {
  const trimmed = content.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxChars)}...`;
}

type DraftStatus = "draft" | "finalized";

export function DashboardContent() {
  const router = useRouter();
  const generatePost = useAction(api.postActions.generatePost);
  const regeneratePostAction = useAction(api.postActions.regeneratePostAction);
  const finalizePostAction = useAction(api.postActions.finalizePostAction);
  const rejectPost = useMutation(api.posts.rejectPost);

  const [storedUserId, setStoredUserId] = useState<string | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  const [topic, setTopic] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [postId, setPostId] = useState<Id<"posts"> | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [regenerateNote, setRegenerateNote] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState("");
  const [editedContent, setEditedContent] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("draft");
  const [finalContent, setFinalContent] = useState<string | null>(null);
  const [profileUpdateWarning, setProfileUpdateWarning] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedRepoIds, setExpandedRepoIds] = useState<Set<string>>(
    () => new Set(),
  );

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
  const finalizedPosts = useQuery(
    api.posts.getFinalizedPosts,
    storedUserId ? { userId: storedUserId as Id<"users"> } : "skip",
  );

  useEffect(() => {
    if (!hasCheckedSession) {
      return;
    }

    if (!storedUserId) {
      router.replace("/");
      return;
    }

    if (user === undefined || styleProfile === undefined) {
      return;
    }

    if (user === null || styleProfile === null) {
      router.replace("/");
    }
  }, [hasCheckedSession, storedUserId, user, styleProfile, router]);

  const isLoading =
    !hasCheckedSession ||
    !storedUserId ||
    user === undefined ||
    styleProfile === undefined;

  const canGenerate = topic.trim().length > 0 && !isBusy;
  const canSurpriseMe =
    user !== undefined && user !== null && user.topics.length > 0 && !isBusy;
  const isDraft = draftStatus === "draft";
  const canRegenerate = postId !== null && !isBusy && isDraft;
  const canReject = postId !== null && !isBusy && isDraft;
  const canEdit = postId !== null && !isBusy && isDraft;
  const canFinalize = postId !== null && !isBusy && isDraft;

  function resetDraftState() {
    setPostId(null);
    setGeneratedContent(null);
    setRegenerateNote("");
    setIsEditing(false);
    setEditDraft("");
    setEditedContent(null);
    setDraftStatus("draft");
    setFinalContent(null);
    setProfileUpdateWarning(false);
  }

  function resetDraftForNewGeneration() {
    setIsEditing(false);
    setEditDraft("");
    setEditedContent(null);
    setDraftStatus("draft");
    setFinalContent(null);
    setProfileUpdateWarning(false);
  }

  function getDisplayContent(): string {
    return editedContent ?? generatedContent ?? "";
  }

  async function handleGenerate() {
    if (!storedUserId || !canGenerate) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      const result = await generatePost({
        userId: storedUserId as Id<"users">,
        topic: topic.trim(),
        userInput: userInput.trim() || undefined,
        mode: "user-led",
      });

      resetDraftForNewGeneration();
      setPostId(result.postId);
      setGeneratedContent(result.generatedContent);
      setRegenerateNote("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSurpriseMe() {
    if (!storedUserId || !user || !canSurpriseMe) {
      return;
    }

    const randomTopic = pickRandomTopic(user.topics);

    setIsBusy(true);
    setError(null);

    try {
      const result = await generatePost({
        userId: storedUserId as Id<"users">,
        topic: randomTopic,
        mode: "surprise-me",
      });

      resetDraftForNewGeneration();
      setTopic(randomTopic);
      setUserInput("");
      setPostId(result.postId);
      setGeneratedContent(result.generatedContent);
      setRegenerateNote("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRegenerate() {
    if (!postId || !canRegenerate) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      const result = await regeneratePostAction({
        postId,
        regenerateNote: regenerateNote.trim() || undefined,
      });

      setGeneratedContent(result.generatedContent);
      setEditedContent(null);
      setIsEditing(false);
      setEditDraft("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleReject() {
    if (!postId || !canReject) {
      return;
    }

    const confirmed = window.confirm(
      "Reject this post? It will be saved but won't affect your style profile.",
    );
    if (!confirmed) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await rejectPost({ postId });
      resetDraftState();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  function handleStartEdit() {
    if (!canEdit) {
      return;
    }

    setEditDraft(getDisplayContent());
    setIsEditing(true);
  }

  function handleSaveEdits() {
    setEditedContent(editDraft.trim());
    setIsEditing(false);
  }

  function handleCancelEdit() {
    setEditDraft(getDisplayContent());
    setIsEditing(false);
  }

  async function handleFinalize() {
    if (!postId || !canFinalize) {
      return;
    }

    const contentToFinalize = (editedContent ?? generatedContent ?? "").trim();
    if (!contentToFinalize) {
      return;
    }

    setIsBusy(true);
    setError(null);
    setProfileUpdateWarning(false);

    try {
      const result = await finalizePostAction({
        postId,
        finalContent: contentToFinalize,
      });

      setDraftStatus("finalized");
      setFinalContent(contentToFinalize);
      setIsEditing(false);
      setProfileUpdateWarning(result.profileUpdateFailed);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCopy(text: string, copyId: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(copyId);
      setTimeout(() => {
        setCopiedId((current) => (current === copyId ? null : current));
      }, 2000);
    } catch {
      setError("Copy failed, please select and copy manually.");
    }
  }

  function toggleRepoExpand(postIdToToggle: string) {
    setExpandedRepoIds((current) => {
      const next = new Set(current);
      if (next.has(postIdToToggle)) {
        next.delete(postIdToToggle);
      } else {
        next.add(postIdToToggle);
      }
      return next;
    });
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
              disabled={isBusy}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-zinc-50"
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
              disabled={isBusy}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-zinc-50"
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

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBusy && isDraft ? "Generating..." : "Generate"}
            </button>
            <button
              type="button"
              onClick={handleSurpriseMe}
              disabled={!canSurpriseMe}
              className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Surprise Me
            </button>
          </div>
        </div>
      </section>

      {generatedContent ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight">
            {draftStatus === "finalized" ? "Finalized post" : "Your draft"}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">Topic: {topic.trim()}</p>

          {draftStatus === "finalized" ? (
            <p className="mt-2 text-sm font-medium text-green-700">
              Post finalized
            </p>
          ) : null}

          {profileUpdateWarning ? (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Post finalized, but style profile couldn&apos;t be updated. Future
              posts may not reflect your latest edits.
            </p>
          ) : null}

          {isEditing ? (
            <textarea
              value={editDraft}
              onChange={(event) => setEditDraft(event.target.value)}
              rows={12}
              disabled={isBusy}
              className="mt-4 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm leading-relaxed text-zinc-800 outline-none ring-zinc-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-zinc-50"
            />
          ) : (
            <div className="mt-4 whitespace-pre-wrap rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-800">
              {draftStatus === "finalized"
                ? (finalContent ?? getDisplayContent())
                : getDisplayContent()}
            </div>
          )}

          {draftStatus === "finalized" && finalContent ? (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => handleCopy(finalContent, "draft-card")}
                className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                {copiedId === "draft-card" ? "Copied!" : "Copy"}
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {isEditing ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSaveEdits}
                    disabled={isBusy || !editDraft.trim()}
                    className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save Edits
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isBusy}
                    className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    disabled={!canEdit}
                    className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalize}
                    disabled={!canFinalize}
                    className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isBusy ? "Finalizing and learning..." : "Finalize"}
                  </button>
                </div>
              )}

              {!isEditing ? (
                <>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-zinc-700">
                      Regenerate with guidance (optional)
                    </span>
                    <input
                      type="text"
                      value={regenerateNote}
                      onChange={(event) => setRegenerateNote(event.target.value)}
                      disabled={isBusy}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-zinc-50"
                      placeholder="e.g. make it more punchy"
                    />
                  </label>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      disabled={!canRegenerate}
                      className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isBusy ? "Regenerating..." : "Regenerate"}
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={!canReject}
                      className="rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight">My Posts</h2>

        {finalizedPosts === undefined ? (
          <p className="mt-4 text-sm text-zinc-500">Loading posts...</p>
        ) : finalizedPosts.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            No posts yet. Generate your first post above.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {finalizedPosts.map((post) => {
              const content = post.finalContent ?? "";
              const isExpanded = expandedRepoIds.has(post._id);
              const copyId = `repo-${post._id}`;

              return (
                <li
                  key={post._id}
                  className="rounded-lg border border-zinc-100 bg-zinc-50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {post.topic}
                      </p>
                      {post.finalizedAt ? (
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {formatDate(post.finalizedAt)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(content, copyId)}
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                      >
                        {copiedId === copyId ? "Copied!" : "Copy"}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleRepoExpand(post._id)}
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                      >
                        {isExpanded ? "Collapse" : "View Full"}
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                    {isExpanded ? content : previewContent(content)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
