"use client";

import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import type { HomeworkAssignmentUiModel } from "@/features/academics/homework/services/homeworkApi.types";
import type { AcademicContentAssessmentReference, AssessmentReferenceNames } from "../services/academicContentAssessmentReference";
import { useAcademicContentTranslations } from "./useAcademicContentTranslations";
import { weeklyPlanHomeworkHref, weeklyPlanAssessmentHref } from "../model/weeklyPlanReferenceNavigation";

function referenceDescription(fields: Array<[string, string | number | null | undefined]>) {
  return fields
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([label, value]) => `${label}: ${value}`)
    .join(" · ");
}

export function useWeeklyPlanReferenceOptions(options: {
  homeworkAssignments: HomeworkAssignmentUiModel[];
  assessments: AcademicContentAssessmentReference[];
  referenceContext?: { academicYearId: string; termId: string };
}) {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const t = useAcademicContentTranslations("reference_details");
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric", month: "short", year: "numeric",
  });
  const dateLabel = (date: string) =>
    dateFormatter.format(new Date(date.length === 10 ? `${date}T00:00:00` : date));
  const nameLabel = (reference?: AssessmentReferenceNames) => reference
    ? (locale === "ar" ? reference.nameAr : reference.nameEn) || reference.name
    : undefined;
  const navigationContext = {
    locale,
    academicYearId: options.referenceContext?.academicYearId || searchParams.get("year") || undefined,
    termId: options.referenceContext?.termId || searchParams.get("term") || undefined,
  };

  const homeworkAssignments = options.homeworkAssignments
    .filter(({ status }) => status === "draft" || status === "published")
    .map((homework) => ({
      value: homework.id,
      href: weeklyPlanHomeworkHref(homework, navigationContext),
      label: homework.title,
      description: referenceDescription([
        [t("subject"), homework.subjectName],
        [t("classroom"), [homework.classroomGradeName, homework.classroomSectionName, homework.classroomName].filter(Boolean).join(" / ")],
        [t("teacher"), homework.teacherName],
        [t("due_date"), homework.dueAt ? dateLabel(homework.dueAt) : null],
        [t("status"), t(`statuses.${homework.status}`)],
        [t("marks"), homework.isGraded ? homework.totalMarks : null],
      ]),
    }));
  const assessments = options.assessments
    .map((assessment) => ({
      value: assessment.id,
      href: weeklyPlanAssessmentHref(assessment, navigationContext),
      label: locale === "ar" ? assessment.titleAr || assessment.title : assessment.title,
      description: referenceDescription([
        [t("subject"), nameLabel(assessment.subject)],
        [t("scope"), [t(`scope_types.${assessment.scopeType}`),
          (assessment.scopeNames ?? []).map(nameLabel).filter(Boolean).join(" / "),
        ].filter(Boolean).join(": ")],
        [t("type"), t(`assessment_types.${assessment.type}`)],
        [t("date"), assessment.date ? dateLabel(assessment.date) : null],
        [t("status"), t(`statuses.${assessment.approvalStatus}`)],
        [t("marks"), assessment.maxScore],
        [t("duration"), assessment.expectedTimeMinutes],
        [t("weight"), `${assessment.weight}%`],
        [t("delivery"), t(`delivery_modes.${assessment.deliveryMode}`)],
        [t("grading_lock"), t(assessment.isLocked ? "locked" : "unlocked")],
      ]),
    }));

  return { homeworkAssignments, assessments };
}
