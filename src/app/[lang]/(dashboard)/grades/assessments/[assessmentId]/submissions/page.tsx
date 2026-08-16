import AssessmentSubmissionsPage from "@/features/grades/submissions/pages/AssessmentSubmissionsPage";
import GradesAccessGuard from "@/features/grades/shared/components/GradesAccessGuard";

export default async function Page({ params }: { params: Promise<{ assessmentId: string }> }) {
  const { assessmentId } = await params;
  return (
    <GradesAccessGuard permission="grades.submissions.view">
      <AssessmentSubmissionsPage assessmentId={assessmentId} />
    </GradesAccessGuard>
  );
}
