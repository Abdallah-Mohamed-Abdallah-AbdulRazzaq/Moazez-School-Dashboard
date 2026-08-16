import BehaviorCategoriesPage from "@/features/behavior/categories/pages/BehaviorCategoriesPage";
import BehaviorAccessGuard from "@/features/behavior/shared/components/BehaviorAccessGuard";

export default function CategoriesPage() {
  return (
    <BehaviorAccessGuard permission="behavior.categories.view">
      <BehaviorCategoriesPage />
    </BehaviorAccessGuard>
  );
}
