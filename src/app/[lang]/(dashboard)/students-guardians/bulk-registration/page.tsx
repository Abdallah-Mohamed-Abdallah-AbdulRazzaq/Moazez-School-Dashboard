import BulkRegistrationStartPage from "@/features/students-guardians/bulk-registration/pages/BulkRegistrationStartPage";
import StudentsGuardiansPermissionGuard from "@/features/students-guardians/shared/components/StudentsGuardiansPermissionGuard";

export default function StudentsBulkRegistrationPage() {
  return (
    <main className="min-w-0 flex-1 overflow-x-hidden">
      <StudentsGuardiansPermissionGuard
        permissions={[
          "students.records.manage",
          "students.enrollments.manage",
        ]}
      >
        <BulkRegistrationStartPage />
      </StudentsGuardiansPermissionGuard>
    </main>
  );
}
