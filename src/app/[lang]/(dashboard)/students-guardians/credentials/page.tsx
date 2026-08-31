import CredentialsStartPage from "@/features/students-guardians/credentials/pages/CredentialsStartPage";
import StudentsGuardiansPermissionGuard from "@/features/students-guardians/shared/components/StudentsGuardiansPermissionGuard";

export default function StudentCredentialsPage() {
  return (
    <main className="min-w-0 flex-1 overflow-x-hidden">
      <StudentsGuardiansPermissionGuard
        permissions={["students.records.view", "settings.users.view"]}
      >
        <CredentialsStartPage />
      </StudentsGuardiansPermissionGuard>
    </main>
  );
}
