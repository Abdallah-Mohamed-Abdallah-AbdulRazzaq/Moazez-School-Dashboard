// FILE: src/app/[lang]/admissions/leads/page.tsx

import LeadsList from "@/features/admissions/leads/pages/LeadsList";
import AdmissionsAccessGuard from "@/features/admissions/shared/components/AdmissionsAccessGuard";

export default function LeadsPage() {
  return (
    <AdmissionsAccessGuard permission="admissions.leads.view">
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <LeadsList />
      </main>
    </AdmissionsAccessGuard>
  );
}
