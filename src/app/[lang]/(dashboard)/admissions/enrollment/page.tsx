// FILE: src/app/[lang]/admissions/enrollment/page.tsx

import EnrollmentList from "@/features/admissions/enrollment/pages/EnrollmentList";
import AdmissionsAccessGuard from "@/features/admissions/shared/components/AdmissionsAccessGuard";

export default function EnrollmentPage() {
  return (
    <AdmissionsAccessGuard permission="students.enrollments.view">
      <AdmissionsAccessGuard permission="academics.structure.view">
        <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
          <EnrollmentList />
        </main>
      </AdmissionsAccessGuard>
    </AdmissionsAccessGuard>
  );
}
