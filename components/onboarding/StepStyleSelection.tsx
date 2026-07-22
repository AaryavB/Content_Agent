"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CardHeader } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/cn";

type StyleSample = {
  style: string;
  content: string;
};

type StepStyleSelectionProps = {
  firstTopic: string;
  isSubmitting: boolean;
  error: string | null;
  onFinish: (payload: {
    selectedStyles: string[];
    userWritingSample?: string;
    sampleWritingWeight: number;
  }) => void;
};

export function StepStyleSelection({
  firstTopic,
  isSubmitting,
  error,
  onFinish,
}: StepStyleSelectionProps) {
  const generateStyleSamples = useAction(
    api.onboardingActions.generateStyleSamples,
  );

  const [samples, setSamples] = useState<StyleSample[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [ownWriting, setOwnWriting] = useState("");
  const [isLoadingSamples, setIsLoadingSamples] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const hasOwnWriting = ownWriting.trim().length > 0;
  const maxSelections = hasOwnWriting ? 1 : 2;

  useEffect(() => {
    let cancelled = false;

    async function loadSamples() {
      setIsLoadingSamples(true);
      setLoadError(null);

      try {
        const result = await generateStyleSamples({ topic: firstTopic });
        if (!cancelled) {
          setSamples(result.samples);
        }
      } catch (loadSamplesError) {
        if (!cancelled) {
          setLoadError(
            loadSamplesError instanceof Error
              ? loadSamplesError.message
              : "Failed to generate style samples.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSamples(false);
        }
      }
    }

    void loadSamples();

    return () => {
      cancelled = true;
    };
  }, [firstTopic, generateStyleSamples]);

  useEffect(() => {
    if (hasOwnWriting && selectedStyles.length > 1) {
      setSelectedStyles((current) => current.slice(0, 1));
    }
  }, [hasOwnWriting, selectedStyles.length]);

  function toggleStyle(style: string) {
    setSelectedStyles((current) => {
      if (current.includes(style)) {
        return current.filter((item) => item !== style);
      }

      if (current.length >= maxSelections) {
        if (maxSelections === 1) {
          return [style];
        }
        return current;
      }

      return [...current, style];
    });
  }

  function handleFinish() {
    onFinish({
      selectedStyles,
      userWritingSample: hasOwnWriting ? ownWriting.trim() : undefined,
      sampleWritingWeight: hasOwnWriting ? 0.75 : 0,
    });
  }

  const canFinish =
    !isLoadingSamples &&
    !isSubmitting &&
    selectedStyles.length >= 1 &&
    (!hasOwnWriting || selectedStyles.length === 1);

  return (
    <div className="space-y-8">
      <CardHeader
        title="Style selection"
        description={
          <>
            Here are 5 writing styles on{" "}
            <span className="font-medium text-foreground">{firstTopic}</span>.
            Pick up to {hasOwnWriting ? "1" : "2"} that feel most like you.
          </>
        }
      />

      {isLoadingSamples ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-[12px] border border-border bg-surface-muted"
            />
          ))}
        </div>
      ) : null}

      {loadError ? (
        <div className="space-y-4">
          <Alert>{loadError}</Alert>
          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {!isLoadingSamples && !loadError ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {samples.map((sample) => {
            const isSelected = selectedStyles.includes(sample.style);

            return (
              <button
                key={sample.style}
                type="button"
                onClick={() => toggleStyle(sample.style)}
                className={cn(
                  "focus-ring rounded-[12px] border p-4 text-left transition-all",
                  isSelected
                    ? "border-primary/40 bg-primary-subtle ring-1 ring-primary/20"
                    : "border-border bg-surface hover:border-border hover:bg-surface-muted",
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                  {sample.style}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {sample.content}
                </p>
              </button>
            );
          })}
        </div>
      ) : null}

      <Field
        label="Write your own (optional)"
        hint={
          hasOwnWriting
            ? "With your own writing, you can select exactly 1 style."
            : undefined
        }
      >
        <Textarea
          value={ownWriting}
          onChange={(event) => setOwnWriting(event.target.value)}
          rows={4}
          placeholder="Write your own version of the post..."
        />
      </Field>

      {error ? (
        <div className="space-y-4">
          <Alert>{error}</Alert>
          <Button variant="secondary" onClick={handleFinish} disabled={!canFinish}>
            Retry
          </Button>
        </div>
      ) : null}

      {!error ? (
        <Button onClick={handleFinish} disabled={!canFinish}>
          {isSubmitting ? "Finishing onboarding..." : "Finish onboarding"}
        </Button>
      ) : null}
    </div>
  );
}
