import AcademicsPermissionGuard from "@/features/academics/components/AcademicsPermissionGuard";
import AcademicCalendarPage from "@/features/academics/calendar/pages/AcademicCalendarPage";

export default function CalendarPage() {
  return (
    <AcademicsPermissionGuard permission="academics.calendar.view">
      <AcademicCalendarPage />
    </AcademicsPermissionGuard>
  );
}
