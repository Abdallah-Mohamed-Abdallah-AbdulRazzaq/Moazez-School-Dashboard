import TestDetailsPage from "@/features/admissions/tests/pages/TestDetailsPage";
import AdmissionsAccessGuard from "@/features/admissions/shared/components/AdmissionsAccessGuard";

interface PageProps {
  params: Promise<{ id: string }>;
}
export default async function TestDetailsRoute({ params }: PageProps) {
  const { id } = await params;
  return (
    <AdmissionsAccessGuard permission="admissions.tests.view">
      <TestDetailsPage testId={id} />
    </AdmissionsAccessGuard>
  );
}
