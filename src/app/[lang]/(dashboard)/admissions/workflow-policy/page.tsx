import AdmissionsWorkflowPolicyPage from "@/features/admissions/workflow-policy/pages/AdmissionsWorkflowPolicyPage";
import AdmissionsAccessGuard from "@/features/admissions/shared/components/AdmissionsAccessGuard";

export default function AdmissionsWorkflowPolicyRoute() {
  return (
    <AdmissionsAccessGuard permission="admissions.applications.view">
      <AdmissionsWorkflowPolicyPage />
    </AdmissionsAccessGuard>
  );
}
