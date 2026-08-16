import GradeSubmissionPage from "@/features/grades/submissions/pages/GradeSubmissionPage";
import GradesAccessGuard from "@/features/grades/shared/components/GradesAccessGuard";

export default async function Page({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  return (
    <GradesAccessGuard permission="grades.submissions.view">
      <GradeSubmissionPage submissionId={submissionId} />
    </GradesAccessGuard>
  );
}
