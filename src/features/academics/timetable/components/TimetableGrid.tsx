"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Coffee,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import {
  TimetableEntry,
  TimetableConflict,
} from "@/features/academics/timetable/types/timetable";
import { Subject } from "@/features/academics/subjects/services/subjectsService";
import { Teacher } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { Room } from "@/features/academics/timetable/types/timetable";
import { ResolvedTimetableConfig } from "@/features/academics/timetable/types/timetableConfig";
import { formatTimetableTimeRange } from "@/features/academics/timetable/services/timetableTimeFormat";

interface TimetableGridProps {
  entries: TimetableEntry[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  conflicts: TimetableConflict[];
  onSlotClick: (dayKey: string, periodIndex: number) => void;
  isHolidayDay: (dayKey: string) => boolean;
  locale: string;
  isReadOnly: boolean;
  resolvedConfig: ResolvedTimetableConfig;
}

export default function TimetableGrid({
  entries,
  subjects,
  teachers,
  rooms,
  conflicts,
  onSlotClick,
  isHolidayDay,
  locale,
  isReadOnly,
  resolvedConfig,
}: TimetableGridProps) {
  const t = useTranslations("academics.timetable.grid");
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Get active days and periods from config
  const activeDays = resolvedConfig.days.filter((d) => d.isActive);
  const periods = resolvedConfig.periods;

  const getEntry = (
    dayKey: string,
    periodIndex: number,
  ): TimetableEntry | undefined => {
    return entries.find(
      (e) => e.dayKey === dayKey && e.periodIndex === periodIndex,
    );
  };

  const hasConflict = (
    dayKey: string,
    period: (typeof periods)[0],
  ): boolean => {
    return conflicts.some(
      (conflict) =>
        conflict.dayKey === dayKey &&
        (conflict.periodId
          ? conflict.periodId === period.id
          : conflict.periodIndex === period.index),
    );
  };

  const getSubjectName = (subjectId: string | null): string => {
    if (!subjectId) return "";
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return "";
    return locale === "ar" ? subject.nameAr : subject.nameEn;
  };

  const getTeacherName = (teacherId: string | null): string => {
    if (!teacherId) return "";
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return "";
    return locale === "ar" ? teacher.nameAr : teacher.nameEn;
  };

  const getRoomName = (roomId: string | null): string => {
    if (!roomId) return "";
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return "";
    return locale === "ar" ? room.nameAr : room.nameEn;
  };

  const periodTypeLabel = (period: (typeof periods)[0]): string => {
    switch (period.type) {
      case "BREAK":
        return t("break");
      case "ASSEMBLY":
        return t("periodTypes.assembly");
      case "ACTIVITY":
        return t("periodTypes.activity");
      default:
        return t("periodTypes.class");
    }
  };

  const periodTypeIcon = (period: (typeof periods)[0]) => {
    switch (period.type) {
      case "BREAK":
        return Coffee;
      case "ASSEMBLY":
        return Users;
      case "ACTIVITY":
        return Sparkles;
      default:
        return BookOpen;
    }
  };

  const renderSlotContent = (
    day: (typeof activeDays)[0],
    period: (typeof periods)[0],
  ) => {
    const entry = getEntry(day.key, period.index);
    const conflict = hasConflict(day.key, period);
    const isHoliday = isHolidayDay(day.key);
    const isBreak = entry?.slotType === "BREAK";
    const isInstructionalPeriod = period.isInstructional !== false;
    const PeriodTypeIcon = periodTypeIcon(period);

    if (isHoliday) {
      return (
        <div className="text-xs text-red-600 text-center py-8 font-medium">
          {t("holiday")}
        </div>
      );
    }

    if (!isInstructionalPeriod) {
      return (
        <div className="min-h-[80px] border-l-4 border-amber-400 bg-amber-50/50 px-3 py-6 flex flex-col items-center justify-center">
          <PeriodTypeIcon className="mb-1 h-5 w-5 text-amber-600" />
          <div className="text-sm font-medium text-amber-900">
            {periodTypeLabel(period)}
          </div>
        </div>
      );
    }

    if (isBreak) {
      return (
        <div className="bg-amber-50/50 border-l-4 border-amber-400 py-6 px-3 min-h-[80px] flex flex-col items-center justify-center">
          <Coffee className="w-5 h-5 text-amber-600 mb-1" />
          <div className="text-sm font-medium text-amber-900">
            {entry.breakLabelAr && locale === "ar"
              ? entry.breakLabelAr
              : entry.breakLabelEn && locale === "en"
                ? entry.breakLabelEn
                : t("break")}
          </div>
        </div>
      );
    }

    if (entry?.subjectId) {
      return (
        <div className="py-3 px-3 min-h-[80px] flex flex-col justify-start">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
              {getSubjectName(entry.subjectId)}
            </div>
            {conflict && (
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            )}
          </div>
          {entry.teacherId && (
            <div className="text-xs text-gray-600 line-clamp-1 mb-0.5">
              👤 {getTeacherName(entry.teacherId)}
            </div>
          )}
          {entry.roomId && (
            <div className="text-xs text-gray-500 line-clamp-1">
              📍 {getRoomName(entry.roomId)}
            </div>
          )}
          {!entry.teacherId && (
            <div className="text-xs text-orange-600 mt-1">
              ⚠️ {t("validation.missingTeacher")}
            </div>
          )}
          {!entry.roomId && (
            <div className="text-xs text-orange-600 mt-0.5">
              ⚠️ {t("validation.missingRoom")}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="py-8 px-3 min-h-[80px] flex items-center justify-center">
        {!isReadOnly && (
          <>
            <div className="hidden lg:flex opacity-0 group-hover:opacity-100 transition-opacity duration-200 items-center gap-1.5 text-gray-400 group-hover:text-primary text-sm font-medium">
              <Plus className="w-4 h-4" />
              <span>{t("add")}</span>
            </div>
            <div className="lg:hidden opacity-30 flex items-center justify-center">
              <Plus className="w-5 h-5 text-gray-400" />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop: Table View */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden print:block print:rounded-none print:shadow-none print:overflow-visible">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="sticky top-0 left-0 z-20 bg-primary-200 border-b border-r border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900 min-w-[100px]">
                  {t("period")}
                </th>
                {activeDays.map((day) => (
                  <th
                    key={day.key}
                    className={`sticky top-0 z-10 border-b border-r border-gray-200 px-4 py-3 text-center text-sm font-semibold min-w-[180px] ${
                      isHolidayDay(day.key)
                        ? "bg-red-50 text-red-700"
                        : "bg-primary-200 text-gray-900"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>{locale === "ar" ? day.nameAr : day.nameEn}</span>
                      {isHolidayDay(day.key) && (
                        <span className="text-xs font-normal text-red-600">
                          {t("holiday")}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => {
                const PeriodTypeIcon = periodTypeIcon(period);

                return (
                  <tr key={period.index} className="hover:bg-gray-50/50">
                    <td className="sticky left-0 z-10 border-b border-r border-gray-200 px-4 py-4 text-sm font-medium text-gray-900 bg-primary-50 ">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1.5">
                          <PeriodTypeIcon className="h-4 w-4 shrink-0 text-gray-500" />
                          <span>
                            {locale === "ar" ? period.nameAr : period.nameEn}
                          </span>
                        </span>
                        {period.startTime && period.endTime && (
                          <span
                            className="mt-0.5 text-xs text-gray-500"
                            dir="ltr"
                          >
                            {formatTimetableTimeRange(
                              period.startTime,
                              period.endTime,
                            )}
                          </span>
                        )}
                      </div>
                    </td>
                    {activeDays.map((day) => {
                      const entry = getEntry(day.key, period.index);
                      const conflict = hasConflict(day.key, period);
                      const isHoliday = isHolidayDay(day.key);
                      const isBreak = entry?.slotType === "BREAK";
                      const isInstructionalPeriod =
                        period.isInstructional !== false;
                      const isEmpty = !entry || (!entry.subjectId && !isBreak);

                      return (
                        <td
                          key={`${day.key}-${period.index}`}
                          className={`border-b border-r border-gray-200 p-0 transition-colors relative group ${
                            isHoliday || !isInstructionalPeriod
                              ? "bg-red-50 cursor-not-allowed"
                              : ""
                          } ${conflict && !isHoliday && !isBreak ? "bg-red-50 border-red-200" : ""} ${
                            !isReadOnly && !isHoliday && isInstructionalPeriod
                              ? "hover:bg-blue-50/50 cursor-pointer"
                              : ""
                          } ${isEmpty && !isHoliday ? "border-dashed" : ""}`}
                          onClick={() =>
                            !isReadOnly &&
                            !isHoliday &&
                            isInstructionalPeriod &&
                            onSlotClick(day.key, period.index)
                          }
                        >
                          {renderSlotContent(day, period)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: Card View by Day */}
      <div className="lg:hidden space-y-3 print:hidden">
        {activeDays.map((day) => {
          const isExpanded = expandedDay === day.key;
          const isHoliday = isHolidayDay(day.key);
          const dayEntries = periods.map((period) =>
            getEntry(day.key, period.index),
          );
          const filledCount = dayEntries.filter(
            (e) => e?.subjectId || e?.slotType === "BREAK",
          ).length;

          return (
            <div
              key={day.key}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Day Header - Collapsible */}
              <button
                onClick={() => setExpandedDay(isExpanded ? null : day.key)}
                className={`w-full px-4 py-3 flex items-center justify-between ${
                  isHoliday ? "bg-red-50" : "bg-gray-50"
                } hover:bg-gray-100 transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`text-sm font-semibold ${isHoliday ? "text-red-700" : "text-gray-900"}`}
                  >
                    {locale === "ar" ? day.nameAr : day.nameEn}
                  </div>
                  {isHoliday && (
                    <span className="text-xs text-red-600 font-medium">
                      {t("holiday")}
                    </span>
                  )}
                  {!isHoliday && (
                    <span className="text-xs text-gray-500">
                      {filledCount}/{periods.length}
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Periods List */}
              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {periods.map((period) => {
                    const entry = getEntry(day.key, period.index);
                    const conflict = hasConflict(day.key, period);
                    const isBreak = entry?.slotType === "BREAK";
                    const isInstructionalPeriod =
                      period.isInstructional !== false;
                    const PeriodTypeIcon = periodTypeIcon(period);

                    return (
                      <div
                        key={period.index}
                        onClick={() =>
                          !isReadOnly &&
                          !isHoliday &&
                          isInstructionalPeriod &&
                          onSlotClick(day.key, period.index)
                        }
                        className={`p-4 ${
                          !isReadOnly && !isHoliday && isInstructionalPeriod
                            ? "active:bg-blue-50 cursor-pointer"
                            : ""
                        } ${conflict && !isHoliday && !isBreak ? "bg-red-50" : ""} ${
                          isHoliday || !isInstructionalPeriod
                            ? "bg-red-50/30"
                            : ""
                        }`}
                      >
                        {/* Period Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                              <PeriodTypeIcon className="h-4 w-4 shrink-0 text-gray-500" />
                              <span>
                                {locale === "ar"
                                  ? period.nameAr
                                  : period.nameEn}
                              </span>
                            </div>
                            {period.startTime && period.endTime && (
                              <div
                                className="mt-0.5 text-xs text-gray-500"
                                dir="ltr"
                              >
                                {formatTimetableTimeRange(
                                  period.startTime,
                                  period.endTime,
                                )}
                              </div>
                            )}
                          </div>
                          {conflict && !isHoliday && (
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                          )}
                        </div>

                        {/* Slot Content */}
                        {isHoliday ? (
                          <div className="text-xs text-red-600 text-center py-2 font-medium">
                            {t("holiday")}
                          </div>
                        ) : !isInstructionalPeriod ? (
                          <div className="bg-amber-50 border-l-4 border-amber-400 py-3 px-3 rounded flex items-center gap-2">
                            <PeriodTypeIcon className="w-5 h-5 text-amber-600 shrink-0" />
                            <div className="text-sm font-medium text-amber-900">
                              {periodTypeLabel(period)}
                            </div>
                          </div>
                        ) : isBreak ? (
                          <div className="bg-amber-50 border-l-4 border-amber-400 py-3 px-3 rounded flex items-center gap-2">
                            <Coffee className="w-5 h-5 text-amber-600 shrink-0" />
                            <div className="text-sm font-medium text-amber-900">
                              {entry.breakLabelAr && locale === "ar"
                                ? entry.breakLabelAr
                                : entry.breakLabelEn && locale === "en"
                                  ? entry.breakLabelEn
                                  : t("break")}
                            </div>
                          </div>
                        ) : entry?.subjectId ? (
                          <div className="space-y-2">
                            <div className="text-base font-semibold text-gray-900">
                              {getSubjectName(entry.subjectId)}
                            </div>
                            {entry.teacherId && (
                              <div className="text-sm text-gray-600 flex items-center gap-1.5">
                                <span>👤</span>
                                <span>{getTeacherName(entry.teacherId)}</span>
                              </div>
                            )}
                            {entry.roomId && (
                              <div className="text-sm text-gray-500 flex items-center gap-1.5">
                                <span>📍</span>
                                <span>{getRoomName(entry.roomId)}</span>
                              </div>
                            )}
                            {!entry.teacherId && (
                              <div className="text-xs text-orange-600 flex items-center gap-1">
                                <span>⚠️</span>
                                <span>{t("validation.missingTeacher")}</span>
                              </div>
                            )}
                            {!entry.roomId && (
                              <div className="text-xs text-orange-600 flex items-center gap-1">
                                <span>⚠️</span>
                                <span>{t("validation.missingRoom")}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-400 flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" />
                            <span className="text-sm">{t("add")}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
