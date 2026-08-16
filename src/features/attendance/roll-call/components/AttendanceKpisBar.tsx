"use client";

import { useTranslations } from "next-intl";
import { Users, CheckCircle, XCircle, Clock, FileCheck, LogOut, HelpCircle } from "lucide-react";
import type { AttendanceKPIs } from "../types";

interface AttendanceKpisBarProps {
  kpis: AttendanceKPIs;
}

export default function AttendanceKpisBar({ kpis }: AttendanceKpisBarProps) {
  const t = useTranslations("attendance.rollCall.kpis");

  const completionPct = kpis.completionPct;
  const markedCount = kpis.totalStudents - kpis.unmarkedCount;

  const statusChips = [
    {
      icon: CheckCircle,
      label: t("present"),
      value: kpis.presentCount,
      iconBg: "var(--color-primary-50)",
      iconColor: "var(--color-primary-700)",
    },
    {
      icon: XCircle,
      label: t("absent"),
      value: kpis.absentCount,
      iconBg: "var(--color-accent-50)",
      iconColor: "var(--color-accent-700)",
    },
    {
      icon: Clock,
      label: t("late"),
      value: kpis.lateCount,
      iconBg: "var(--color-accent-50)",
      iconColor: "var(--color-accent-700)",
    },
    {
      icon: FileCheck,
      label: t("excused"),
      value: kpis.excusedCount,
      iconBg: "var(--color-neutral-50)",
      iconColor: "var(--color-neutral-500)",
    },
    {
      icon: LogOut,
      label: t("earlyLeave"),
      value: kpis.earlyLeaveCount,
      iconBg: "var(--color-neutral-50)",
      iconColor: "var(--color-neutral-500)",
    },
    {
      icon: HelpCircle,
      label: t("unmarked"),
      value: kpis.unmarkedCount,
      iconBg: "var(--color-gray-100)",
      iconColor: "var(--color-gray-600)",
    },
    {
      icon: Users,
      label: t("total"),
      value: kpis.totalStudents,
      iconBg: "var(--color-gray-100)",
      iconColor: "var(--color-gray-600)",
    },
  ];

  return (
    <div
      className="rounded-2xl border shadow-sm p-4 mx-4 my-3"
      style={{
        backgroundColor: "var(--background)",
        borderColor: "var(--color-neutral-200)",
      }}
    >
      {/* Desktop & Tablet Layout */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Completion Block */}
        <div className="shrink-0 lg:w-64">
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-sm font-medium"
              style={{ color: "var(--color-gray-700)" }}
            >
              {t("completion")}
            </span>
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor:
                  completionPct === 100
                    ? "var(--color-primary-50)"
                    : completionPct >= 50
                    ? "var(--color-accent-50)"
                    : "var(--color-accent-100)",
                color:
                  completionPct === 100
                    ? "var(--color-primary-700)"
                    : completionPct >= 50
                    ? "var(--color-accent-700)"
                    : "var(--color-accent-800)",
              }}
            >
              {completionPct}%
            </span>
          </div>

          {/* Progress Bar */}
          <div
            className="h-2 rounded-full overflow-hidden mb-1"
            style={{ backgroundColor: "var(--color-gray-100)" }}
          >
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{
                width: `${completionPct}%`,
                backgroundColor: "var(--primary-color)",
              }}
            />
          </div>

          {/* Marked / Total */}
          <div className="text-xs" style={{ color: "var(--color-gray-600)" }}>
            {t("markedOutOfTotal", { marked: markedCount, total: kpis.totalStudents })}
          </div>
        </div>

        {/* Status Chips - Desktop: Single Row, Mobile: Wrap */}
        <div className="flex-1 overflow-x-auto lg:overflow-visible">
          <div className="flex flex-wrap gap-2 min-w-max lg:min-w-0">
            {statusChips.map((chip, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border"
                style={{
                  backgroundColor: "var(--color-gray-50)",
                  borderColor: "var(--color-neutral-200)",
                }}
              >
                {/* Icon Circle */}
                <div
                  className="flex items-center justify-center w-6 h-6 rounded-full shrink-0"
                  style={{ backgroundColor: chip.iconBg }}
                >
                  <chip.icon
                    className="w-3.5 h-3.5"
                    style={{ color: chip.iconColor }}
                  />
                </div>

                {/* Label & Value */}
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-xs whitespace-nowrap"
                    style={{ color: "var(--color-gray-600)" }}
                  >
                    {chip.label}
                  </span>
                  <span
                    className="text-sm font-bold whitespace-nowrap"
                    style={{ color: "var(--color-gray-900)" }}
                  >
                    {chip.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
