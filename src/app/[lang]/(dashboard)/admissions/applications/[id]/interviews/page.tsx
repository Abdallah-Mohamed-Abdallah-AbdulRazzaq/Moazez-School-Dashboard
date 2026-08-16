import ApplicationTabContent from "@/features/admissions/applications/components/ApplicationTabContent";
import AdmissionsAccessGuard from "@/features/admissions/shared/components/AdmissionsAccessGuard";

export default async function ApplicationInterviewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdmissionsAccessGuard permission="admissions.applications.view">
      <AdmissionsAccessGuard permission="admissions.interviews.view">
        <ApplicationTabContent applicationId={id} tab="interviews" />
      </AdmissionsAccessGuard>
    </AdmissionsAccessGuard>
  );
}
