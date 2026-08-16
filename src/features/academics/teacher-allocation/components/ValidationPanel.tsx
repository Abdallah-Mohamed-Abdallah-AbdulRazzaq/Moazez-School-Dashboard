"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { X, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Drawer } from "@mui/material";
import Button from "@/components/ui/button/Button";
import {
  fetchTeacherAllocationValidation,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import type {
  TeacherAllocationValidationResponse,
} from "@/features/academics/teacher-allocation/services/teacherAllocationApi.types";
import { teacherAllocationUiError } from "@/features/academics/teacher-allocation/services/teacherAllocationErrors";
import TeacherAllocationTechnicalDetails from "./TeacherAllocationTechnicalDetails";

interface ValidationPanelProps {
  open: boolean;
  onClose: () => void;
  termId: string;
  gradeId?: string;
  subjectId?: string;
}

type ValidationItem = TeacherAllocationValidationResponse["items"][number];
type ValidationSummary = TeacherAllocationValidationResponse["summary"];
type ValidationIssue = ValidationItem["issues"][number];

const summaryMetrics: Array<{
  key: keyof ValidationSummary;
  labelKey: string;
  tone: "neutral" | "danger" | "warning";
}> = [
  { key: "missingTeacherAssignments", labelKey: "summary.missingTeacherAssignments", tone: "danger" },
  { key: "missingSubjectAllocationRows", labelKey: "summary.missingSubjectAllocationRows", tone: "warning" },
  { key: "overAllocatedSubjects", labelKey: "summary.overAllocatedSubjects", tone: "warning" },
  { key: "underAllocatedSubjects", labelKey: "summary.underAllocatedSubjects", tone: "warning" },
  { key: "teacherAllocationRows", labelKey: "summary.teacherAllocationRows", tone: "neutral" },
  { key: "subjectAllocationRows", labelKey: "summary.subjectAllocationRows", tone: "neutral" },
];

function localizedName(
  record: { nameAr?: string | null; nameEn?: string | null } | null,
  locale: string,
) {
  if (!record) return "-";
  return locale === "ar"
    ? (record.nameAr || record.nameEn || "-")
    : (record.nameEn || record.nameAr || "-");
}

function statusBadgeClass(status: string) {
  if (status === "complete") {
    return "bg-green-50 text-green-700 border-green-200";
  }
  if (status === "missing_subject_allocation") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return "bg-red-50 text-red-700 border-red-200";
}

function summaryCardClass(tone: "neutral" | "danger" | "warning", count: number) {
  if (tone === "danger" && count > 0) {
    return "bg-red-50 border-red-200 text-red-700";
  }
  if (tone === "warning" && count > 0) {
    return "bg-amber-50 border-amber-200 text-amber-700";
  }
  return "bg-white border-gray-200 text-gray-900";
}

function hasValidationIssues(summary: ValidationSummary) {
  return (
    summary.missingTeacherAssignments > 0 ||
    summary.missingSubjectAllocationRows > 0 ||
    summary.overAllocatedSubjects > 0 ||
    summary.underAllocatedSubjects > 0
  );
}

export default function ValidationPanel({
  open,
  onClose,
  termId,
  gradeId,
  subjectId,
}: ValidationPanelProps) {
  const t = useTranslations("academics.teacherAllocation.validation");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [validationResponse, setValidationResponse] =
    useState<TeacherAllocationValidationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadErrorTraceId, setLoadErrorTraceId] = useState<string | undefined>();
  const [loadErrorDetails, setLoadErrorDetails] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;

    let isCurrentRequest = true;
    void Promise.resolve().then(() => {
      setIsLoading(true);
      setLoadError(null);
      setLoadErrorTraceId(undefined);
      setLoadErrorDetails([]);
      setValidationResponse(null);
    });

    fetchTeacherAllocationValidation({ termId, gradeId, subjectId })
      .then((response) => {
        if (isCurrentRequest) {
          setValidationResponse(response);
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to load teacher allocation validation:", error);
        if (isCurrentRequest) {
          const uiError = teacherAllocationUiError(
            error,
            "Failed to load validation.",
          );
          setValidationResponse(null);
          setLoadError(uiError.message);
          setLoadErrorTraceId(uiError.traceId);
          setLoadErrorDetails(uiError.details);
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [gradeId, open, subjectId, termId]);

  const validationItems = useMemo(() => {
    return validationResponse?.items ?? [];
  }, [validationResponse]);

  const summary = validationResponse?.summary;
  const hasIssues = summary ? hasValidationIssues(summary) : false;
  const focusValidationIssue = (
    validationItem: ValidationItem,
    validationIssue: ValidationIssue,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    if (validationItem.gradeId) {
      params.set("grade", validationItem.gradeId);
    }
    if (validationItem.subjectId) {
      params.set("subject", validationItem.subjectId);
    }
    params.set("missing", "1");

    const [firstClassroomId] = validationIssue.classroomIds ?? [];
    if (firstClassroomId && validationItem.subjectId) {
      params.set("classroom", firstClassroomId);
      params.set(
        "highlightCell",
        `${firstClassroomId}:${validationItem.subjectId}`,
      );
    } else {
      params.delete("classroom");
      params.delete("highlightCell");
    }

    router.push(`?${params.toString()}`, { scroll: false });
    onClose();
  };

  return (
    <Drawer
      anchor={locale === "ar" ? "left" : "right"}
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: { xs: "100%", sm: 560 },
          maxWidth: "100%",
        },
      }}
    >
      <div className="flex h-full flex-col bg-gray-50">
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 transition-colors hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex h-48 items-center justify-center text-gray-600">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span>{t("loading")}</span>
            </div>
          )}

          {!isLoading && loadError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div>{loadError}</div>
              <TeacherAllocationTechnicalDetails
                traceId={loadErrorTraceId}
                details={loadErrorDetails}
              />
            </div>
          )}

          {!isLoading && !loadError && summary && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {summaryMetrics.map((summaryMetric) => {
                  const count = summary[summaryMetric.key];
                  return (
                    <div
                      key={summaryMetric.key}
                      className={`rounded-lg border p-4 ${summaryCardClass(summaryMetric.tone, count)}`}
                    >
                      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        {t(summaryMetric.labelKey)}
                      </div>
                      <div className="mt-2 text-2xl font-bold">{count}</div>
                    </div>
                  );
                })}
              </div>

              {!hasIssues && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
                  <CheckCircle className="mx-auto mb-3 h-10 w-10 text-green-600" />
                  <p className="font-medium text-green-800">{t("noIssues")}</p>
                </div>
              )}

              <div className="space-y-3">
                {validationItems.map((validationItem) => (
                  <ValidationRow
                    key={`${validationItem.gradeId || "grade"}-${validationItem.subjectId || "subject"}-${validationItem.status}`}
                    validationItem={validationItem}
                    locale={locale}
                    labels={{
                      weeklyHours: t("metrics.weeklyHours"),
                      classroomCount: t("metrics.classroomCount"),
                      allocatedClassrooms: t("metrics.allocatedClassrooms"),
                      missingClassrooms: t("metrics.missingClassrooms"),
                    }}
                    statusLabels={{
                      complete: t("status.complete"),
                      incomplete: t("status.incomplete"),
                      missingSubjectAllocation: t("status.missingSubjectAllocation"),
                    }}
                    onIssueClick={focusValidationIssue}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <Button onClick={onClose} variant="primary" className="w-full">
            {t("close")}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

function ValidationRow({
  validationItem,
  locale,
  labels,
  statusLabels,
  onIssueClick,
}: {
  validationItem: ValidationItem;
  locale: string;
  labels: {
    weeklyHours: string;
    classroomCount: string;
    allocatedClassrooms: string;
    missingClassrooms: string;
  };
  statusLabels: {
    complete: string;
    incomplete: string;
    missingSubjectAllocation: string;
  };
  onIssueClick: (
    validationItem: ValidationItem,
    validationIssue: ValidationIssue,
  ) => void;
}) {
  const statusLabel =
    validationItem.status === "missing_subject_allocation"
      ? statusLabels.missingSubjectAllocation
      : validationItem.status === "complete"
        ? statusLabels.complete
        : statusLabels.incomplete;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">
            {localizedName(validationItem.grade, locale)}
          </div>
          <div className="text-sm text-gray-600">
            {localizedName(validationItem.subject, locale)}
            {validationItem.subject?.code ? ` (${validationItem.subject.code})` : ""}
          </div>
        </div>
        <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusBadgeClass(validationItem.status)}`}>
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Metric label={labels.weeklyHours} value={validationItem.weeklyHours ?? "-"} />
        <Metric label={labels.classroomCount} value={validationItem.classroomCount} />
        <Metric label={labels.allocatedClassrooms} value={validationItem.allocatedClassroomCount} />
        <Metric label={labels.missingClassrooms} value={validationItem.missingClassroomCount} />
      </div>

      {validationItem.issues.length > 0 && (
        <div className="mt-4 space-y-2">
          {validationItem.issues.map((issue) => (
            <button
              type="button"
              key={`${issue.code}-${issue.message}`}
              onClick={() => onIssueClick(validationItem, issue)}
              className="flex w-full items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-left text-sm text-red-700 transition-colors hover:bg-red-100"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{issue.message}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-gray-50 px-3 py-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 font-semibold text-gray-900">{value}</div>
    </div>
  );
}
