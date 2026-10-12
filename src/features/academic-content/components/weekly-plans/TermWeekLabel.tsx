"use client";

import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import { calculateTermWeeks, formatTermWeekRange } from "../../model/termWeeks";
import type { WeeklyPlanTermBounds } from "../../model/weeklyPlanDetail";

export default function TermWeekLabel({ range, termBounds, locale }: {
  range: WeeklyPlanTermBounds;
  termBounds?: WeeklyPlanTermBounds;
  locale: string;
}) {
  const t = useAcademicContentTranslations("term_weeks");
  const week = calculateTermWeeks(termBounds).find(
    (candidate) => candidate.startDate === range.startDate && candidate.endDate === range.endDate,
  );
  const prefix = week ? t("week_number", { number: week.number }) : t("custom_period");
  return <span>{prefix} · {formatTermWeekRange(range, locale)}</span>;
}
