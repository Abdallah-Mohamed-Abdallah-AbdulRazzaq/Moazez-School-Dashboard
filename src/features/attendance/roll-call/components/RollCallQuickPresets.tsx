"use client";

import { useTranslations } from "next-intl";
import type { AttendanceStatus } from "../types";

interface RollCallQuickPresetsProps {
  selectedStatus: "ALL" | AttendanceStatus | "UNMARKED";
  onSelect: (status: "ALL" | AttendanceStatus | "UNMARKED") => void;
}

export default function RollCallQuickPresets({
  selectedStatus,
  onSelect,
}: RollCallQuickPresetsProps) {
  const t = useTranslations("attendance.rollCall.filters");

  const presets: Array<{
    value: "ALL" | AttendanceStatus | "UNMARKED";
    label: string;
    disabled?: boolean;
    tooltip?: string;
  }> = [
    { value: "ALL", label: t("preset.all") },
    { value: "UNMARKED", label: t("preset.unmarked") },
    { value: "ABSENT", label: t("preset.absent") },
    { value: "LATE", label: t("preset.late") },
    { value: "EXCUSED", label: t("preset.excused") },
    { value: "EARLY_LEAVE", label: t("preset.earlyLeave") },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span style={{ color: "var(--color-gray-700)" }} className="text-sm font-medium">{t("presetsTitle")}:</span>
      {presets.map((preset) => {
        const isSelected = selectedStatus === preset.value;
        const button = (
          <button
            key={preset.value}
            onClick={() => !preset.disabled && onSelect(preset.value)}
            disabled={preset.disabled}
            style={{
              backgroundColor: isSelected 
                ? "var(--color-primary)" 
                : preset.disabled 
                  ? "var(--color-neutral-100)" 
                  : "var(--background)",
              color: isSelected 
                ? "var(--color-white)" 
                : preset.disabled 
                  ? "var(--color-neutral-400)" 
                  : "var(--color-gray-700)",
              borderColor: isSelected 
                ? "var(--color-primary)" 
                : preset.disabled 
                  ? "var(--color-neutral-200)" 
                  : "var(--color-neutral-300)",
            }}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
              !preset.disabled && !isSelected ? "hover:bg-[var(--color-neutral-50)] hover:border-[var(--color-neutral-400)]" : ""
            } ${preset.disabled ? "cursor-not-allowed" : ""}`}
          >
            {preset.label}
          </button>
        );

        return button;
      })}
    </div>
  );
}
