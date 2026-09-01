import BulkRegistrationBatchPage from "@/features/students-guardians/bulk-registration/pages/BulkRegistrationBatchPage";
import StudentsGuardiansPermissionGuard from "@/features/students-guardians/shared/components/StudentsGuardiansPermissionGuard";

export default async function StudentsBulkRegistrationBatchRoute({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;

  return (
    <main className="min-w-0 flex-1 overflow-x-hidden">
      <StudentsGuardiansPermissionGuard
        permissions={[
          "students.records.manage",
          "students.enrollments.manage",
        ]}
      >
        <BulkRegistrationBatchPage batchId={batchId} />
      </StudentsGuardiansPermissionGuard>
    </main>
  );
}
