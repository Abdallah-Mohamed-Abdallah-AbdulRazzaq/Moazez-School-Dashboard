import AttendancePoliciesPage from "@/features/attendance/policies/pages/AttendancePoliciesPage";
import AttendancePermissionGuard from "@/features/attendance/shared/components/AttendancePermissionGuard";

export default function PoliciesPage() {
  return <AttendancePermissionGuard permission="attendance.policies.view"><AttendancePoliciesPage /></AttendancePermissionGuard>;
}
