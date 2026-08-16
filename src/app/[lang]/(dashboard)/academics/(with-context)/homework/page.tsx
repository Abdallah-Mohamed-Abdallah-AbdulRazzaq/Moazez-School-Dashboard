import AcademicsPermissionGuard from "@/features/academics/components/AcademicsPermissionGuard";
import HomeworkListPage from "@/features/academics/homework/pages/HomeworkListPage";

export default function Page() {
  return (
    <AcademicsPermissionGuard permission="homework.assignments.view">
      <HomeworkListPage />
    </AcademicsPermissionGuard>
  );
}
