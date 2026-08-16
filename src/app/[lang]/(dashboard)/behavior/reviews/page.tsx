import BehaviorReviewsPage from "@/features/behavior/reviews/pages/BehaviorReviewsPage";
import BehaviorAccessGuard from "@/features/behavior/shared/components/BehaviorAccessGuard";

export default function ReviewsPage() {
  return (
    <BehaviorAccessGuard permission="behavior.records.view">
      <BehaviorReviewsPage />
    </BehaviorAccessGuard>
  );
}
