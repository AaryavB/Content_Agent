import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { RequireAuth } from "@/components/RequireAuth";
import { PageShell } from "@/components/ui/PageShell";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <PageShell>
        <DashboardPageHeader />
        <div className="mt-10">
          <DashboardContent />
        </div>
      </PageShell>
    </RequireAuth>
  );
}
