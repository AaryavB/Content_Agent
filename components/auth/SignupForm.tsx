"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { RedirectIfAuthenticated } from "@/components/RedirectIfAuthenticated";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { PageShell } from "@/components/ui/PageShell";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function SignupForm() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn("password", {
        flow: "signUp",
        email: email.trim(),
        password,
      });
      router.replace("/");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <RedirectIfAuthenticated>
      <PageShell>
        <div className="mx-auto w-full max-w-md pt-10">
          <Card>
            <form className="space-y-8" onSubmit={handleSubmit}>
              <CardHeader
                title="Create account"
                description="Sign up to create and manage founder profiles."
              />

              <div className="space-y-5">
                <Field label="Email">
                  <Input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </Field>

                <Field label="Password">
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                  />
                </Field>

                <Field label="Confirm password">
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your password"
                    required
                    minLength={8}
                  />
                </Field>
              </div>

              {error ? <Alert>{error}</Alert> : null}

              <div className="space-y-4">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Creating account..." : "Sign up"}
                </Button>
                <p className="text-center text-sm text-muted">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-primary hover:underline"
                  >
                    Log in
                  </Link>
                </p>
              </div>
            </form>
          </Card>
        </div>
      </PageShell>
    </RedirectIfAuthenticated>
  );
}
