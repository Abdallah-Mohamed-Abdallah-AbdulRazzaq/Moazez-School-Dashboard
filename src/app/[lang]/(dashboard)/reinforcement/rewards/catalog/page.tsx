import RewardCatalogPage from "@/features/reinforcement/pages/RewardCatalogPage";
import ReinforcementAccessGuard from "@/features/reinforcement/components/ReinforcementAccessGuard";

export default function Page() {
  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <ReinforcementAccessGuard permission="reinforcement.rewards.view">
        <RewardCatalogPage />
      </ReinforcementAccessGuard>
    </main>
  );
}
