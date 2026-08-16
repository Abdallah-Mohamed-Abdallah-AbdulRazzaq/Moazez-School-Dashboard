import NedaaAccessGuard from "@/features/nedaa/components/NedaaAccessGuard";
import NedaaOperationsPage from "@/features/nedaa/pages/NedaaOperationsPage";

export default function Page() {
  return (
    <NedaaAccessGuard permission="dismissal.requests.view">
      <NedaaOperationsPage />
    </NedaaAccessGuard>
  );
}
