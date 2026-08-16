"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Link2, RefreshCcw, Send } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/components/ui/toast/Toast";
import { getHomeworkErrorMessage } from "@/features/academics/homework/services/homeworkErrors";
import {
  getHomeworkGradeSyncStatus,
  linkHomeworkGradeSync,
  syncHomeworkGrades,
} from "@/features/academics/homework/services/homeworkService";
import type {
  HomeworkAssignmentUiModel,
  HomeworkGradeSyncStatusUiModel,
} from "@/features/academics/homework/services/homeworkApi.types";
import { discoverHomeworkGradeSyncCandidates } from "@/features/academics/homework/services/homeworkGradeSyncCandidates";
import type { Assessment } from "@/features/grades/shared/types";

interface HomeworkGradeSyncPanelProps {
  homeworkId: string;
  homework: HomeworkAssignmentUiModel;
  isGraded: boolean;
}

export default function HomeworkGradeSyncPanel({
  homeworkId,
  homework,
  isGraded,
}: HomeworkGradeSyncPanelProps) {
  const locale = useLocale();
  const t = useTranslations("academics.homework.gradeSync");
  const tHomeworkError = useTranslations("academics.homework.errorMessages");
  const { hasPermission } = usePermissions();
  const canViewStatus =
    hasPermission("homework.assignments.view") &&
    hasPermission("grades.items.view");
  const canDiscoverAssessments = hasPermission("grades.assessments.view");
  const canLink =
    hasPermission("homework.assignments.manage") &&
    hasPermission("grades.assessments.manage");
  const canSync =
    hasPermission("homework.assignments.manage") &&
    hasPermission("grades.items.manage");
  const { showError, showSuccess } = useToast();
  const [status, setStatus] = useState<HomeworkGradeSyncStatusUiModel | null>(
    null,
  );
  const [gradeAssessmentId, setGradeAssessmentId] = useState("");
  const [assessmentOptions, setAssessmentOptions] = useState<SelectOption[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(canViewStatus);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(
    canDiscoverAssessments,
  );
  const [isLinking, setIsLinking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!canViewStatus) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const nextStatus = await getHomeworkGradeSyncStatus(homeworkId);
      setStatus(nextStatus);
      setGradeAssessmentId(nextStatus.gradeAssessment?.id ?? "");
    } catch (error) {
      showError(t("errors.load", { message: getHomeworkErrorMessage(error, tHomeworkError) }));
    } finally {
      setIsLoading(false);
    }
  }, [canViewStatus, homeworkId, showError, t, tHomeworkError]);

  useEffect(() => {
    void Promise.resolve().then(loadStatus);
  }, [loadStatus]);

  const loadAssessments = useCallback(async () => {
    if (
      !canDiscoverAssessments ||
      !homework.academicYearId ||
      !homework.termId ||
      !homework.subjectId
    ) {
      setAssessmentOptions([]);
      setIsLoadingAssessments(false);
      return;
    }
    setIsLoadingAssessments(true);
    try {
      const assessments = await discoverHomeworkGradeSyncCandidates(homework);
      setAssessmentOptions(
        assessments.map((assessment) => assessmentToOption(assessment, locale)),
      );
    } catch (error) {
      showError(
        t("errors.loadAssessments", { message: getHomeworkErrorMessage(error, tHomeworkError) }),
      );
    } finally {
      setIsLoadingAssessments(false);
    }
  }, [
    canDiscoverAssessments,
    homework,
    locale,
    showError,
    t,
    tHomeworkError,
  ]);

  useEffect(() => {
    void Promise.resolve().then(loadAssessments);
  }, [loadAssessments]);

  const selectOptions = linkedAssessmentOption(status, assessmentOptions);
  const isLifecycleBlocked = ["cancelled", "archived"].includes(
    homework.status.toLowerCase(),
  );
  const canCreateLink =
    canLink &&
    !isLifecycleBlocked &&
    status?.linked !== true;
  const lastSyncedAt = status?.syncSummary?.lastSyncedAt;
  const syncNeedsLink = canSync && canViewStatus && status?.linked !== true;

  const linkAssessment = async () => {
    if (!canCreateLink || !gradeAssessmentId.trim()) return;
    setIsLinking(true);
    try {
      const nextStatus = await linkHomeworkGradeSync(
        homeworkId,
        gradeAssessmentId.trim(),
      );
      setStatus(nextStatus);
      showSuccess(t("messages.linked"));
    } catch (error) {
      showError(t("errors.link", { message: getHomeworkErrorMessage(error, tHomeworkError) }));
    } finally {
      setIsLinking(false);
    }
  };

  const syncAll = async () => {
    if (!canSync) return;
    setIsSyncing(true);
    try {
      const nextStatus = await syncHomeworkGrades(homeworkId);
      setStatus(nextStatus);
      showSuccess(t("messages.synced"));
    } catch (error) {
      showError(t("errors.sync", { message: getHomeworkErrorMessage(error, tHomeworkError) }));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {t("title")}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {isGraded ? t("description") : t("notGraded")}
              </p>
            </div>
            {canViewStatus && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void loadStatus()}
                loading={isLoading}
                leftIcon={<RefreshCcw className="h-4 w-4" />}
              >
                {t("actions.refresh")}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-lg border border-border bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("link.title")}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t("link.description")}
            </p>
            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <Select
                label={t("link.assessmentId")}
                value={gradeAssessmentId}
                onChange={setGradeAssessmentId}
                options={selectOptions}
                placeholder={t("link.placeholder")}
                searchable
                searchPlaceholder={t("link.searchPlaceholder")}
                noOptionsText={
                  isLoadingAssessments
                    ? t("link.loading")
                    : t("link.noAssessments")
                }
                noResultsText={t("link.noResults")}
                disabled={!canCreateLink || isLoadingAssessments}
              />
              {canCreateLink && canDiscoverAssessments && (
                <Button
                  onClick={() => void linkAssessment()}
                  loading={isLinking}
                  disabled={!gradeAssessmentId.trim() || isLoadingAssessments}
                  leftIcon={<Link2 className="h-4 w-4" />}
                >
                  {t("actions.link")}
                </Button>
              )}
            </div>
            {canLink && !canDiscoverAssessments && (
              <p className="mt-3 text-sm text-amber-700">
                {t("link.discoveryPermissionRequired")}
              </p>
            )}
            {isLifecycleBlocked && (
              <p className="mt-3 text-sm text-gray-500">
                {t("link.lifecycleBlocked")}
              </p>
            )}
            {status?.linked && (
              <p className="mt-3 text-sm text-gray-500">
                {t("link.alreadyLinked")}
              </p>
            )}
          </section>

          <section className="rounded-lg border border-border bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("status.title")}
            </h3>
            {canViewStatus ? (
              <div className="mt-4 space-y-3">
                <StatusRow
                  label={t("status.linked")}
                  value={status?.linked ? t("status.yes") : t("status.no")}
                />
                <StatusRow
                  label={t("status.assessment")}
                  value={
                    status?.gradeAssessment?.title ||
                    status?.gradeAssessment?.id ||
                    "-"
                  }
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500">
                {t("status.permissionRequired")}
              </p>
            )}
          </section>
        </div>

        <section className="rounded-lg border border-border bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {t("sync.title")}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t("sync.description")}
              </p>
            </div>
            {canSync && (
              <Button
                onClick={() => void syncAll()}
                loading={isSyncing}
                disabled={canViewStatus && !status?.linked}
                leftIcon={<Send className="h-4 w-4" />}
              >
                {t("actions.syncAll")}
              </Button>
            )}
          </div>
          {syncNeedsLink && (
            <p className="mt-3 text-sm text-amber-700">
              {t("sync.linkRequired")}
            </p>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Metric
              label={t("summary.total")}
              value={status?.syncSummary?.total}
            />
            <Metric
              label={t("summary.synced")}
              value={status?.syncSummary?.synced}
            />
            <Metric
              label={t("summary.pending")}
              value={status?.syncSummary?.pending}
            />
            <Metric
              label={t("summary.failed")}
              value={status?.syncSummary?.failed}
            />
          </div>
          {canViewStatus && lastSyncedAt && (
            <p className="mt-3 text-sm text-gray-500">
              {t("summary.lastSynced", {
                date: new Date(lastSyncedAt).toLocaleString(locale),
              })}
            </p>
          )}
        </section>

        {(status?.warnings?.length ?? 0) > 0 && (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              {t("warnings.title")}
            </div>
            <ul className="mt-3 space-y-2 text-sm text-amber-800">
              {status?.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900">{value}</span>
    </div>
  );
}

function assessmentToOption(
  assessment: Assessment,
  locale: string,
): SelectOption {
  const localizedTitle =
    locale === "ar"
      ? assessment.titleAr || assessment.title
      : assessment.title || assessment.titleAr;
  const label = `${localizedTitle} - ${assessment.maxScore}`;
  return {
    value: assessment.id,
    label,
    searchText: [
      assessment.title,
      assessment.titleAr,
      assessment.type,
      assessment.approvalStatus,
      assessment.deliveryMode,
      assessment.date,
      assessment.id,
    ].join(" "),
  };
}

function linkedAssessmentOption(
  status: HomeworkGradeSyncStatusUiModel | null,
  options: SelectOption[],
) {
  const linkedId = status?.gradeAssessment?.id;
  if (!linkedId || options.some((option) => option.value === linkedId)) {
    return options;
  }
  return [
    {
      value: linkedId,
      label: status?.gradeAssessment?.title || linkedId,
      searchText: linkedId,
    },
    ...options,
  ];
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number | undefined;
}) {
  return (
    <div className="rounded-lg border border-border bg-gray-50 p-3">
      <div className="text-xs font-medium uppercase text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-gray-900">
        {value ?? 0}
      </div>
    </div>
  );
}
