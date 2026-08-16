import AssessmentQuestionsPage from "@/features/grades/assessments/pages/AssessmentQuestionsPage";
import GradesAccessGuard from "@/features/grades/shared/components/GradesAccessGuard";

interface PageProps {
  params: Promise<{ assessmentId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { assessmentId } = await params;

  return (
    <GradesAccessGuard permission="grades.assessments.view">
      <GradesAccessGuard permission="grades.questions.view">
        <AssessmentQuestionsPage assessmentId={assessmentId} mode="edit" />
      </GradesAccessGuard>
    </GradesAccessGuard>
  );
}
