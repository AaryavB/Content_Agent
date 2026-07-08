export type OnboardingUser = {
  professionalBackground: string;
  topics: string[];
};

export type OnboardingResumeStep = 1 | 2 | 3 | 4 | "complete";

export function getResumeStep(
  user: OnboardingUser | null | undefined,
  hasStyleProfile: boolean,
): OnboardingResumeStep {
  if (!user) {
    return 1;
  }

  if (hasStyleProfile) {
    return "complete";
  }

  if (!user.professionalBackground.trim()) {
    return 2;
  }

  if (user.topics.length === 0) {
    return 3;
  }

  return 4;
}
