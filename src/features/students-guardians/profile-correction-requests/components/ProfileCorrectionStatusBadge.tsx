import type { ProfileCorrectionRequestStatus } from "@/features/students-guardians/profile-correction-requests/types/profileCorrectionRequests";

const statusClasses: Record<ProfileCorrectionRequestStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  CANCELLED: "border-gray-200 bg-gray-100 text-gray-600",
};

interface ProfileCorrectionStatusBadgeProps {
  status: ProfileCorrectionRequestStatus;
  label: string;
}

export default function ProfileCorrectionStatusBadge({
  status,
  label,
}: ProfileCorrectionStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}
    >
      {label}
    </span>
  );
}
