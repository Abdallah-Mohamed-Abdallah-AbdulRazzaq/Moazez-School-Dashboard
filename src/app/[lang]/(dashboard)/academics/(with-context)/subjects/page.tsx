import AcademicsPermissionGuard from "@/features/academics/components/AcademicsPermissionGuard";
import SubjectsAllocationPage from "@/features/academics/subjects/pages/SubjectsAllocationPage";

export default function Page() {
  return (
    <AcademicsPermissionGuard permission="academics.subjects.view">
      <SubjectsAllocationPage />
    </AcademicsPermissionGuard>
  );
}
