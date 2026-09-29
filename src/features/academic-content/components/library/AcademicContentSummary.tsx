"use client";

import { useLocale } from "next-intl";
import type { AcademicContentLibrarySummary } from "../../types/contracts";

function enumLabel(enumValue: string): string {
  return enumValue
    .toLowerCase()
    .split("_")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function dateOnlyLabel(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00.000Z`),
  );
}

function instantLabel(instant: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(instant));
}

export default function AcademicContentSummary({
  summary,
}: {
  summary: AcademicContentLibrarySummary | null;
}) {
  const locale = useLocale();
  if (!summary) return <span className="text-gray-500">No details yet</span>;

  switch (summary.type) {
    case "TEACHER_PREPARATION":
      return <span>{summary.topic || "No topic yet"}</span>;
    case "WEEKLY_PLAN":
      return (
        <span>
          {dateOnlyLabel(summary.weekStartDate, locale)} –{" "}
          {dateOnlyLabel(summary.weekEndDate, locale)}
        </span>
      );
    case "GUARDIAN_WEEKLY_NOTE":
      return (
        <span>
          {enumLabel(summary.priority)}
          {summary.requiresAcknowledgement ? " · Acknowledgement required" : ""}
        </span>
      );
    case "SUBJECT_RESOURCE":
      return <span>{enumLabel(summary.resourceCategory)}</span>;
    case "ONLINE_SESSION":
      return (
        <span>
          {enumLabel(summary.platform)} · {instantLabel(summary.startAt, locale)} –{" "}
          {new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(
            new Date(summary.endAt),
          )}
        </span>
      );
  }
}
