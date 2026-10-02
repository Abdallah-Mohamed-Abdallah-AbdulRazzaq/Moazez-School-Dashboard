import AcademicsPermissionGuard from "@/features/academics/components/AcademicsPermissionGuard";
import TimetableSetupPage from "@/features/academics/timetable/pages/TimetableSetupPage";

export default function Page() {
  return (
    <AcademicsPermissionGuard permission="academics.structure.view">
      <TimetableSetupPage />
    </AcademicsPermissionGuard>
  );
}
