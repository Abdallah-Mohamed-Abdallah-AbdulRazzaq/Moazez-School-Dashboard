import AcademicsPermissionGuard from "@/features/academics/components/AcademicsPermissionGuard";
import CurriculumPageContent from "@/features/academics/curriculum/pages/CurriculumPageContent";

export default function Page() {
  return (
    <AcademicsPermissionGuard permission="academics.curriculum.view">
      <CurriculumPageContent view="overview" />
    </AcademicsPermissionGuard>
  );
}
