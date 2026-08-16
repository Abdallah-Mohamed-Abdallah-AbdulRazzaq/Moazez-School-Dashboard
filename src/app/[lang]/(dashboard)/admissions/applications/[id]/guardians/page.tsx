import ApplicationTabContent from "@/features/admissions/applications/components/ApplicationTabContent";
import AdmissionsAccessGuard from "@/features/admissions/shared/components/AdmissionsAccessGuard";

export default async function ApplicationGuardiansPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdmissionsAccessGuard permission="admissions.applications.view">
      <AdmissionsAccessGuard permission="admissions.applications.manage">
        <ApplicationTabContent applicationId={id} tab="guardians" />
      </AdmissionsAccessGuard>
    </AdmissionsAccessGuard>
  );
}
