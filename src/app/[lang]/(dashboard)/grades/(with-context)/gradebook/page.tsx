import GradesGradebookPage from "@/features/grades/gradebook/pages/GradesGradebookPage";
import GradesAccessGuard from "@/features/grades/shared/components/GradesAccessGuard";

export default function Page() {
  return (
    <GradesAccessGuard permission="grades.gradebook.view">
      <GradesAccessGuard permission="grades.assessments.view">
        <GradesAccessGuard permission="grades.analytics.view">
          <GradesGradebookPage />
        </GradesAccessGuard>
      </GradesAccessGuard>
    </GradesAccessGuard>
  );
}
