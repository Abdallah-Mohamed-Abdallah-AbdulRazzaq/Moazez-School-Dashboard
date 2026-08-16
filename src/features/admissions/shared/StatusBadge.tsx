// FILE: src/components/admissions/StatusBadge.tsx

import React from "react";
import { useTranslations } from "next-intl";
import {
  ApplicationStatus,
  DocumentStatus,
  TestStatus,
  InterviewStatus,
  LeadStatus,
} from "@/features/admissions/types/admissions";

type Status =
  | ApplicationStatus
  | DocumentStatus
  | TestStatus
  | InterviewStatus
  | LeadStatus;

interface StatusBadgeProps {
  status: Status | string;
  size?: "sm" | "md";
}

interface BadgeConfig {
  className: string;
  translationKey: string;
}

const statusBadgeConfig: Record<Status, BadgeConfig> = {
  // Lead statuses
  New: { className: "bg-blue-100 text-blue-700", translationKey: "new" },
  Contacted: {
    className: "bg-purple-100 text-purple-700",
    translationKey: "contacted",
  },
  Converted: {
    className: "bg-green-100 text-green-700",
    translationKey: "converted",
  },
  Closed: { className: "bg-gray-100 text-gray-700", translationKey: "closed" },

  // Application statuses
  submitted: {
    className: "bg-blue-100 text-blue-700",
    translationKey: "submitted",
  },
  documents_pending: {
    className: "bg-amber-100 text-amber-700",
    translationKey: "documents_pending",
  },
  under_review: {
    className: "bg-purple-100 text-purple-700",
    translationKey: "under_review",
  },
  accepted: {
    className: "bg-emerald-100 text-emerald-700",
    translationKey: "accepted",
  },
  waitlisted: {
    className: "bg-amber-100 text-amber-700",
    translationKey: "waitlisted",
  },
  rejected: { className: "bg-red-100 text-red-700", translationKey: "rejected" },

  // Document statuses
  pending_review: {
    className: "bg-amber-100 text-amber-800 border-amber-200",
    translationKey: "pending_review",
  },
  complete: {
    className: "bg-green-100 text-green-800 border-green-200",
    translationKey: "complete",
  },
  missing: {
    className: "bg-red-100 text-red-800 border-red-200",
    translationKey: "missing",
  },

  // Test/Interview statuses
  scheduled: {
    className: "bg-blue-100 text-blue-700",
    translationKey: "scheduled",
  },
  completed: {
    className: "bg-green-100 text-green-700",
    translationKey: "completed",
  },
  cancelled: {
    className: "bg-red-100 text-red-700",
    translationKey: "cancelled",
  },
  rescheduled: {
    className: "bg-orange-100 text-orange-700",
    translationKey: "rescheduled",
  },
  failed: { className: "bg-red-100 text-red-700", translationKey: "failed" },
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const t = useTranslations("admissions.status_badge");
  const badgeConfig = statusBadgeConfig[status as Status];
  const colorClass =
    badgeConfig?.className || "bg-gray-100 text-gray-700 border-gray-200";
  const sizeClass = size === "sm" ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5";
  const label = badgeConfig ? t(badgeConfig.translationKey) : status || "Unknown";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${colorClass} ${sizeClass}`}
    >
      {label}
    </span>
  );
}
