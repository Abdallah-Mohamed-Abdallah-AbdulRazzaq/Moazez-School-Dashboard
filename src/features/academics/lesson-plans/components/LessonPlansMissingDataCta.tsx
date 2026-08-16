"use client";

import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import {
  buildLessonPlansMissingDataHref,
  type LessonPlansMissingDataScope,
  type LessonPlansMissingDataStatus,
} from "./lessonPlansMissingData";

type CtaLabelKey =
  | "ctas.academicStructure"
  | "ctas.subjects"
  | "ctas.teacherAllocation"
  | "ctas.curriculum"
  | "ctas.timetable";

const labelKeyByStatus: Record<LessonPlansMissingDataStatus, CtaLabelKey> = {
  "missing-grade": "ctas.academicStructure",
  "missing-section": "ctas.academicStructure",
  "missing-classroom": "ctas.academicStructure",
  "missing-subject": "ctas.subjects",
  "missing-teacher-allocation": "ctas.teacherAllocation",
  "missing-curriculum": "ctas.curriculum",
  "no-curriculum-lessons": "ctas.curriculum",
  "missing-timetable-slots": "ctas.timetable",
};

interface LessonPlansMissingDataCtaProps {
  status: LessonPlansMissingDataStatus;
  locale: string;
  scope: LessonPlansMissingDataScope;
  onNavigate: (href: string) => void;
}

export default function LessonPlansMissingDataCta({
  status,
  locale,
  scope,
  onNavigate,
}: LessonPlansMissingDataCtaProps) {
  const t = useTranslations("academics.lessonPlans.emptyState");
  const href = buildLessonPlansMissingDataHref(status, locale, scope);

  return (
    <Button type="button" onClick={() => onNavigate(href)}>
      {t(labelKeyByStatus[status])}
    </Button>
  );
}
