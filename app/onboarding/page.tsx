import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { PageHeader, PageShell } from "@/components/ui/PageShell";

export default function OnboardingPage() {
  return (
    <PageShell>
      <PageHeader
        title="Onboarding"
        description="Set up your profile and writing style in four quick steps."
      />
      <div className="mt-10">
        <OnboardingWizard />
      </div>
    </PageShell>
  );
}
