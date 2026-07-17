"use client";

type StepQuickProfileProps = {
  name: string;
  role: string;
  organization: string;
  isSubmitting: boolean;
  error: string | null;
  onNameChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onOrganizationChange: (value: string) => void;
  onContinue: () => void;
};

export function StepQuickProfile({
  name,
  role,
  organization,
  isSubmitting,
  error,
  onNameChange,
  onRoleChange,
  onOrganizationChange,
  onContinue,
}: StepQuickProfileProps) {
  const canContinue =
    name.trim().length > 0 &&
    role.trim().length > 0 &&
    organization.trim().length > 0 &&
    !isSubmitting;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Quick profile</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Three fields to get started. Everything else is inferred later.
        </p>
      </div>

      <div className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-700">Name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
            placeholder="Your name"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-700">Role</span>
          <input
            type="text"
            value={role}
            onChange={(event) => onRoleChange(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
            placeholder="Founder, CEO, etc."
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-700">Organization</span>
          <input
            type="text"
            value={organization}
            onChange={(event) => onOrganizationChange(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
            placeholder="Company or org name"
          />
        </label>
      </div>

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
        {isSubmitting ? "Creating profile..." : "Continue"}
      </button>
    </div>
  );
}
