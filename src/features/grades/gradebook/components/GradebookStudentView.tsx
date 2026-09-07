"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import { Select } from "@/components/ui/input";
import { getAssessmentTypeLabelKey } from "../../assessments/services/gradesAssessmentsService";
import type { Assessment, GradebookStudentRow, GradeItemStatus } from "../types";
import { gradebookStatusStyles } from "./gradebookStatusStyles";

interface GradebookStudentViewProps {
  rows: GradebookStudentRow[];
  assessments: Assessment[];
  onOpenGrade: (assessment: Assessment, row: GradebookStudentRow) => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: string) => void;
  };
}

type AssessmentStatusFilter = "all" | "entered" | "missing" | "absent";

const studentSummaryItems: Array<{ label: "overall" | "completed" | "missing" | "absent"; status?: GradeItemStatus }> = [
  { label: "overall" },
  { label: "completed", status: "entered" },
  { label: "missing", status: "missing" },
  { label: "absent", status: "absent" },
];

function gradeLabel(
  assessment: Assessment,
  row: GradebookStudentRow,
  missingLabel: string,
  absentLabel: string,
): string {
  const status = row.statusByAssessmentId[assessment.id];
  const score = row.scoresByAssessmentId[assessment.id];
  if (status === "absent") return absentLabel;
  if (status === "entered" && score != null) return `${score}/${assessment.maxScore}`;
  return missingLabel;
}

export default function GradebookStudentView({
  rows,
  assessments,
  onOpenGrade,
  pagination,
}: GradebookStudentViewProps) {
  const t = useTranslations("academics.grades");
  const locale = useLocale();
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [assessmentStatusFilter, setAssessmentStatusFilter] = useState<AssessmentStatusFilter>("all");
  const selectedStudent = useMemo(
    () => rows.find((row) => row.studentId === selectedStudentId) ?? rows[0],
    [rows, selectedStudentId],
  );

  if (!selectedStudent) return null;

  const groupedAssessments = assessments.reduce<Record<string, Assessment[]>>((groups, assessment) => {
    const groupId = getAssessmentTypeLabelKey(assessment.type);
    groups[groupId] = [...(groups[groupId] ?? []), assessment];
    return groups;
  }, {});

  const matchesAssessmentFilter = (assessment: Assessment) =>
    assessmentStatusFilter === "all"
    || selectedStudent.statusByAssessmentId[assessment.id] === assessmentStatusFilter;

  return (
    <div className="grid min-w-0 max-w-full items-start gap-4 xl:h-[calc(100vh-9rem)] xl:items-stretch xl:grid-cols-[minmax(320px,1fr)_minmax(0,2fr)]">
      <div className="min-w-0 xl:flex xl:min-h-0 xl:h-full xl:flex-col">
        <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto rounded-xl border p-2 xl:block xl:min-h-0 xl:flex-1 xl:space-y-2 xl:overflow-y-auto" style={{ borderColor: "var(--border-color)" }}>
          {rows.map((row) => {
            const isSelected = row.studentId === selectedStudent.studentId;
            return (
              <button
                key={row.studentId}
                type="button"
                onClick={() => setSelectedStudentId(row.studentId)}
                className="min-w-[220px] shrink-0 border-s-4 rounded-lg border px-3 py-2 text-start transition-colors hover:bg-[var(--background-color)] focus:outline-none xl:w-full"
                style={{
                  borderColor: isSelected ? "var(--primary-color)" : "var(--border-color)",
                  backgroundColor: isSelected ? "var(--color-primary-50)" : "var(--surface-color)",
                }}
              >
                <div className="font-medium" style={{ color: "var(--text-primary)" }}>{locale === "ar" ? row.studentNameAr : row.studentNameEn}</div>
                <div className="mt-1 flex items-center justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
                  <span className="flex items-center gap-1.5">
                    <span className="rounded-full border px-1.5 py-0.5" style={gradebookStatusStyles.missing}>{t("gradebook.studentSummary.missing")}: {row.missingCount}</span>
                    <span className="rounded-full border px-1.5 py-0.5" style={gradebookStatusStyles.absent}>{t("gradebook.studentSummary.absent")}: {row.absentCount}</span>
                  </span>
                  <span className="font-semibold">{row.average.toFixed(1)}%</span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t px-1 pt-2 xl:mt-auto" style={{ borderColor: "var(--border-color)" }}>
          <span className="w-full text-xs sm:w-auto" style={{ color: "var(--text-secondary)" }}>
            {t("gradebook.pagination.summary", {
              from: (pagination.currentPage - 1) * pagination.pageSize + 1,
              to: Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems),
              total: pagination.totalItems,
            })}
          </span>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Select
              aria-label={t("gradebook.pagination.pageSize")}
              fullWidth={false}
              className="w-[72px]"
              value={String(pagination.pageSize)}
              onChange={pagination.onPageSizeChange}
              options={[10, 25, 50].map((size) => ({ value: String(size), label: String(size) }))}
            />
            <Button className="flex-1 sm:flex-none" size="sm" variant="secondary" disabled={pagination.currentPage === 1} onClick={() => pagination.onPageChange(pagination.currentPage - 1)}>{t("gradebook.pagination.previous")}</Button>
            <span className="shrink-0 text-xs text-nowrap" style={{ color: "var(--text-secondary)" }}>{t("gradebook.pagination.page", { page: pagination.currentPage, total: pagination.totalPages })}</span>
            <Button className="flex-1 sm:flex-none" size="sm" variant="secondary" disabled={pagination.currentPage === pagination.totalPages} onClick={() => pagination.onPageChange(pagination.currentPage + 1)}>{t("gradebook.pagination.next")}</Button>
          </div>
        </div>
      </div>
      <div className="min-w-0 self-start rounded-xl border p-4 xl:h-full xl:overflow-y-auto" style={{ borderColor: "var(--border-color)" }}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{locale === "ar" ? selectedStudent.studentNameAr : selectedStudent.studentNameEn}</div>
            <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              {t("gradebook.studentProgress", { completed: selectedStudent.completedItems, total: selectedStudent.totalItems, average: selectedStudent.average.toFixed(1) })}
            </div>
          </div>
          {selectedStudent.classroomName ? <span className="rounded-full border px-2.5 py-1 text-xs" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>{selectedStudent.classroomName}</span> : null}
        </div>
        <div className="mb-4 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
          {studentSummaryItems.map(({ label, status }) => {
            const value = label === "overall" ? `${selectedStudent.average.toFixed(1)}%`
              : label === "completed" ? `${selectedStudent.completedItems}/${selectedStudent.totalItems}`
                : label === "missing" ? selectedStudent.missingCount : selectedStudent.absentCount;
            const statusBorderColor = status ? gradebookStatusStyles[status].borderColor : "var(--border-color)";
            return (
            <div key={label} className="min-w-0 rounded-lg border px-3 py-2" style={{ borderColor: statusBorderColor, backgroundColor: "var(--background-color)" }}>
              <div className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>{t(`gradebook.studentSummary.${label}`)}</div>
              <div className="mt-1 font-semibold" style={{ color: "var(--text-primary)" }}>{value}</div>
            </div>
            );
          })}
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-y py-3" style={{ borderColor: "var(--border-color)" }}>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t("gradebook.assessments")}</div>
          <Select
            aria-label={t("gradebook.assessmentFilter")}
            value={assessmentStatusFilter}
            onChange={(value) => setAssessmentStatusFilter(value as AssessmentStatusFilter)}
            options={[
              { value: "all", label: t("gradebook.statuses.all") },
              { value: "entered", label: t("gradebook.statuses.entered") },
              { value: "missing", label: t("gradebook.statuses.missing") },
              { value: "absent", label: t("gradebook.statuses.absent") },
            ]}
          />
        </div>
        {Object.entries(groupedAssessments).map(([groupId, groupAssessments]) => {
          const visibleAssessments = groupAssessments.filter(matchesAssessmentFilter);
          if (visibleAssessments.length === 0) return null;
          return (
            <section key={groupId} className="mb-5 last:mb-0">
              <div className="mb-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{t(`assessmentTypes.${groupId}`)}</div>
              <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {visibleAssessments.map((assessment) => {
                  const status = selectedStudent.statusByAssessmentId[assessment.id];
                  const isQuestionBased = assessment.deliveryMode === "QUESTION_BASED";
                  return (
                  <div key={assessment.id} className="flex min-h-[142px] flex-col rounded-lg border border-s-4 p-3" style={{ borderColor: gradebookStatusStyles[status].borderColor, backgroundColor: "var(--background-color)" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="line-clamp-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{locale === "ar" ? assessment.titleAr : assessment.title}</div>
                      <span className="rounded-full border px-2 py-0.5 text-[11px]" style={gradebookStatusStyles[status]}>{gradeLabel(assessment, selectedStudent, t("table.missing"), t("table.absent"))}</span>
                    </div>
                    <div className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{assessment.weight}% · {assessment.maxScore} {t("gradebook.points")}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full border px-2 py-0.5 text-[11px] font-medium"
                        style={{
                          borderColor: isQuestionBased ? "var(--primary-color)" : "var(--border-color)",
                          backgroundColor: isQuestionBased ? "var(--color-primary-50)" : "var(--surface-color)",
                          color: isQuestionBased ? "var(--primary-color)" : "var(--text-secondary)",
                        }}
                      >
                        {t(isQuestionBased ? "deliveryModes.questionBased" : "deliveryModes.scoreOnly")}
                      </span>
                      <span className="line-clamp-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                        {t(isQuestionBased ? "gradebook.deliveryHints.questionBased" : "gradebook.deliveryHints.scoreOnly")}
                      </span>
                    </div>
                    <div className="mt-auto flex justify-end pt-3">
                      <Button size="sm" variant="secondary" onClick={() => onOpenGrade(assessment, selectedStudent)}>
                        {isQuestionBased ? t("table.openReview") : t("gradebook.grade")}
                      </Button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
