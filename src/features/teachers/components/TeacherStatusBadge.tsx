import type {
  MembershipStatus,
  TeacherEmploymentStatus,
  UserStatus,
} from "@/features/teachers/types/index";

type Status = MembershipStatus | TeacherEmploymentStatus | UserStatus;

const colorByStatus: Record<Status, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-amber-100 text-amber-700",
  TERMINATED: "bg-red-100 text-red-700",
  INVITED: "bg-blue-100 text-blue-700",
  SUSPENDED: "bg-amber-100 text-amber-700",
  DISABLED: "bg-gray-100 text-gray-600",
  TRANSFERRED: "bg-blue-100 text-blue-700",
};

export default function TeacherStatusBadge({
  status,
  label,
}: {
  status: Status;
  label: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colorByStatus[status]}`}
    >
      {label}
    </span>
  );
}
