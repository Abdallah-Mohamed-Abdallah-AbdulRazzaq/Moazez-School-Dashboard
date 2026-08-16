import AssessmentQuestionsPage from "@/features/grades/assessments/pages/AssessmentQuestionsPage";
import GradesAccessGuard from "@/features/grades/shared/components/GradesAccessGuard";

export default function Page() {
  return (
    <GradesAccessGuard permission="grades.assessments.manage">
      <AssessmentQuestionsPage mode="create" />
    </GradesAccessGuard>
  );
}
