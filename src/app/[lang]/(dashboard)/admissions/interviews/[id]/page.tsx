import InterviewDetailsPage from "@/features/admissions/interviews/pages/InterviewDetailsPage";
import AdmissionsAccessGuard from "@/features/admissions/shared/components/AdmissionsAccessGuard";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return (
    <AdmissionsAccessGuard permission="admissions.interviews.view">
      <InterviewDetailsPage interviewId={id} />
    </AdmissionsAccessGuard>
  );
}
