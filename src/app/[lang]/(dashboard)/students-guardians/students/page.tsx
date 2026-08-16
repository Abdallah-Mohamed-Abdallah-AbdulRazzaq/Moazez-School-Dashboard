// FILE: src/app/[lang]/students-guardians/students/page.tsx

import StudentsList from "@/features/students-guardians/students/pages/StudentsList";
import StudentsGuardiansPermissionGuard from "@/features/students-guardians/shared/components/StudentsGuardiansPermissionGuard";

// Students list page
export default function StudentsListPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <StudentsGuardiansPermissionGuard permissions={["students.records.view"]}>
        <StudentsList />
      </StudentsGuardiansPermissionGuard>
    </main>
  );
}
