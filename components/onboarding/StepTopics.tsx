"use client";

type StepTopicsProps = {
  topics: string[];
  isSubmitting: boolean;
  error: string | null;
  onTopicChange: (index: number, value: string) => void;
  onContinue: () => void;
};

function countFilledTopics(topics: string[]): number {
  return topics.filter((topic) => topic.trim().length > 0).length;
}

export function StepTopics({
  topics,
  isSubmitting,
  error,
  onTopicChange,
  onContinue,
}: StepTopicsProps) {
  const filledCount = countFilledTopics(topics);
  const canContinue = filledCount >= 3 && filledCount <= 4 && !isSubmitting;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Topics</h2>
        <p className="mt-1 text-sm text-zinc-600">
          What topics do you usually write or think about? Add 3-4.
        </p>
      </div>

      <div className="space-y-3">
        {topics.map((topic, index) => (
          <label key={index} className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700">
              Topic {index + 1}
            </span>
            <input
              type="text"
              value={topic}
              onChange={(event) => onTopicChange(index, event.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
              placeholder="e.g. Startup building"
            />
          </label>
        ))}
      </div>

      <p className="text-sm text-zinc-500">{filledCount} of 3-4 topics added</p>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue}
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {isSubmitting ? "Saving topics..." : "Continue"}
      </button>
    </div>
  );
}
