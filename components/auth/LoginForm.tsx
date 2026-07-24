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
  const message = error instanceof Error ? error.message : "Something went wrong.";
  if (message.includes("InvalidAccountId")) {
    return "No account found with this email. Sign up first or check for typos.";
  }
  if (message.includes("InvalidSecret") || message.includes("Invalid credentials")) {
    return "Incorrect password. Try again.";
  }
  return message;
}

export function LoginForm() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signIn("password", {
        flow: "signIn",
        email: email.trim().toLowerCase(),
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
                title="Log in"
                description="Sign in to manage your founder profiles."
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
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Your password"
                    required
                  />
                </Field>
              </div>

              {error ? <Alert>{error}</Alert> : null}

              <div className="space-y-4">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Signing in..." : "Log in"}
                </Button>
                <p className="text-center text-sm text-muted">
                  No account yet?{" "}
                  <Link
                    href="/signup"
                    className="font-medium text-primary hover:underline"
                  >
                    Sign up
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
