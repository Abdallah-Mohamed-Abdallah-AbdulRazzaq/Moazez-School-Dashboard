import ReinforcementOverviewPage from "@/features/reinforcement/pages/ReinforcementOverviewPage";
import ReinforcementAccessGuard from "@/features/reinforcement/components/ReinforcementAccessGuard";

export default function Page() {
  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <ReinforcementAccessGuard permission="reinforcement.overview.view">
        <ReinforcementOverviewPage />
      </ReinforcementAccessGuard>
    </main>
  );
}
