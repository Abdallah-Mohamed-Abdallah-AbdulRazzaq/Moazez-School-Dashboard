import BehaviorOverviewPage from "@/features/behavior/overview/pages/BehaviorOverviewPage";
import BehaviorAccessGuard from "@/features/behavior/shared/components/BehaviorAccessGuard";

export default function BehaviorOverviewRoute() {
  return (
    <BehaviorAccessGuard permission="behavior.overview.view">
      <BehaviorOverviewPage />
    </BehaviorAccessGuard>
  );
}
