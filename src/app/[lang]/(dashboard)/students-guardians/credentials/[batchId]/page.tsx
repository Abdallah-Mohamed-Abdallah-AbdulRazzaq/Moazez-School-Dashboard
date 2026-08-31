import CredentialBatchPage from "@/features/students-guardians/credentials/pages/CredentialBatchPage";
import StudentsGuardiansPermissionGuard from "@/features/students-guardians/shared/components/StudentsGuardiansPermissionGuard";

export default async function StudentCredentialBatchRoute({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;

  return (
    <main className="min-w-0 flex-1 overflow-x-hidden">
      <StudentsGuardiansPermissionGuard
        permissions={["students.records.view", "settings.users.view"]}
      >
        <CredentialBatchPage batchId={batchId} />
      </StudentsGuardiansPermissionGuard>
    </main>
  );
}
