import HeroJourneyMissionsPage from "@/features/hero-journey/components/HeroJourneyMissionsPage";
import ReinforcementAccessGuard from "@/features/reinforcement/components/ReinforcementAccessGuard";

export default function Page() {
  return (
    <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
      <ReinforcementAccessGuard permission="reinforcement.hero.view">
        <HeroJourneyMissionsPage />
      </ReinforcementAccessGuard>
    </main>
  );
}
