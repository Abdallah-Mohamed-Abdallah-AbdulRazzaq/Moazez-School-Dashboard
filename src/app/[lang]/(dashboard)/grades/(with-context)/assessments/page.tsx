import GradesAssessmentsPage from "@/features/grades/assessments/pages/GradesAssessmentsPage";
import GradesAccessGuard from "@/features/grades/shared/components/GradesAccessGuard";

export default function Page() {
  return (
    <GradesAccessGuard permission="grades.gradebook.view">
      <GradesAccessGuard permission="grades.assessments.view">
        <GradesAssessmentsPage />
      </GradesAccessGuard>
    </GradesAccessGuard>
  );
}
