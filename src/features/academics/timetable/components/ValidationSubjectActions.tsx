"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import type { TimetableValidationItem } from "../services/timetableApiTypes";

export interface ValidationReviewContext {
  academicYearId: string;
  termId: string;
}

function subjectIssueDestination(
  path: string,
  params: Record<string, string | null | undefined>,
  context?: ValidationReviewContext,
) {
  const query = new URLSearchParams();
  if (context) {
    query.set("year", context.academicYearId);
    query.set("term", context.termId);
  }
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  return `${path}?${query}`;
}

export default function ValidationSubjectActions({
  item,
  context,
  openDestination,
  locale,
}: {
  item: TimetableValidationItem;
  context?: ValidationReviewContext;
  locale: string;
  openDestination: (path: string) => void;
}) {
  const t = useTranslations("academics.timetable.validationEnhancements");
  const subject =
    locale === "ar"
      ? item.subject?.nameAr || item.subject?.nameEn
      : item.subject?.nameEn || item.subject?.nameAr;
  const delta =
    item.expectedWeeklyHours === null
      ? null
      : item.scheduledWeeklyHours - item.expectedWeeklyHours;
  const explanation =
    item.expectedWeeklyHours === null
      ? t("requirementMissing")
      : delta && delta < 0
        ? t("needsLessons", {
            subject: subject ?? t("subject"),
            count: Math.abs(delta),
          })
        : delta && delta > 0
          ? t("extraLessons", {
              subject: subject ?? t("subject"),
              count: delta,
            })
          : null;
  const missingTeacher =
    item.status === "missing_teacher_allocation" ||
    item.issues.some((issue) => issue.code.includes("teacher_allocation"));
  const timetable = subjectIssueDestination(
    "/academics/timetable",
    {
      classroom: item.classroomId,
      grade: item.gradeId,
      configurationScope: "CLASSROOM",
      scopeId: item.classroomId,
    },
    context,
  );
  const allocation = subjectIssueDestination(
    "/academics/teacher-allocation",
    {
      grade: item.gradeId,
      classroom: item.classroomId,
      subject: item.subjectId,
      missing: "1",
      highlightCell: item.subjectId
        ? `${item.classroomId}:${item.subjectId}`
        : undefined,
    },
    context,
  );
  const requirements = subjectIssueDestination(
    "/academics/subjects",
    {
      tab: "matrix",
      gradeId: item.gradeId,
      subjectId: item.subjectId,
      missing: item.expectedWeeklyHours === null ? "1" : undefined,
    },
    context,
  );
  return (
    <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
      {explanation && (
        <p className="text-sm leading-relaxed text-slate-700">{explanation}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          className="min-h-11 w-full focus-visible:ring-2 focus-visible:ring-primary sm:w-auto"
          onClick={() => openDestination(timetable)}
        >
          {t("openClassroom")}
        </Button>
        {missingTeacher && item.subjectId && (
          <Button
            variant="secondary"
            className="min-h-11 w-full focus-visible:ring-2 focus-visible:ring-primary sm:w-auto"
            onClick={() => openDestination(allocation)}
          >
            {t("assignTeacher")}
          </Button>
        )}
        <Button
          variant="ghost"
          className="min-h-11 w-full focus-visible:ring-2 focus-visible:ring-primary sm:w-auto"
          onClick={() => openDestination(requirements)}
        >
          {t("editRequirements")}
        </Button>
      </div>
    </div>
  );
}
