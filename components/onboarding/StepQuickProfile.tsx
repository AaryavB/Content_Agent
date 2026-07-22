"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CardHeader } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

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
    <div className="space-y-8">
      <CardHeader
        title="Quick profile"
        description="Three fields to get started. Everything else is inferred later."
      />

      <div className="space-y-5">
        <Field label="Name">
          <Input
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Your name"
          />
        </Field>

        <Field label="Role">
          <Input
            type="text"
            value={role}
            onChange={(event) => onRoleChange(event.target.value)}
            placeholder="Founder, CEO, etc."
          />
        </Field>

        <Field label="Organization">
          <Input
            type="text"
            value={organization}
            onChange={(event) => onOrganizationChange(event.target.value)}
            placeholder="Company or org name"
          />
        </Field>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <Button onClick={onContinue} disabled={!canContinue}>
        {isSubmitting ? "Creating profile..." : "Continue"}
      </Button>
    </div>
  );
}
