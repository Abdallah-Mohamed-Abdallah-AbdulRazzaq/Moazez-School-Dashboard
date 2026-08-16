"use client";

import type {
  EmailDeliveryStatus,
  EmailRecipientStatus,
} from "@/features/settings/email/deliveries/types";

type DeliveryStatusBadgeProps = {
  status: EmailDeliveryStatus | EmailRecipientStatus;
  label: string;
};

const statusClasses: Record<EmailDeliveryStatus | EmailRecipientStatus, string> = {
  DRAFT: "border-gray-200 bg-gray-50 text-gray-700",
  PENDING: "border-gray-200 bg-gray-50 text-gray-700",
  QUEUED: "border-blue-200 bg-blue-50 text-blue-700",
  SENDING: "border-indigo-200 bg-indigo-50 text-indigo-700",
  PROCESSING: "border-indigo-200 bg-indigo-50 text-indigo-700",
  SUCCEEDED: "border-green-200 bg-green-50 text-green-700",
  PARTIAL_FAILED: "border-amber-200 bg-amber-50 text-amber-700",
  FAILED: "border-red-200 bg-red-50 text-red-700",
  CANCELLED: "border-gray-200 bg-gray-100 text-gray-700",
  SENT: "border-green-200 bg-green-50 text-green-700",
  SKIPPED: "border-amber-200 bg-amber-50 text-amber-700",
};

export default function DeliveryStatusBadge({
  status,
  label,
}: DeliveryStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        statusClasses[status] || "border-gray-200 bg-gray-50 text-gray-700"
      }`}
    >
      {label}
    </span>
  );
}
