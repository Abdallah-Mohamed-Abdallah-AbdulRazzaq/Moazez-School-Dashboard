import AttendanceExcusesPage from "@/features/attendance/excuses/pages/AttendanceExcusesPage";
import AttendancePermissionGuard from "@/features/attendance/shared/components/AttendancePermissionGuard";

export default function Page() {
  return <AttendancePermissionGuard permission="attendance.excuses.view"><AttendanceExcusesPage /></AttendancePermissionGuard>;
}
