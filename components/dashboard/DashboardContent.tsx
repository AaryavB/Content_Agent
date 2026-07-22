"use client";

import { useEffect, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAppNavigation } from "@/components/AppNavigationProvider";
import { getStoredUserId } from "@/lib/onboardingSession";
import { CUSTOM_TOPIC_VALUE } from "@/lib/topics";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

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
  const { reset } = useAppNavigation();
  const generatePost = useAction(api.postActions.generatePost);
  const regeneratePostAction = useAction(api.postActions.regeneratePostAction);
  const finalizePostAction = useAction(api.postActions.finalizePostAction);
  const rejectPost = useMutation(api.posts.rejectPost);

  const [storedUserId, setStoredUserId] = useState<string | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  const [topicSelection, setTopicSelection] = useState("");
  const [customTopic, setCustomTopic] = useState("");
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
      reset();
      return;
    }

    if (user === undefined || styleProfile === undefined) {
      return;
    }

    if (user === null || styleProfile === null) {
      reset();
    }
  }, [hasCheckedSession, storedUserId, user, styleProfile, reset]);

  const isLoading =
    !hasCheckedSession ||
    !storedUserId ||
    user === undefined ||
    styleProfile === undefined;

  function getResolvedTopic(): string {
    if (topicSelection === CUSTOM_TOPIC_VALUE) {
      return customTopic.trim();
    }
    return topicSelection.trim();
  }

  const canGenerate = getResolvedTopic().length > 0 && !isBusy;
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
        topic: getResolvedTopic(),
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
      setTopicSelection(randomTopic);
      setCustomTopic("");
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
    return <LoadingState message="Loading dashboard..." />;
  }

  if (!user || !styleProfile) {
    return null;
  }

  return (
    <div className="w-full space-y-6">
      <Card>
        <div className="space-y-6">
          <CardHeader
            title="Generate a post"
            description="Choose a topic and add your take. The agent writes in your style."
          />

          <Field label="Topic">
            <Select
              value={topicSelection}
              onChange={(event) => setTopicSelection(event.target.value)}
              disabled={isBusy}
              placeholder="Select a topic"
              options={[
                ...user.topics.map((userTopic) => ({
                  value: userTopic,
                  label: userTopic,
                })),
                {
                  value: CUSTOM_TOPIC_VALUE,
                  label: "Other",
                },
              ]}
            />
          </Field>

          {topicSelection === CUSTOM_TOPIC_VALUE ? (
            <Field label="Your topic">
              <Input
                type="text"
                value={customTopic}
                onChange={(event) => setCustomTopic(event.target.value)}
                disabled={isBusy}
                placeholder="e.g. Remote work culture"
              />
            </Field>
          ) : null}

          <Field label="Your take (optional)">
            <Textarea
              value={userInput}
              onChange={(event) => setUserInput(event.target.value)}
              rows={4}
              disabled={isBusy}
              placeholder="What's your angle or opinion on this topic?"
            />
          </Field>

          <p className="text-sm text-muted">
            The agent gets better after 5–6 finalized posts. Keep reviewing and
            editing.
          </p>

          {error ? <Alert>{error}</Alert> : null}

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleGenerate} disabled={!canGenerate}>
              {isBusy && isDraft ? "Generating..." : "Generate"}
            </Button>
            <Button
              variant="secondary"
              onClick={handleSurpriseMe}
              disabled={!canSurpriseMe}
            >
              Surprise Me
            </Button>
          </div>
        </div>
      </Card>

      {generatedContent ? (
        <Card>
          <CardHeader
            title={draftStatus === "finalized" ? "Finalized post" : "Your draft"}
            description={`Topic: ${getResolvedTopic()}`}
          />

          {draftStatus === "finalized" ? (
            <Alert variant="success" className="mt-4">
              Post finalized
            </Alert>
          ) : null}

          {profileUpdateWarning ? (
            <Alert variant="warning" className="mt-4">
              Post finalized, but style profile couldn&apos;t be updated.
              Future posts may not reflect your latest edits.
            </Alert>
          ) : null}

          {isEditing ? (
            <Textarea
              value={editDraft}
              onChange={(event) => setEditDraft(event.target.value)}
              rows={12}
              disabled={isBusy}
              className="mt-6"
            />
          ) : (
            <div className="mt-6 whitespace-pre-wrap rounded-[12px] border border-border-subtle bg-surface-muted px-4 py-4 text-sm leading-relaxed text-foreground">
              {draftStatus === "finalized"
                ? (finalContent ?? getDisplayContent())
                : getDisplayContent()}
            </div>
          )}

          {draftStatus === "finalized" && finalContent ? (
            <div className="mt-6">
              <Button
                variant="secondary"
                onClick={() => handleCopy(finalContent, "draft-card")}
              >
                {copiedId === "draft-card" ? "Copied!" : "Copy"}
              </Button>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {isEditing ? (
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleSaveEdits}
                    disabled={isBusy || !editDraft.trim()}
                  >
                    Save Edits
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCancelEdit}
                    disabled={isBusy}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    onClick={handleStartEdit}
                    disabled={!canEdit}
                  >
                    Edit
                  </Button>
                  <Button onClick={handleFinalize} disabled={!canFinalize}>
                    {isBusy ? "Finalizing and learning..." : "Finalize"}
                  </Button>
                </div>
              )}

              {!isEditing ? (
                <div className="space-y-4 border-t border-border-subtle pt-6">
                  <Field label="Regenerate with guidance (optional)">
                    <Input
                      type="text"
                      value={regenerateNote}
                      onChange={(event) =>
                        setRegenerateNote(event.target.value)
                      }
                      disabled={isBusy}
                      placeholder="e.g. make it more punchy"
                    />
                  </Field>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="secondary"
                      onClick={handleRegenerate}
                      disabled={!canRegenerate}
                    >
                      {isBusy ? "Regenerating..." : "Regenerate"}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={handleReject}
                      disabled={!canReject}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </Card>
      ) : null}

      <Card>
        <CardHeader title="My Posts" />

        {finalizedPosts === undefined ? (
          <p className="mt-6 text-sm text-muted">Loading posts...</p>
        ) : finalizedPosts.length === 0 ? (
          <p className="mt-6 text-sm text-muted">
            No posts yet. Generate your first post above.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {finalizedPosts.map((post) => {
              const content = post.finalContent ?? "";
              const isExpanded = expandedRepoIds.has(post._id);
              const copyId = `repo-${post._id}`;

              return (
                <li
                  key={post._id}
                  className="rounded-[12px] border border-border-subtle bg-surface-muted p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {post.topic}
                      </p>
                      {post.finalizedAt ? (
                        <p className="mt-0.5 text-xs text-subtle">
                          {formatDate(post.finalizedAt)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCopy(content, copyId)}
                      >
                        {copiedId === copyId ? "Copied!" : "Copy"}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toggleRepoExpand(post._id)}
                      >
                        {isExpanded ? "Collapse" : "View Full"}
                      </Button>
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                    {isExpanded ? content : previewContent(content)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
