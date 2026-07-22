"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CardHeader } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";

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
    <div className="space-y-8">
      <CardHeader
        title="Professional background"
        description="Copy your LinkedIn About or Experience section and paste it here."
      />

      <Field label="LinkedIn paste">
        <Textarea
          value={linkedinPaste}
          onChange={(event) => onLinkedinPasteChange(event.target.value)}
          rows={8}
          placeholder="Paste your LinkedIn About or Experience section..."
        />
      </Field>

      {isTooShort ? (
        <Alert variant="warning">
          Please paste at least {MIN_PASTE_LENGTH} characters.
        </Alert>
      ) : null}

      {error ? (
        <div className="space-y-4">
          <Alert>{error}</Alert>
          <Button
            variant="secondary"
            onClick={onContinue}
            disabled={!canContinue}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {!error ? (
        <Button onClick={onContinue} disabled={!canContinue}>
          {isSubmitting ? "Processing background..." : "Continue"}
        </Button>
      ) : null}
    </div>
  );
}
