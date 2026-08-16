// FILE: src/app/[lang]/admissions/tests/page.tsx

import TestsList from "@/features/admissions/tests/pages/TestsList";
import AdmissionsAccessGuard from "@/features/admissions/shared/components/AdmissionsAccessGuard";

export default function TestsPage() {
  return (
    <AdmissionsAccessGuard permission="admissions.tests.view">
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <TestsList />
      </main>
    </AdmissionsAccessGuard>
  );
}
