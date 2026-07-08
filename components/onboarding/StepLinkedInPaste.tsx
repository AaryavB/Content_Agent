"use client";

type StepLinkedInPasteProps = {
  linkedinPaste: string;
  isSubmitting: boolean;
  error: string | null;
  onLinkedinPasteChange: (value: string) => void;
  onContinue: () => void;
};

const MIN_PASTE_LENGTH = 50;

export function StepLinkedInPaste({
  linkedinPaste,
  isSubmitting,
  error,
  onLinkedinPasteChange,
  onContinue,
}: StepLinkedInPasteProps) {
  const trimmedLength = linkedinPaste.trim().length;
  const isTooShort = trimmedLength > 0 && trimmedLength < MIN_PASTE_LENGTH;
  const canContinue = trimmedLength >= MIN_PASTE_LENGTH && !isSubmitting;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Professional background
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Copy your LinkedIn About or Experience section and paste it here.
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-700">LinkedIn paste</span>
        <textarea
          value={linkedinPaste}
          onChange={(event) => onLinkedinPasteChange(event.target.value)}
          rows={8}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
          placeholder="Paste your LinkedIn About or Experience section..."
        />
      </label>

      {isTooShort ? (
        <p className="text-sm text-amber-700">
          Please paste at least {MIN_PASTE_LENGTH} characters.
        </p>
      ) : null}

      {error ? (
        <div className="space-y-3">
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!error ? (
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isSubmitting ? "Processing background..." : "Continue"}
        </button>
      ) : null}
    </div>
  );
}
