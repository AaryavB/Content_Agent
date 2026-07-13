import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default function DashboardPage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Generate LinkedIn posts in your writing style.
        </p>
      </div>
      <DashboardContent />
    </main>
  );
}
