// FILE: src/app/[lang]/admissions/applications/page.tsx

import ApplicationsList from "@/features/admissions/applications/pages/ApplicationsList";
import AdmissionsAccessGuard from "@/features/admissions/shared/components/AdmissionsAccessGuard";

export default function ApplicationsPage() {
  return (
    <AdmissionsAccessGuard permission="admissions.applications.view">
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <ApplicationsList />
      </main>
    </AdmissionsAccessGuard>
  );
}
