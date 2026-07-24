"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useConvexAuth } from "convex/react";
import { LoadingState } from "@/components/ui/LoadingState";

export function RedirectIfAuthenticated({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <LoadingState message="Loading..." />;
  }

  if (isAuthenticated) {
    return <LoadingState message="Redirecting..." />;
  }

  return <>{children}</>;
}
