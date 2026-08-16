"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AlertTriangle, Calendar, CheckCircle2, CircleDot } from "lucide-react";
import { Lesson } from "@/features/academics/curriculum/services/curriculumService";
import {
  LessonPlan,
  WeekInfo,
} from "@/features/academics/lesson-plans/services/lessonPlansService";
import LessonPlanItemCard from "./LessonPlanItemCard";
import LessonPlanActionsMenu from "./LessonPlanActionsMenu";

interface WeekColumnProps {
  week: WeekInfo;
  plan: LessonPlan | undefined;
  lessons: Lesson[];
  isCurrent: boolean;
  hasIssue: boolean;
  onDrop: (weekIndex: number) => void;
  onDragStartItem: (itemId: string, weekIndex: number) => void;
  onDragEndItem: () => void;
  onStatusChange: (
    itemId: string,
    status: "IN_PROGRESS" | "DONE" | "SKIPPED" | "CANCELLED",
  ) => void;
  onEditItem: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  isReadOnly: boolean;
  isDragOver: boolean;
  onEditPlan: (plan: LessonPlan) => void;
  onActivatePlan: (plan: LessonPlan) => void;
  onArchivePlan: (plan: LessonPlan) => void;
  onDeletePlan: (plan: LessonPlan) => void;
  onReorder: (itemId: string, direction: "up" | "down") => void;
  pendingItemIds?: Set<string>;
  pendingPlanIds?: Set<string>;
}

export default function WeekColumn({
  week,
  plan,
  lessons,
  isCurrent,
  hasIssue,
  onDrop,
  onDragStartItem,
  onDragEndItem,
  onStatusChange,
  onEditItem,
  onRemove,
  isReadOnly,
  isDragOver,
  onEditPlan,
  onActivatePlan,
  onArchivePlan,
  onDeletePlan,
  onReorder,
  pendingItemIds = new Set(),
  pendingPlanIds = new Set(),
}: WeekColumnProps) {
  const t = useTranslations("academics.lessonPlans.week");
  const tStatus = useTranslations("academics.lessonPlans.planStatus");
  const locale = useLocale();

  const planStatusStyles: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
    ACTIVE: "bg-green-50 text-green-700 border-green-200",
    ARCHIVED: "bg-amber-50 text-amber-700 border-amber-200",
    UNKNOWN: "bg-gray-100 text-gray-500 border-gray-200",
  };

  const [dragOverColumn, setDragOverColumn] = useState(false);
  const isPlanReadOnly = isReadOnly || plan?.status === "ARCHIVED";

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!isPlanReadOnly && week.instructionalDays.length > 0) {
        setDragOverColumn(true);
      }
    },
    [isPlanReadOnly, week.instructionalDays.length],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverColumn(false);
      if (!isPlanReadOnly && week.instructionalDays.length > 0) {
        onDrop(week.weekIndex);
      }
    },
    [isPlanReadOnly, onDrop, week.instructionalDays.length, week.weekIndex],
  );

  const items = plan ? [...plan.items].sort((a, b) => a.order - b.order) : [];

  // Format dates
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <div
      data-testid="week-column"
      className={`
         shrink-0 bg-white rounded-xl border transition-all shadow-sm
        ${
          dragOverColumn && isDragOver
            ? "border-primary border-2 bg-primary/5"
            : hasIssue
              ? "border-amber-300"
              : isCurrent
                ? "border-primary/50"
                : "border-gray-200"
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-900">
            {t("label", { index: week.weekIndex })}
          </h4>
          <div className="flex items-center gap-1">
            {isCurrent && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <CircleDot className="h-3 w-3" aria-hidden="true" />
                {t("current")}
              </span>
            )}
            {hasIssue && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                {t("issues")}
              </span>
            )}
            {plan && (
              <span
                className={`px-2 py-0.5 text-xs font-medium border rounded-full ${planStatusStyles[plan.status] || planStatusStyles.UNKNOWN}`}
              >
                {tStatus(plan.status)}
              </span>
            )}
            <span className="px-2 py-0.5 text-xs font-medium text-primary border border-primary rounded-full">
              {items.length}
            </span>

            {plan && (
              <LessonPlanActionsMenu
                plan={plan}
                isReadOnly={isReadOnly}
                isPending={pendingPlanIds.has(plan.id)}
                onEdit={() => onEditPlan(plan)}
                onActivate={() => onActivatePlan(plan)}
                onArchive={() => onArchivePlan(plan)}
                onDelete={() => onDeletePlan(plan)}
              />
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Calendar className="w-3 h-3" />
          <span>
            {t("dateRange", {
              start: formatDate(week.startDate),
              end: formatDate(week.endDate),
            })}
          </span>
        </div>

        {/* Holiday Warning */}
        {week.hasHolidays && (
          <div className="mt-2 px-2 py-1 bg-orange-50 border border-orange-200 rounded-md">
            <div className="flex items-center gap-1 text-xs text-orange-800">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>
                {t("holidayWarning", { count: week.lostTeachingDays })}
              </span>
            </div>
          </div>
        )}
        {week.instructionalDays.length === 0 && (
          <p className="mt-2 text-xs text-red-600">
            {t("noInstructionalDays")}
          </p>
        )}
      </div>

      {/* Items */}
      <div className="p-3 space-y-2 min-h-[200px]">
        {items.length === 0 ? (
          <div className="text-center py-8">
            {week.instructionalDays.length === 0 ? (
              <div className="space-y-2 text-red-600">
                <AlertTriangle className="mx-auto h-5 w-5" aria-hidden="true" />
                <p className="text-xs font-medium">
                  {t("noInstructionalDays")}
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-gray-500">
                <CheckCircle2
                  className="mx-auto h-5 w-5 text-gray-300"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-gray-700">
                  {t("noLessonsPlanned")}
                </p>
                {!isPlanReadOnly && (
                  <p className="text-xs text-gray-500">{t("dragLessonHere")}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          items.map((item, index) => {
            const lesson = lessons.find((l) => l.id === item.lessonId);

            return (
              <LessonPlanItemCard
                key={item.id}
                item={item}
                lesson={lesson}
                onDragStart={() => onDragStartItem(item.id, week.weekIndex)}
                onDragEnd={onDragEndItem}
                onStatusChange={onStatusChange}
                onEditItem={onEditItem}
                onRemove={onRemove}
                isReadOnly={isPlanReadOnly}
                onReorder={onReorder}
                disableMoveUp={index === 0}
                disableMoveDown={index === items.length - 1}
                isPending={pendingItemIds.has(item.id)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
