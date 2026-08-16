import AcademicsPermissionGuard from "@/features/academics/components/AcademicsPermissionGuard";
import AcademicStructurePage from "@/features/academics/academic-structure-tree/pages/AcademicStructurePage";

export default function Page() {
  return (
    <AcademicsPermissionGuard permission="academics.structure.view">
      <AcademicStructurePage />
    </AcademicsPermissionGuard>
  );
}
