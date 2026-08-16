import BehaviorRecordsPage from "@/features/behavior/records/pages/BehaviorRecordsPage";
import BehaviorAccessGuard from "@/features/behavior/shared/components/BehaviorAccessGuard";

export default function RecordsPage() {
  return (
    <BehaviorAccessGuard permission="behavior.records.view">
      <BehaviorRecordsPage />
    </BehaviorAccessGuard>
  );
}
