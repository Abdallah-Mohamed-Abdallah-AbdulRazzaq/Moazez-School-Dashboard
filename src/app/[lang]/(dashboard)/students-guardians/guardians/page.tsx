// FILE: src/app/[lang]/students-guardians/guardians/page.tsx

import GuardiansList from "@/features/students-guardians/guardians/pages/GuardiansList";
import StudentsGuardiansPermissionGuard from "@/features/students-guardians/shared/components/StudentsGuardiansPermissionGuard";

// Guardians list page
export default function GuardiansListPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <StudentsGuardiansPermissionGuard permissions={["students.guardians.view"]}>
        <GuardiansList />
      </StudentsGuardiansPermissionGuard>
    </main>
  );
}
