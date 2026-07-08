import { Suspense } from "react";
import { HomeContent } from "@/components/HomeContent";

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6">
          <p className="text-sm text-zinc-500">Loading...</p>
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
