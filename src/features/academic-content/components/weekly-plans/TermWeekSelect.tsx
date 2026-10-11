"use client";

import { useLocale } from "next-intl";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import { calculateTermWeeks } from "../../model/termWeeks";
import type { WeeklyPlanTermBounds } from "../../model/weeklyPlanDetail";

interface TermWeekSelectProps {
  termBounds?: WeeklyPlanTermBounds;
  startDate: string;
  endDate: string;
  disabled?: boolean;
  allLabel?: string;
  onChange: (range: WeeklyPlanTermBounds) => void;
}

function weekDateRange(range: WeeklyPlanTermBounds, locale: string): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: range.startDate.slice(0, 4) !== range.endDate.slice(0, 4) ? "numeric" : undefined,
    timeZone: "UTC",
  });
  const start = range.startDate ? new Date(`${range.startDate}T00:00:00Z`) : null;
  const end = range.endDate ? new Date(`${range.endDate}T00:00:00Z`) : null;
  return start && end && start <= end
    ? formatter.formatRange(start, end)
    : `${start ? formatter.format(start) : "…"} – ${end ? formatter.format(end) : "…"}`;
}

export default function TermWeekSelect(props: TermWeekSelectProps) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("term_weeks");
  const weeks = calculateTermWeeks(props.termBounds);
  const selectedWeek = weeks.find(
    (week) => week.startDate === props.startDate && week.endDate === props.endDate,
  );
  const hasCustomRange = !selectedWeek && Boolean(props.startDate || props.endDate);
  const options: SelectOption[] = weeks.map((week) => ({
    value: week.startDate,
    label: `${t("week_number", { number: week.number })} · ${weekDateRange(week, locale)}`,
  }));
  if (props.allLabel) options.unshift({ value: "", label: props.allLabel });
  if (hasCustomRange) options.push({
    value: "custom",
    label: `${t("custom_period")} · ${weekDateRange(props, locale)}`,
    disabled: true,
  });

  return (
    <Select
      label={t("week")}
      triggerAriaLabel={t("week")}
      placeholder={t("choose_week")}
      value={selectedWeek?.startDate ?? (hasCustomRange ? "custom" : "")}
      options={options}
      searchable
      searchPlaceholder={t("search_weeks")}
      searchLabel={t("search_weeks")}
      noResultsText={t("no_results")}
      disabled={props.disabled || weeks.length === 0}
      helperText={weeks.length === 0 ? t("term_dates_unavailable") : undefined}
      onChange={(startDate) => {
        const week = weeks.find((candidate) => candidate.startDate === startDate);
        props.onChange({ startDate: week?.startDate ?? "", endDate: week?.endDate ?? "" });
      }}
    />
  );
}
