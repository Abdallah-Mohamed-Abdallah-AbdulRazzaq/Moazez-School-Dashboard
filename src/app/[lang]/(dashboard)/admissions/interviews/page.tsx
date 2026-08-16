// FILE: src/app/[lang]/admissions/interviews/page.tsx

import InterviewsList from "@/features/admissions/interviews/pages/InterviewsList";
import AdmissionsAccessGuard from "@/features/admissions/shared/components/AdmissionsAccessGuard";

export default function InterviewsPage() {
  return (
    <AdmissionsAccessGuard permission="admissions.interviews.view">
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <InterviewsList />
      </main>
    </AdmissionsAccessGuard>
  );
}
