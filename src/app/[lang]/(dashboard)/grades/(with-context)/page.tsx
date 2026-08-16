import GradesOverviewPage from "@/features/grades/overview/pages/GradesOverviewPage";
import GradesAccessGuard from "@/features/grades/shared/components/GradesAccessGuard";

export default function Page() {
  return (
    <GradesAccessGuard permission="grades.gradebook.view">
      <GradesAccessGuard permission="grades.assessments.view">
        <GradesAccessGuard permission="grades.analytics.view">
          <GradesOverviewPage />
        </GradesAccessGuard>
      </GradesAccessGuard>
    </GradesAccessGuard>
  );
}
