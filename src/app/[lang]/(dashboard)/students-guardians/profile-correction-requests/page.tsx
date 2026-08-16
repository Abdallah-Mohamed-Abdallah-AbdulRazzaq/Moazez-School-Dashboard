import ProfileCorrectionRequestsQueuePage from "@/features/students-guardians/profile-correction-requests/pages/ProfileCorrectionRequestsQueuePage";
import StudentsGuardiansPermissionGuard from "@/features/students-guardians/shared/components/StudentsGuardiansPermissionGuard";

export default function StudentsGuardiansProfileCorrectionRequestsPage() {
  return (
    <main className="flex-1 min-w-0 overflow-x-hidden">
      <StudentsGuardiansPermissionGuard permissions={["students.records.view"]}>
        <ProfileCorrectionRequestsQueuePage />
      </StudentsGuardiansPermissionGuard>
    </main>
  );
}
