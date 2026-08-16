"use client";

import { useTranslations } from "next-intl";
import { getAttendanceStatusStyle } from "@/features/attendance/shared/statusStyles";
import type { AttendanceStatus } from "../types";

interface AttendanceStatusPillProps {
  status: AttendanceStatus | null;
  size?: "sm" | "md";
}

export default function AttendanceStatusPill({ status, size = "md" }: AttendanceStatusPillProps) {
  const t = useTranslations("attendance.rollCall.status");

  if (!status) {
    return (
      <span
        style={{
          backgroundColor: "var(--color-neutral-100)",
          color: "var(--color-neutral-600)",
        }}
        className={`inline-flex items-center justify-center rounded ${
          size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
        } font-medium`}
      >
        —
      </span>
    );
  }

  const styleConfig = getAttendanceStatusStyle(status);

  const labels: Record<AttendanceStatus, string> = {
    PRESENT: t("present"),
    ABSENT: t("absent"),
    LATE: t("late"),
    EXCUSED: t("excused"),
    EARLY_LEAVE: t("earlyLeave"),
    UNMARKED: t("unmarked"),
  };

  return (
    <span
      style={{
        backgroundColor: styleConfig.bg,
        color: styleConfig.fg,
        borderColor: styleConfig.border,
      }}
      className={`inline-flex items-center justify-center rounded border ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      } font-medium`}
    >
      {labels[status]}
    </span>
  );
}
