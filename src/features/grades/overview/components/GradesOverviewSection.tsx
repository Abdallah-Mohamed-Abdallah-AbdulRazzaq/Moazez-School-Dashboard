"use client";

import { useLocale, useTranslations } from "next-intl";
import { Award, BookOpenCheck, CheckCheck, ClipboardCheck, FileQuestion, Lock, Pencil, Send, ShieldCheck, TrendingUp } from "lucide-react";
import { LineChart } from "@mui/x-charts/LineChart";
import Button from "@/components/ui/button/Button";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import type { Assessment } from "../types";
import { getAssessmentTypeLabelKey } from "../../assessments/services/gradesAssessmentsService";
import {
  ASSESSMENT_WORKFLOW_STATE_STYLES,
  getAssessmentEntryModeKey,
  getAssessmentWorkflowState,
  isGradeEntryAvailable,
} from "../../shared/utils/assessmentWorkflow";

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

interface GradesOverviewSectionProps {
  summary: {
    totalStudents: number;
    totalAssessments: number;
    classAverage: number;
    highestAverage: number;
    lowestAverage: number;
    completionRate: number;
  };
  trend: Array<{ label: string; average: number }>;
  gradeRule: { passMark: number } | null;
  emptyState: { reason: string; message: string } | null;
  assessments: Assessment[];
  isReadOnly: boolean;
  canManageAssessments: boolean;
  canPublishAssessments: boolean;
  canApproveAssessments: boolean;
  canLockAssessments: boolean;
  canManageGradeItems: boolean;
  canManageQuestions: boolean;
  isBulkLoading: boolean;
  assessmentActionId: string | null;
  assessmentActionType: "publish" | "approve" | "lock" | "bulk" | "delete" | null;
  onBulkEntry: (assessment: Assessment) => void;
  onPublish: (assessmentId: string) => void;
  onApprove: (assessmentId: string) => void;
  onLock: (assessmentId: string) => void;
  onEdit: (assessment: Assessment) => void;
  onManageQuestions: (assessment: Assessment) => void;
}

export default function GradesOverviewSection({
  summary,
  trend,
  gradeRule,
  emptyState,
  assessments,
  isReadOnly,
  canManageAssessments,
  canPublishAssessments,
  canApproveAssessments,
  canLockAssessments,
  canManageGradeItems,
  canManageQuestions,
  isBulkLoading,
  assessmentActionId,
  assessmentActionType,
  onBulkEntry,
  onPublish,
  onApprove,
  onLock,
  onEdit,
  onManageQuestions,
}: GradesOverviewSectionProps) {
  const t = useTranslations("academics.grades");
  const locale = useLocale();
  const renderWorkflowAction = (assessment: Assessment) => {
    if (isReadOnly || assessment.isLocked) return null;

    if (assessment.approvalStatus === "draft" && canPublishAssessments) {
      return (
        <Button
          variant="secondary"
          size="sm"
          loading={assessmentActionId === assessment.id && assessmentActionType === "publish"}
          onClick={() => onPublish(assessment.id)}
        >
          {t("actions.publish")}
        </Button>
      );
    }

    if (assessment.approvalStatus === "published" && canApproveAssessments) {
      return (
        <Button
          variant="secondary"
          size="sm"
          loading={assessmentActionId === assessment.id && assessmentActionType === "approve"}
          onClick={() => onApprove(assessment.id)}
        >
          {t("actions.approve")}
        </Button>
      );
    }

    if (assessment.approvalStatus !== "approved" || !canLockAssessments) return null;

    return (
      <Button
        variant="secondary"
        size="sm"
        loading={assessmentActionId === assessment.id && assessmentActionType === "lock"}
        onClick={() => onLock(assessment.id)}
      >
        {t("actions.lock")}
      </Button>
    );
  };

  return (
    <>
      {emptyState ? (
        <div className="border border-[var(--border-color)] bg-[var(--surface-color)] p-4 text-sm text-[var(--text-secondary)]">
          {emptyState.message}
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICardV2 title={t("kpis.students")} value={summary.totalStudents} icon={BookOpenCheck} iconColor="var(--primary-color)" iconBgColor="var(--color-primary-100)" showChart={false} />
        <KPICardV2 title={t("kpis.assessments")} value={summary.totalAssessments} icon={ClipboardCheck} iconColor="var(--accent-color)" iconBgColor="var(--color-primary-50)" showChart={false} />
        <KPICardV2 title={t("kpis.classAverage")} value={formatPercent(summary.classAverage)} icon={Award} iconColor="var(--success-text)" iconBgColor="var(--success-bg)" showChart={false} />
        <KPICardV2 title={t("kpis.completionRate")} value={formatPercent(summary.completionRate)} icon={CheckCheck} iconColor="var(--warning-text)" iconBgColor="var(--warning-bg)" showChart={false} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
          <div className="mb-4">
            <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{t("trend.title")}</div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("trend.subtitle")}</div>
          </div>
          {trend.length === 0 ? (
            <div className="rounded-lg border p-6 text-center text-sm" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>
              {t("emptyState.noAssessments")}
            </div>
          ) : (
            <LineChart
              xAxis={[{ scaleType: "point", data: trend.map((point) => point.label) }]}
              series={[{ data: trend.map((point) => point.average), label: t("trend.average"), color: "var(--primary-color)", curve: "linear" }]}
              height={280}
              margin={{ top: 16, right: 16, bottom: 32, left: 48 }}
            />
          )}
        </div>

        <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" style={{ color: "var(--primary-color)" }} />
            <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{t("summaryPanel.title")}</div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-secondary)" }}>{t("summaryPanel.highest")}</span>
              <span className="font-semibold">{formatPercent(summary.highestAverage)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-secondary)" }}>{t("summaryPanel.lowest")}</span>
              <span className="font-semibold">{formatPercent(summary.lowestAverage)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-secondary)" }}>{t("summaryPanel.passMark")}</span>
              <span className="font-semibold">{gradeRule?.passMark ?? 50}%</span>
            </div>
          </div>
          <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--border-color)" }}>
            <div className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t("summaryPanel.assessments")}</div>
            <div className="space-y-2">
              {assessments.map((assessment) => {
                const workflowState = getAssessmentWorkflowState(assessment);
                const workflowStyle = ASSESSMENT_WORKFLOW_STATE_STYLES[workflowState];
                const entryModeKey = getAssessmentEntryModeKey(assessment);

                return (
                <div key={assessment.id} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-color)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {locale === "ar" ? assessment.titleAr : assessment.title}
                      </div>
                      <div style={{ color: "var(--text-secondary)" }}>
                        {t(`assessmentTypes.${getAssessmentTypeLabelKey(assessment.type)}`)} · {assessment.weight}%
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full border px-2 py-0.5 text-xs font-medium" style={workflowStyle}>
                          {t(`workflow.statuses.${workflowState}`)}
                        </span>
                        <span className="rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>
                          {t(`workflow.entry.${entryModeKey}`)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {assessment.approvalStatus === "published" && <Send className="h-4 w-4" style={{ color: "var(--accent-color)" }} />}
                      {assessment.approvalStatus === "approved" && <ShieldCheck className="h-4 w-4" style={{ color: "var(--success-text)" }} />}
                      {assessment.isLocked && <Lock className="h-4 w-4" style={{ color: "var(--warning-text)" }} />}
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {assessment.deliveryMode === "QUESTION_BASED" && canManageQuestions ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onManageQuestions(assessment)}
                        leftIcon={<FileQuestion className="h-4 w-4" />}
                      >
                        {t("actions.manageQuestions")}
                      </Button>
                    ) : null}
                    {canManageAssessments ? <Button
                      variant="secondary"
                      size="sm"
                      disabled={assessment.isLocked || isReadOnly}
                      onClick={() => onEdit(assessment)}
                      leftIcon={<Pencil className="h-4 w-4" />}
                    >
                      {t("actions.edit")}
                    </Button> : null}
                    {canManageGradeItems ? <Button
                      variant="secondary"
                      size="sm"
                      disabled={
                        !isGradeEntryAvailable(assessment) ||
                        isReadOnly ||
                        isBulkLoading
                      }
                      loading={assessmentActionId === assessment.id && assessmentActionType === "bulk" && isBulkLoading}
                      onClick={() => onBulkEntry(assessment)}
                    >
                      {t("actions.bulkEntry")}
                    </Button> : null}
                    {renderWorkflowAction(assessment)}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
