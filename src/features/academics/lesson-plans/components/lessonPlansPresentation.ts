import type {
  LessonPlan,
  LessonPlanValidationIssue,
  WeekInfo,
} from "../services/lessonPlansService";

export type WeekBoardFilter = "ALL" | "CURRENT_UPCOMING" | "PLANNED" | "ISSUES";

export interface WeekPresentation {
  isCurrent: boolean;
  hasPlannedItems: boolean;
  hasIssue: boolean;
  hasInstructionalDays: boolean;
}

export function deriveIssueWeekIndexes({
  plans,
  issues,
}: {
  plans: LessonPlan[];
  issues: Array<Pick<LessonPlanValidationIssue, "itemId">>;
}) {
  const weekByItemId = new Map(
    plans.flatMap((plan) =>
      plan.items.map((item) => [item.id, plan.weekIndex] as const),
    ),
  );

  return new Set(
    issues.flatMap((issue) => {
      const weekIndex = issue.itemId
        ? weekByItemId.get(issue.itemId)
        : undefined;
      return weekIndex === undefined ? [] : [weekIndex];
    }),
  );
}

export function getWeekPresentation({
  week,
  itemCount,
  hasIssue,
  today,
}: {
  week: WeekInfo;
  itemCount: number;
  hasIssue: boolean;
  today: string;
}): WeekPresentation {
  return {
    isCurrent: week.startDate <= today && today <= week.endDate,
    hasPlannedItems: itemCount > 0,
    hasIssue,
    hasInstructionalDays: week.instructionalDays.length > 0,
  };
}

export function filterLessonPlanWeeks({
  weeks,
  plans,
  issueWeekIndexes,
  filter,
  today,
}: {
  weeks: WeekInfo[];
  plans: LessonPlan[];
  issueWeekIndexes: Set<number>;
  filter: WeekBoardFilter;
  today: string;
}) {
  const itemCountByWeek = new Map(
    plans.map((plan) => [plan.weekIndex, plan.items.length] as const),
  );

  return weeks.filter((week) => {
    if (filter === "CURRENT_UPCOMING") return week.endDate >= today;
    if (filter === "PLANNED") {
      return (itemCountByWeek.get(week.weekIndex) ?? 0) > 0;
    }
    if (filter === "ISSUES") return issueWeekIndexes.has(week.weekIndex);
    return true;
  });
}

export function getDateOnlyToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
