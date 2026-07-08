import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Onboarding</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Set up your profile and writing style in four quick steps.
        </p>
      </div>
      <OnboardingWizard />
    </main>
  );
}
