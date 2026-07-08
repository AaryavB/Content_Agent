"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Style selection</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Here are 5 writing styles on{" "}
          <span className="font-medium text-zinc-800">{firstTopic}</span>. Pick
          up to {hasOwnWriting ? "1" : "2"} that feel most like you.
        </p>
      </div>

      {isLoadingSamples ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100"
            />
          ))}
        </div>
      ) : null}

      {loadError ? (
        <div className="space-y-3">
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            Retry
          </button>
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
                className={`rounded-lg border p-4 text-left transition ${
                  isSelected
                    ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {sample.style}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                  {sample.content}
                </p>
              </button>
            );
          })}
        </div>
      ) : null}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-700">
          Write your own (optional)
        </span>
        <textarea
          value={ownWriting}
          onChange={(event) => setOwnWriting(event.target.value)}
          rows={4}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
          placeholder="Write your own version of the post..."
        />
        {hasOwnWriting ? (
          <p className="text-xs text-zinc-500">
            With your own writing, you can select exactly 1 style.
          </p>
        ) : null}
      </label>

      {error ? (
        <div className="space-y-3">
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
          <button
            type="button"
            onClick={handleFinish}
            disabled={!canFinish}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!error ? (
        <button
          type="button"
          onClick={handleFinish}
          disabled={!canFinish}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isSubmitting ? "Finishing onboarding..." : "Finish onboarding"}
        </button>
      ) : null}
    </div>
  );
}
