import { cn } from "@/lib/cn";

type StepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
};

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">
          Step {currentStep} of {totalSteps}
        </p>
        <p className="text-sm text-subtle">{Math.round(progress)}%</p>
      </div>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-border-subtle"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Onboarding progress: step ${currentStep} of ${totalSteps}`}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
