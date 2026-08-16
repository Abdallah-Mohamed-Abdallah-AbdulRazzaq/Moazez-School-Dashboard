"use client";

import { useTranslations, useLocale } from "next-intl";
import { Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { ChevronDown, Calendar, AlertTriangle, Plus, CircleDot } from "lucide-react";
import { Lesson } from "@/features/academics/curriculum/services/curriculumService";
import {
  LessonPlan,
  WeekInfo,
} from "@/features/academics/lesson-plans/services/lessonPlansService";
import LessonPlanItemCard from "./LessonPlanItemCard";
import LessonPlanActionsMenu from "./LessonPlanActionsMenu";
import { getWeekPresentation } from "./lessonPlansPresentation";

interface WeeksBoardMobileProps {
  weeks: WeekInfo[];
  plans: LessonPlan[];
  lessons: Lesson[];
  issueWeekIndexes: Set<number>;
  today: string;
  isReadOnly: boolean;
  onStatusChange: (
    itemId: string,
    status: "IN_PROGRESS" | "DONE" | "SKIPPED" | "CANCELLED",
  ) => void;
  onEditItem: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onEditPlan: (plan: LessonPlan) => void;
  onActivatePlan: (plan: LessonPlan) => void;
  onArchivePlan: (plan: LessonPlan) => void;
  onDeletePlan: (plan: LessonPlan) => void;
  onReorder: (itemId: string, direction: "up" | "down") => void;
  onAddLesson: (weekIndex: number) => void;
  pendingItemIds?: Set<string>;
  pendingPlanIds?: Set<string>;
}

export default function WeeksBoardMobile({
  weeks,
  plans,
  lessons,
  issueWeekIndexes,
  today,
  isReadOnly,
  onStatusChange,
  onEditItem,
  onRemove,
  onEditPlan,
  onActivatePlan,
  onArchivePlan,
  onDeletePlan,
  onReorder,
  onAddLesson,
  pendingItemIds = new Set(),
  pendingPlanIds = new Set(),
}: WeeksBoardMobileProps) {
  const t = useTranslations("academics.lessonPlans");
  const tMobile = useTranslations("academics.lessonPlans.mobile");
  const locale = useLocale();

  const planStatusStyles: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
    ACTIVE: "bg-green-50 text-green-700 border-green-200",
    ARCHIVED: "bg-amber-50 text-amber-700 border-amber-200",
    UNKNOWN: "bg-gray-100 text-gray-500 border-gray-200",
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="space-y-2">
      {weeks.map((week) => {
        const weekPlan = plans.find((p) => p.weekIndex === week.weekIndex);
        const isPlanReadOnly = isReadOnly || weekPlan?.status === "ARCHIVED";
        const items = weekPlan
          ? [...weekPlan.items].sort((a, b) => a.order - b.order)
          : [];
        const presentation = getWeekPresentation({
          week,
          itemCount: items.length,
          hasIssue: issueWeekIndexes.has(week.weekIndex),
          today,
        });

        return (
          <Accordion
            key={week.weekIndex}
            data-testid="week-column"
            defaultExpanded={false}
            sx={{
              boxShadow: "none",
              border: "1px solid #e5e7eb",
              borderRadius: "8px !important",
              "&:before": { display: "none" },
              "&.Mui-expanded": { margin: "0 !important" },
            }}
          >
            <AccordionSummary
              expandIcon={<ChevronDown className="w-5 h-5 text-gray-600" />}
              sx={{
                minHeight: "auto !important",
                padding: "12px 16px",
                "& .MuiAccordionSummary-content": {
                  margin: "0 !important",
                },
              }}
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {tMobile("weekAccordion", { index: week.weekIndex })}
                  </h4>
                  <div className="flex items-center gap-2">
                    {week.hasHolidays && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                        <AlertTriangle className="w-3 h-3" />
                        {week.lostTeachingDays}
                      </span>
                    )}
                    {presentation.isCurrent && (
                      <span className="flex items-center gap-1 rounded border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        <CircleDot className="h-3 w-3" />
                        {t("week.current")}
                      </span>
                    )}
                    {presentation.hasIssue && (
                      <span className="flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                        <AlertTriangle className="h-3 w-3" />
                        {t("week.issues")}
                      </span>
                    )}
                    <span className="px-2 py-0.5 text-xs font-medium text-primary border border-primary rounded-full">
                      {items.length}
                    </span>
                    {weekPlan && (
                      <span
                        className={`px-2 py-0.5 text-xs font-medium border rounded-full ${planStatusStyles[weekPlan.status] || planStatusStyles.UNKNOWN}`}
                      >
                        {t(`planStatus.${weekPlan.status}`)}
                      </span>
                    )}
                    {weekPlan && (
                      <LessonPlanActionsMenu
                        plan={weekPlan}
                        isReadOnly={isReadOnly}
                        isPending={pendingPlanIds.has(weekPlan.id)}
                        onEdit={() => onEditPlan(weekPlan)}
                        onActivate={() => onActivatePlan(weekPlan)}
                        onArchive={() => onArchivePlan(weekPlan)}
                        onDelete={() => onDeletePlan(weekPlan)}
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {formatDate(week.startDate)} - {formatDate(week.endDate)}
                  </span>
                </div>
              </div>
            </AccordionSummary>

            <AccordionDetails
              sx={{
                padding: "12px 16px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <div className="space-y-2">
                {items.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm font-medium text-gray-700">
                      {week.instructionalDays.length === 0
                        ? t("week.noInstructionalDays")
                        : t("week.noLessonsPlanned")}
                    </p>
                    {!isPlanReadOnly && week.instructionalDays.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        {t("week.dragLessonHere")}
                      </p>
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
                        onDragStart={() => {}}
                        onDragEnd={() => {}}
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

                {/* Add Lesson Button */}
                {!isPlanReadOnly && (
                  <button
                    onClick={() => onAddLesson(week.weekIndex)}
                    disabled={week.instructionalDays.length === 0}
                    title={
                      week.instructionalDays.length === 0
                        ? t("validation.no_instructional_days")
                        : undefined
                    }
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    {tMobile("addLesson")}
                  </button>
                )}
              </div>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </div>
  );
}
