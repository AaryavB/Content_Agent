"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getResumeStep } from "@/lib/onboardingResume";
import {
  clearStoredUserId,
  getStoredUserId,
  setStoredUserId,
} from "@/lib/onboardingSession";
import { StepLinkedInPaste } from "@/components/onboarding/StepLinkedInPaste";
import { StepQuickProfile } from "@/components/onboarding/StepQuickProfile";
import { StepStyleSelection } from "@/components/onboarding/StepStyleSelection";
import { StepTopics } from "@/components/onboarding/StepTopics";

type OnboardingStep = 1 | 2 | 3 | 4;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function OnboardingWizard() {
  const router = useRouter();

  const createUser = useMutation(api.users.createUser);
  const saveBackgroundInput = useMutation(api.users.saveBackgroundInput);
  const updateTopics = useMutation(api.users.updateTopics);
  const inferProfessionalBackground = useAction(
    api.onboardingActions.inferProfessionalBackground,
  );
  const synthesizeStyleProfile = useAction(
    api.onboardingActions.synthesizeStyleProfile,
  );

  const [storedUserId, setStoredUserIdState] = useState<string | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [step, setStep] = useState<OnboardingStep>(1);
  const [userId, setUserId] = useState<Id<"users"> | null>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [organization, setOrganization] = useState("");
  const [linkedinPaste, setLinkedinPaste] = useState("");
  const [topics, setTopics] = useState(["", "", "", ""]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  useEffect(() => {
    setStoredUserIdState(getStoredUserId());
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

  useEffect(() => {
    if (!hasCheckedSession || !storedUserId) {
      return;
    }

    if (user === undefined || styleProfile === undefined) {
      return;
    }

    if (user === null) {
      clearStoredUserId();
      setStoredUserIdState(null);
      setUserId(null);
      setStep(1);
      return;
    }

    const resumeStep = getResumeStep(user, styleProfile !== null);

    if (resumeStep === "complete") {
      router.replace("/");
      return;
    }

    setUserId(user._id);
    setName(user.name);
    setRole(user.role);
    setOrganization(user.organization);

    if (user.topics.length > 0) {
      const paddedTopics = [...user.topics];
      while (paddedTopics.length < 4) {
        paddedTopics.push("");
      }
      setTopics(paddedTopics.slice(0, 4));
    }

    setStep(resumeStep);
  }, [hasCheckedSession, storedUserId, user, styleProfile, router]);

  async function handleStep1Continue() {
    setIsSubmitting(true);
    setStepError(null);

    try {
      const newUserId = await createUser({ name, role, organization });
      setStoredUserId(newUserId);
      setStoredUserIdState(newUserId);
      setUserId(newUserId);
      setStep(2);
    } catch (error) {
      setStepError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStep2Continue() {
    if (!userId) {
      setStepError("User session not found. Please restart onboarding.");
      return;
    }

    setIsSubmitting(true);
    setStepError(null);

    try {
      await saveBackgroundInput({ userId, linkedinPaste });
      await inferProfessionalBackground({ userId, linkedinPaste });
      setStep(3);
    } catch (error) {
      setStepError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStep3Continue() {
    if (!userId) {
      setStepError("User session not found. Please restart onboarding.");
      return;
    }

    setIsSubmitting(true);
    setStepError(null);

    try {
      const filledTopics = topics
        .map((topic) => topic.trim())
        .filter((topic) => topic.length > 0);

      await updateTopics({ userId, topics: filledTopics });
      setStep(4);
    } catch (error) {
      setStepError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStep4Finish(payload: {
    selectedStyles: string[];
    userWritingSample?: string;
    sampleWritingWeight: number;
  }) {
    if (!userId) {
      setStepError("User session not found. Please restart onboarding.");
      return;
    }

    setIsSubmitting(true);
    setStepError(null);

    try {
      await synthesizeStyleProfile({
        userId,
        selectedStyles: payload.selectedStyles,
        userWritingSample: payload.userWritingSample,
        sampleWritingWeight: payload.sampleWritingWeight,
      });

      router.push("/dashboard");
    } catch (error) {
      setStepError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const firstTopic =
    topics.map((topic) => topic.trim()).find((topic) => topic.length > 0) ??
    user?.topics[0] ??
    "";

  const isResuming =
    hasCheckedSession &&
    storedUserId !== null &&
    (user === undefined || styleProfile === undefined);

  if (!hasCheckedSession || isResuming) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <p className="text-sm text-zinc-500">Loading onboarding...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8">
        <p className="text-sm font-medium text-zinc-500">
          Step {step} of 4
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        {step === 1 ? (
          <StepQuickProfile
            name={name}
            role={role}
            organization={organization}
            isSubmitting={isSubmitting}
            error={stepError}
            onNameChange={setName}
            onRoleChange={setRole}
            onOrganizationChange={setOrganization}
            onContinue={handleStep1Continue}
          />
        ) : null}

        {step === 2 ? (
          <StepLinkedInPaste
            linkedinPaste={linkedinPaste}
            isSubmitting={isSubmitting}
            error={stepError}
            onLinkedinPasteChange={setLinkedinPaste}
            onContinue={handleStep2Continue}
          />
        ) : null}

        {step === 3 ? (
          <StepTopics
            topics={topics}
            isSubmitting={isSubmitting}
            error={stepError}
            onTopicChange={(index, value) => {
              setTopics((current) =>
                current.map((topic, topicIndex) =>
                  topicIndex === index ? value : topic,
                ),
              );
            }}
            onContinue={handleStep3Continue}
          />
        ) : null}

        {step === 4 && userId && firstTopic ? (
          <StepStyleSelection
            firstTopic={firstTopic}
            isSubmitting={isSubmitting}
            error={stepError}
            onFinish={handleStep4Finish}
          />
        ) : null}
      </div>
    </div>
  );
}
