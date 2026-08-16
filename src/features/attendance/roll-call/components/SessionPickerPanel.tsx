"use client";

import { useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Calendar, ChevronLeft, ChevronRight, Info } from "lucide-react";
import DatePicker from "@/components/ui/input/DatePicker";
import Button from "@/components/ui/button/Button";
import ScopePicker from "@/features/attendance/policies/components/ScopePicker";
import type { AttendanceScopeType } from "@/features/attendance/policies/types";
import type {
  Stage,
  Grade,
  Section,
  Classroom,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type { TimetablePeriod } from "@/features/academics/timetable/types/timetableConfig";
import { getSessionStatusStyle } from "@/features/attendance/shared/statusStyles";
import type { AttendanceScopeIds } from "@/features/attendance/shared/attendanceScope";
import {
  formatLocalDate,
  isTimetableDateActive,
  parseLocalDate,
} from "../utils/localDate";

import type { AttendanceSessionMode, AttendanceSessionStatus } from "../types";

interface SessionPickerPanelProps {
  variant?: "rail" | "drawer";

  // Scope
  scopeType: AttendanceScopeType;
  scopeIds: AttendanceScopeIds;
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  onScopeChange: (scopeType: AttendanceScopeType) => void;
  onScopeIdsChange: (scopeIds: AttendanceScopeIds) => void;

  // Date
  date: string;
  onDateChange: (date: string) => void;
  termStartDate: string;
  termEndDate: string;
  activeDayIndexes?: number[];

  // Mode & Period
  mode: AttendanceSessionMode;
  isDailyDerivedFromPeriods?: boolean;
  periods: TimetablePeriod[];
  periodStatuses?: Record<string, AttendanceSessionStatus>;
  selectedPeriodId: string | null;
  onPeriodChange: (periodId: string) => void;

  // Session status
  sessionStatus: "DRAFT" | "SUBMITTED" | null;
  canReopenForEdit: boolean;
  onReopenForEdit: () => void;
  lockSessionContext?: boolean;

  // Disabled
  disabled?: boolean;
}

export default function SessionPickerPanel({
  variant = "rail",
  scopeType,
  scopeIds,
  stages,
  grades,
  sections,
  classrooms,
  onScopeChange,
  onScopeIdsChange,
  date,
  onDateChange,
  termStartDate,
  termEndDate,
  activeDayIndexes,
  mode,
  isDailyDerivedFromPeriods = false,
  periods,
  periodStatuses = {},
  selectedPeriodId,
  onPeriodChange,
  sessionStatus,
  canReopenForEdit,
  onReopenForEdit,
  lockSessionContext = false,
  disabled = false,
}: SessionPickerPanelProps) {
  const t = useTranslations("attendance.rollCall");
  const tStatus = useTranslations("attendance.rollCall.sessionStatus");
  const locale = useLocale();
  const ignoreNextScopeIdsReset = useRef(false);
  const frameClassName =
    variant === "rail"
      ? "flex h-full w-full flex-col rounded-lg border border-border bg-[var(--background)]"
      : "flex h-full w-full flex-col bg-[var(--background)]";
  const submittedPeriodCount = periods.filter(
    (period) => periodStatuses[period.id] === "SUBMITTED",
  ).length;
  const allDerivedPeriodsSubmitted =
    periods.length > 0 && submittedPeriodCount === periods.length;

  const handlePrevPeriod = () => {
    if (!selectedPeriodId) return;
    const currentIdx = periods.findIndex((p) => p.id === selectedPeriodId);
    if (currentIdx <= 0) return;
    onPeriodChange(periods[currentIdx - 1].id);
  };

  const handleNextPeriod = () => {
    if (!selectedPeriodId) return;
    const currentIdx = periods.findIndex((p) => p.id === selectedPeriodId);
    if (currentIdx < 0 || currentIdx >= periods.length - 1) return;
    onPeriodChange(periods[currentIdx + 1].id);
  };

  return (
    <div className={frameClassName}>
      {/* Header */}
      <div
        style={{ borderBottom: "1px solid var(--color-border)" }}
        className="p-4"
      >
        <h3
          style={{ color: "var(--color-gray-900)" }}
          className="text-lg font-semibold"
        >
          {t("sessionPicker.title")}
        </h3>
        <p style={{ color: "var(--color-gray-600)" }} className="text-sm mt-1">
          {t("sessionPicker.subtitle")}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {sessionStatus === "SUBMITTED" && (
          <div
            role="status"
            style={{
              backgroundColor: "var(--color-primary-50)",
              borderColor: "var(--color-primary-200)",
              color: "var(--color-primary-800)",
            }}
            className="rounded border p-3"
          >
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {t("sessionPicker.submittedLockTitle")}
                </p>
                <p className="mt-1 text-sm">
                  {lockSessionContext && mode === "PERIOD"
                    ? t("sessionPicker.submittedPeriodLockDescription")
                    : t("sessionPicker.submittedLockDescription")}
                </p>
                {canReopenForEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onReopenForEdit}
                    className="mt-3"
                  >
                    {t("sessionPicker.reopenForEdit")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scope Picker */}
        <div>
          <h4
            style={{ color: "var(--color-gray-700)" }}
            className="text-sm font-medium mb-3"
          >
            {t("sessionPicker.scope")}
          </h4>
          <ScopePicker
            scopeType={scopeType}
            scopeIds={scopeIds}
            stages={stages}
            grades={grades}
            sections={sections}
            classrooms={classrooms}
            onScopeTypeChange={(nextScopeType) => {
              ignoreNextScopeIdsReset.current = true;
              onScopeChange(nextScopeType);
            }}
            onScopeIdsChange={(nextScopeIds) => {
              if (
                ignoreNextScopeIdsReset.current &&
                Object.keys(nextScopeIds).length === 0
              ) {
                ignoreNextScopeIdsReset.current = false;
                return;
              }
              ignoreNextScopeIdsReset.current = false;
              onScopeIdsChange(nextScopeIds);
            }}
            disabled={disabled || lockSessionContext}
          />
        </div>

        {/* Date Picker */}
        <div>
          <h4
            style={{ color: "var(--color-gray-700)" }}
            className="text-sm font-medium mb-3"
          >
            {t("sessionPicker.date")}
          </h4>
          <DatePicker
            value={date ? parseLocalDate(date) : null}
            onChange={(newDate) =>
              onDateChange(newDate ? formatLocalDate(newDate) : "")
            }
            minDate={termStartDate ? parseLocalDate(termStartDate) : undefined}
            maxDate={termEndDate ? parseLocalDate(termEndDate) : undefined}
            shouldDisableDate={
              activeDayIndexes
                ? (candidate) => !isTimetableDateActive(candidate, activeDayIndexes)
                : undefined
            }
            disabled={disabled || lockSessionContext}
          />
        </div>

        {/* Mode & Period Selection */}
        {mode === "PERIOD" && periods.length > 0 && (
          <div>
            {isDailyDerivedFromPeriods && (
              <div
                role="status"
                style={{
                  backgroundColor: "var(--color-primary-50)",
                  borderColor: "var(--color-primary-200)",
                  color: "var(--color-primary-800)",
                }}
                className="mb-4 rounded border p-3 text-sm"
              >
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div>
                    <p>{t("sessionPicker.derivedDailyFromPeriods")}</p>
                    <p className="mt-1 font-medium">
                      {allDerivedPeriodsSubmitted
                        ? t("sessionPicker.derivedDailyReady")
                        : t("sessionPicker.derivedDailyProgress", {
                            submitted: submittedPeriodCount,
                            total: periods.length,
                          })}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <h4
              style={{ color: "var(--color-gray-700)" }}
              className="text-sm font-medium mb-3"
            >
              {t("sessionPicker.period")}
            </h4>

            {/* Period Navigation */}
            <div className="flex items-center gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPeriod}
                disabled={
                  disabled ||
                  !selectedPeriodId ||
                  periods.findIndex((p) => p.id === selectedPeriodId) <= 0
                }
                leftIcon={
                  locale === "ar" ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronLeft className="w-4 h-4" />
                  )
                }
              >
                {t("sessionPicker.prev")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPeriod}
                disabled={
                  disabled ||
                  !selectedPeriodId ||
                  periods.findIndex((p) => p.id === selectedPeriodId) >=
                    periods.length - 1
                }
                rightIcon={
                  locale === "ar" ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )
                }
              >
                {t("sessionPicker.next")}
              </Button>
            </div>

            {/* Period List */}
            <div className="space-y-2">
              {periods.map((period) => {
                const isSelected = selectedPeriodId === period.id;
                const periodStatus = periodStatuses[period.id];
                return (
                  <button
                    key={period.id}
                    onClick={() => onPeriodChange(period.id)}
                    disabled={disabled}
                    aria-pressed={isSelected}
                    style={{
                      backgroundColor: isSelected
                        ? "var(--color-primary)"
                        : "var(--background)",
                      color: isSelected
                        ? "var(--color-white)"
                        : "var(--color-gray-700)",
                      borderColor: isSelected
                        ? "var(--color-primary)"
                        : "var(--color-neutral-300)",
                    }}
                    className={`w-full text-left px-3 py-2 rounded border transition-colors ${
                      isSelected ? "" : "hover:bg-[var(--color-neutral-50)]"
                    } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                  >
                    <div
                      className={`font-medium ${locale === "ar" ? "text-right" : "text-left"}`}
                    >
                      {locale === "ar" ? period.nameAr : period.nameEn}
                    </div>
                    {periodStatus && (
                      <span
                        style={{
                          backgroundColor: getSessionStatusStyle(periodStatus).bg,
                          color: getSessionStatusStyle(periodStatus).fg,
                        }}
                        className="mt-1 inline-flex rounded px-2 py-0.5 text-xs font-medium"
                      >
                        {tStatus(periodStatus.toLowerCase())}
                      </span>
                    )}
                    {period.startTime && period.endTime && (
                      <div className="text-xs mt-1 opacity-80">
                        {period.startTime} - {period.endTime}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Daily Mode Indicator */}
        {mode === "DAILY" && (
          <div
            style={{
              backgroundColor: "var(--color-primary-50)",
              borderColor: "var(--color-primary-200)",
            }}
            className="p-3 border rounded"
          >
            <div
              style={{ color: "var(--color-primary-800)" }}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">
                {t("sessionPicker.dailyMode")}
              </span>
            </div>
          </div>
        )}

        {/* Session Status */}
        {sessionStatus && (
          <div>
            <h4
              style={{ color: "var(--color-gray-700)" }}
              className="text-sm font-medium mb-2"
            >
              {t("sessionPicker.status")}
            </h4>
            <span
              style={{
                backgroundColor: getSessionStatusStyle(sessionStatus).bg,
                color: getSessionStatusStyle(sessionStatus).fg,
              }}
              className="inline-flex px-3 py-1 text-sm font-medium rounded"
            >
              {tStatus(sessionStatus.toLowerCase())}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
