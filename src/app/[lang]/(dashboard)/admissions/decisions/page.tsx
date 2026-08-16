// FILE: src/app/[lang]/admissions/decisions/page.tsx

import DecisionsList from "@/features/admissions/decisions/pages/DecisionsList";
import AdmissionsAccessGuard from "@/features/admissions/shared/components/AdmissionsAccessGuard";

export default function DecisionsPage() {
  return (
    <AdmissionsAccessGuard permission="admissions.decisions.view">
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <DecisionsList />
      </main>
    </AdmissionsAccessGuard>
  );
}
