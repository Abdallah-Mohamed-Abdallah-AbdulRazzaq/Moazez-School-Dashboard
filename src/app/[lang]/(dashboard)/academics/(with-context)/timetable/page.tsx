import AcademicsPermissionGuard from "@/features/academics/components/AcademicsPermissionGuard";
import TimetablePage from "@/features/academics/timetable/pages/TimetablePageContent";

export default function Page() {
  return (
    <AcademicsPermissionGuard permission="academics.structure.view">
      <TimetablePage />
    </AcademicsPermissionGuard>
  );
}
