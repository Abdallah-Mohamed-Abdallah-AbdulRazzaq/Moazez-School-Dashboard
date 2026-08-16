import AttendanceLateEarlyPage from "@/features/attendance/late-early/pages/AttendanceLateEarlyPage";
import AttendancePermissionGuard from "@/features/attendance/shared/components/AttendancePermissionGuard";

export default function Page() {
  return <AttendancePermissionGuard permission="attendance.absences.view"><AttendanceLateEarlyPage /></AttendancePermissionGuard>;
}
