import AttendanceRollCallPage from "@/features/attendance/roll-call/pages/AttendanceRollCallPage";
import AttendancePermissionGuard from "@/features/attendance/shared/components/AttendancePermissionGuard";

export default function RollCallPage() {
  return (
    <AttendancePermissionGuard permission="attendance.sessions.view">
      <AttendancePermissionGuard permission="attendance.policies.view">
        <AttendancePermissionGuard permission="academics.structure.view">
          <AttendanceRollCallPage />
        </AttendancePermissionGuard>
      </AttendancePermissionGuard>
    </AttendancePermissionGuard>
  );
}
