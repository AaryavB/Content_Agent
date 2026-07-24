"use client";

import { useEffect, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAppNavigation } from "@/components/AppNavigationProvider";
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
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { StepIndicator } from "@/components/ui/StepIndicator";
import type { OnboardingStep } from "@/lib/appNavigation";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function OnboardingWizard() {
  const { push, replace, completeTo, registerOnboardingNavigator } =
    useAppNavigation();

  const createProfile = useMutation(api.profiles.createProfile);
  const saveBackgroundInput = useMutation(api.profiles.saveBackgroundInput);
  const updateTopics = useMutation(api.profiles.updateTopics);
  const inferProfessionalBackground = useAction(
    api.onboardingActions.inferProfessionalBackground,
  );
  const synthesizeStyleProfile = useAction(
    api.onboardingActions.synthesizeStyleProfile,
  );

  const [storedUserId, setStoredUserIdState] = useState<string | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [step, setStep] = useState<OnboardingStep>(1);
  const [userId, setUserId] = useState<Id<"profiles"> | null>(null);
  const hasSyncedResumeNavRef = useRef(false);
  const hasCompletedRedirectRef = useRef(false);

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
    hasSyncedResumeNavRef.current = false;
    hasCompletedRedirectRef.current = false;
  }, []);

  useEffect(() => {
    registerOnboardingNavigator({ setStep });
    return () => registerOnboardingNavigator(null);
  }, [registerOnboardingNavigator]);

  const user = useQuery(
    api.profiles.getProfile,
    storedUserId ? { userId: storedUserId as Id<"profiles"> } : "skip",
  );
  const styleProfile = useQuery(
    api.profiles.getStyleProfile,
    storedUserId ? { userId: storedUserId as Id<"profiles"> } : "skip",
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
      hasSyncedResumeNavRef.current = false;
      return;
    }

    const resumeStep = getResumeStep(user, styleProfile !== null);

    if (resumeStep === "complete") {
      if (!hasCompletedRedirectRef.current) {
        hasCompletedRedirectRef.current = true;
        completeTo({ kind: "route", href: "/dashboard" });
      }
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

    if (!hasSyncedResumeNavRef.current) {
      hasSyncedResumeNavRef.current = true;
      replace({ kind: "onboarding-step", step: resumeStep });
    }
  }, [
    hasCheckedSession,
    storedUserId,
    user,
    styleProfile,
    completeTo,
    replace,
  ]);

  async function handleStep1Continue() {
    setIsSubmitting(true);
    setStepError(null);

    try {
      const newUserId = await createProfile({ name, role, organization });
      setStoredUserId(newUserId);
      setStoredUserIdState(newUserId);
      setUserId(newUserId);
      push({ kind: "onboarding-step", step: 2 });
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
      push({ kind: "onboarding-step", step: 3 });
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
      push({ kind: "onboarding-step", step: 4 });
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

      completeTo({ kind: "route", href: "/dashboard" });
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
    return <LoadingState message="Loading onboarding..." />;
  }

  return (
    <div className="w-full">
      <StepIndicator currentStep={step} totalSteps={4} />

      <Card>
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
      </Card>
    </div>
  );
}
