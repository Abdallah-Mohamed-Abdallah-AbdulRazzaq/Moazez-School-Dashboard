import AcademicsPermissionGuard from "@/features/academics/components/AcademicsPermissionGuard";
import CreateHomeworkPage from "@/features/academics/homework/pages/CreateHomeworkPage";

export default function Page() {
  return (
    <AcademicsPermissionGuard permission="homework.assignments.manage">
      <CreateHomeworkPage />
    </AcademicsPermissionGuard>
  );
}
