import RegistrationWizardPage from "@/features/students-guardians/registration/pages/RegistrationWizardPage";
import StudentsGuardiansPermissionGuard from "@/features/students-guardians/shared/components/StudentsGuardiansPermissionGuard";

export default function StudentsGuardiansRegistrationPage() {
  return (
    <main className="flex-1 min-w-0 overflow-x-hidden">
      <StudentsGuardiansPermissionGuard
        permissions={[
          "students.records.manage",
          "students.guardians.manage",
          "students.enrollments.manage",
        ]}
      >
        <RegistrationWizardPage />
      </StudentsGuardiansPermissionGuard>
    </main>
  );
}
