import ApplicationTabContent from "@/features/admissions/applications/components/ApplicationTabContent";
import AdmissionsAccessGuard from "@/features/admissions/shared/components/AdmissionsAccessGuard";

export default async function ApplicationTestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdmissionsAccessGuard permission="admissions.applications.view">
      <AdmissionsAccessGuard permission="admissions.tests.view">
        <ApplicationTabContent applicationId={id} tab="tests" />
      </AdmissionsAccessGuard>
    </AdmissionsAccessGuard>
  );
}
