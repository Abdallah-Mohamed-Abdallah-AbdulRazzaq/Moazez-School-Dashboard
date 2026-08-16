import AcademicsPermissionGuard from "@/features/academics/components/AcademicsPermissionGuard";
import TeacherAllocationPage from "@/features/academics/teacher-allocation/pages/TeacherAllocationPage";

export default function Page() {
  return (
    <AcademicsPermissionGuard permission="academics.structure.view">
      <TeacherAllocationPage />
    </AcademicsPermissionGuard>
  );
}
