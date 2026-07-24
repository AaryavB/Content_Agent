"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useConvexAuth } from "convex/react";
import { LoadingState } from "@/components/ui/LoadingState";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <LoadingState message="Checking session..." />;
  }

  if (!isAuthenticated) {
    return <LoadingState message="Redirecting to login..." />;
  }

  return <>{children}</>;
}
