import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { PageShell } from "@/components/ui/PageShell";

export default function DashboardPage() {
  return (
    <PageShell>
      <DashboardPageHeader />
      <div className="mt-10">
        <DashboardContent />
      </div>
    </PageShell>
  );
}
