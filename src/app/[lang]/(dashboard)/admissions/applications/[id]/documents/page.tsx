import ApplicationTabContent from "@/features/admissions/applications/components/ApplicationTabContent";
import AdmissionsAccessGuard from "@/features/admissions/shared/components/AdmissionsAccessGuard";

export default async function ApplicationDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdmissionsAccessGuard permission="admissions.applications.view">
      <AdmissionsAccessGuard permission="admissions.documents.view">
        <ApplicationTabContent applicationId={id} tab="documents" />
      </AdmissionsAccessGuard>
    </AdmissionsAccessGuard>
  );
}
