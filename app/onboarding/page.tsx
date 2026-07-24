import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { RequireAuth } from "@/components/RequireAuth";
import { PageHeader, PageShell } from "@/components/ui/PageShell";

export default function OnboardingPage() {
  return (
    <RequireAuth>
      <PageShell>
        <PageHeader
          title="Onboarding"
          description="Set up your profile and writing style in four quick steps."
        />
        <div className="mt-10">
          <OnboardingWizard />
        </div>
      </PageShell>
    </RequireAuth>
  );
}
