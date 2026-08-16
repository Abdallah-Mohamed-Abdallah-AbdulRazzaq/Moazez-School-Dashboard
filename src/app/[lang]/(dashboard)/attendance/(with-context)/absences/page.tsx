import AttendanceAbsencesPage from "@/features/attendance/absences/pages/AttendanceAbsencesPage";
import AttendancePermissionGuard from "@/features/attendance/shared/components/AttendancePermissionGuard";

export default function AbsencesPage() {
  return (
    <AttendancePermissionGuard permission="attendance.absences.view">
      <AttendancePermissionGuard permission="attendance.policies.view">
        <AttendancePermissionGuard permission="academics.structure.view">
          <AttendanceAbsencesPage />
        </AttendancePermissionGuard>
      </AttendancePermissionGuard>
    </AttendancePermissionGuard>
  );
}
