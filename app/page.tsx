import { HomeContent } from "@/components/HomeContent";
import { RequireAuth } from "@/components/RequireAuth";

export default function Home() {
  return (
    <RequireAuth>
      <HomeContent />
    </RequireAuth>
  );
}
