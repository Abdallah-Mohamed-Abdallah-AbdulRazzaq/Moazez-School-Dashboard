import AttendanceReportsPage from "@/features/attendance/reports/pages/AttendanceReportsPage";
import AttendancePermissionGuard from "@/features/attendance/shared/components/AttendancePermissionGuard";

export default function ReportsPageRoute() {
  return <AttendancePermissionGuard permission="attendance.reports.view"><AttendanceReportsPage /></AttendancePermissionGuard>;
}
