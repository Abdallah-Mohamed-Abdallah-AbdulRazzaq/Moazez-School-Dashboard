"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import { Select } from "@/components/ui/input";
import type { Assessment, GradebookStudentRow } from "../types";
import { gradebookStatusStyles } from "./gradebookStatusStyles";

interface GradebookAssessmentViewProps {
  rows: GradebookStudentRow[];
  assessments: Assessment[];
  onOpenGrade: (assessment: Assessment, row: GradebookStudentRow) => void;
}

export default function GradebookAssessmentView({
  rows,
  assessments,
  onOpenGrade,
}: GradebookAssessmentViewProps) {
  const t = useTranslations("academics.grades");
  const locale = useLocale();
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const selectedAssessment = useMemo(
    () => assessments.find((assessment) => assessment.id === selectedAssessmentId) ?? assessments[0],
    [assessments, selectedAssessmentId],
  );

  if (!selectedAssessment) return null;

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)" }}>
      <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(280px,0.55fr)_1fr]">
        <Select
          aria-label={t("gradebook.assessment")}
          value={selectedAssessment.id}
          onChange={setSelectedAssessmentId}
          options={assessments.map((assessment) => ({ value: assessment.id, label: locale === "ar" ? assessment.titleAr : assessment.title }))}
        />
        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
          <div>{t("gradebook.assessmentProgress", { weight: selectedAssessment.weight, maxScore: selectedAssessment.maxScore })}</div>
          <div className="mt-1">{t(selectedAssessment.deliveryMode === "QUESTION_BASED" ? "gradebook.deliveryHints.questionBased" : "gradebook.deliveryHints.scoreOnly")}</div>
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
        {rows.map((row) => {
          const status = row.statusByAssessmentId[selectedAssessment.id];
          const score = row.scoresByAssessmentId[selectedAssessment.id];
          const grade = status === "entered" && score != null
            ? `${score}/${selectedAssessment.maxScore}`
            : status === "absent" ? t("table.absent") : t("table.missing");
          return (
            <div key={row.studentId} className="flex items-center justify-between gap-3 rounded-lg border border-s-4 px-3 py-2" style={{ borderColor: gradebookStatusStyles[status].borderColor, backgroundColor: "var(--surface-color)" }}>
              <div>
                <div className="font-medium" style={{ color: "var(--text-primary)" }}>{locale === "ar" ? row.studentNameAr : row.studentNameEn}</div>
                <span className="mt-1 inline-block rounded-full border px-2 py-0.5 text-xs" style={gradebookStatusStyles[status]}>{grade}</span>
              </div>
              <Button size="sm" variant="secondary" onClick={() => onOpenGrade(selectedAssessment, row)}>
                {selectedAssessment.deliveryMode === "QUESTION_BASED" ? t("table.openReview") : t("gradebook.grade")}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
