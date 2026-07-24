"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageShell";
import { getStoredUserId } from "@/lib/onboardingSession";

export function DashboardPageHeader() {
  const [storedUserId, setStoredUserId] = useState<string | null>(null);

  useEffect(() => {
    setStoredUserId(getStoredUserId());
  }, []);

  const user = useQuery(
    api.profiles.getProfile,
    storedUserId ? { userId: storedUserId as Id<"profiles"> } : "skip",
  );

  return (
    <PageHeader
      title="Dashboard"
      titleAddon={
        user ? <Badge variant="primary">{user.name}</Badge> : undefined
      }
      description="Generate LinkedIn posts in your writing style."
    />
  );
}
