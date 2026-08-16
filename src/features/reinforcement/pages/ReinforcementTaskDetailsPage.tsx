"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import ReinforcementBadge from "../components/shared/ReinforcementBadge";
import { useReinforcementAcademicContext } from "../hooks/useReinforcementAcademicContext";
import { useReinforcementLocale } from "../hooks/useReinforcementLocale";
import type { ReinforcementTask } from "../types/reinforcement";
import { getReinforcementTaskById } from "../services/reinforcementService";
import ReinforcementGlobalExportModal from "../shared/components/export/ReinforcementGlobalExportModal";
import {
  exportReinforcementData,
  formatReinforcementExportDate,
  generateReinforcementExportFilename,
  type ExportSection,
  type ReinforcementExportFormat,
} from "../shared/utils/reinforcementExport";

interface ReinforcementTaskDetailsPageProps {
  taskId: string;
}

export default function ReinforcementTaskDetailsPage({
  taskId,
}: ReinforcementTaskDetailsPageProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("reinforcement.details");
  const tExport = useTranslations("reinforcement.export");
  const reinforcementT = useTranslations("reinforcement");
  const { getLocalizedText } = useReinforcementLocale();
  const { selectedAcademicYear, selectedTerm } =
    useReinforcementAcademicContext();
  const [task, setTask] = useState<ReinforcementTask | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    getReinforcementTaskById(taskId).then(setTask);
  }, [taskId]);

  const formatDate = useCallback(
    (value?: string) =>
      value
        ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
            new Date(value),
          )
        : "",
    [locale],
  );

  const formatDateTime = useCallback(
    (value?: string) =>
      value
        ? new Intl.DateTimeFormat(locale, {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(value))
        : "",
    [locale],
  );

  const timelineItems = useMemo(() => {
    if (!task) return [];

    return [
      {
        id: "created",
        label: t("timeline.created"),
        value: formatDateTime(task.createdAt),
      },
      {
        id: "updated",
        label: t("timeline.updated"),
        value: formatDateTime(task.updatedAt),
      },
      ...task.stages
        .filter((stage) => stage.submittedAt)
        .map((stage) => ({
          id: stage.id,
          label: getLocalizedText(stage.titleAr, stage.titleEn),
          value: formatDateTime(stage.submittedAt),
        })),
    ];
  }, [formatDateTime, getLocalizedText, task, t]);

  const detailSections = useMemo<ExportSection[]>(() => {
    if (!task) return [];

    return [
      {
        title: locale === "ar" ? "ملخص المهمة" : "Task Summary",
        columns: [
          { key: "field", label: locale === "ar" ? "الحقل" : "Field" },
          { key: "value", label: locale === "ar" ? "القيمة" : "Value" },
        ],
        rows: [
          { field: locale === "ar" ? "رقم المهمة" : "Task ID", value: task.id },
          {
            field: locale === "ar" ? "العنوان" : "Title",
            value: getLocalizedText(task.titleAr, task.titleEn),
          },
          {
            field: locale === "ar" ? "العنوان باللغة الأخرى" : "Alternate title",
            value: locale === "ar" ? task.titleEn : task.titleAr,
          },
          {
            field: t("description"),
            value: getLocalizedText(task.descriptionAr || "", task.descriptionEn || ""),
          },
          {
            field: t("assignmentLevel"),
            value: reinforcementT(`assignmentScope.${task.primaryTargetType}`),
          },
          {
            field: locale === "ar" ? "الجمهور" : "Audience",
            value: getLocalizedText(task.targetSummaryAr, task.targetSummaryEn),
          },
          {
            field: locale === "ar" ? "عدد الجمهور" : "Audience count",
            value: task.audienceCount,
          },
          {
            field: t("rewardSection"),
            value: `${reinforcementT(`rewardType.${task.rewardType}`)} - ${task.rewardValue}`,
          },
          { field: t("assignedBy"), value: task.assignedByName || "" },
          { field: t("dueDate"), value: formatDate(task.dueDate) },
          {
            field: locale === "ar" ? "الحالة" : "Status",
            value: reinforcementT(`status.${task.status}`),
          },
          {
            field: locale === "ar" ? "المصدر" : "Source",
            value: reinforcementT(`source.${task.source}`),
          },
          {
            field: locale === "ar" ? "تاريخ الإنشاء" : "Created at",
            value: formatDateTime(task.createdAt),
          },
          {
            field: locale === "ar" ? "آخر تحديث" : "Updated at",
            value: formatDateTime(task.updatedAt),
          },
        ],
      },
      {
        title: locale === "ar" ? "الأهداف" : "Targets",
        columns: [
          { key: "scope", label: locale === "ar" ? "النطاق" : "Scope" },
          { key: "name", label: locale === "ar" ? "الاسم" : "Name" },
          {
            key: "alternateName",
            label: locale === "ar" ? "الاسم باللغة الأخرى" : "Alternate name",
          },
          {
            key: "audienceCount",
            label: locale === "ar" ? "عدد الجمهور" : "Audience count",
          },
        ],
        rows: task.targets.map((target) => ({
          scope: reinforcementT(`assignmentScope.${target.scopeType}`),
          name: getLocalizedText(target.nameAr, target.nameEn),
          alternateName: locale === "ar" ? target.nameEn : target.nameAr,
          audienceCount: target.audienceCount ?? "",
        })),
      },
      {
        title: t("stages"),
        columns: [
          { key: "title", label: locale === "ar" ? "العنوان" : "Title" },
          {
            key: "proofType",
            label: locale === "ar" ? "نوع الإثبات" : "Proof type",
          },
          { key: "completed", label: t("stageStatus.completed") },
          { key: "approved", label: t("stageStatus.approved") },
          { key: "submittedAt", label: t("stageStatus.submittedAt") },
          {
            key: "proofUrl",
            label: locale === "ar" ? "رابط الإثبات" : "Proof URL",
          },
        ],
        rows: task.stages.map((stage) => ({
          title: getLocalizedText(stage.titleAr, stage.titleEn),
          proofType: reinforcementT(`proofType.${stage.proofType}`),
          completed: stage.isCompleted ? t("yes") : t("no"),
          approved: stage.isApproved ? t("yes") : t("no"),
          submittedAt: formatDateTime(stage.submittedAt),
          proofUrl: stage.proofUrl || "",
        })),
      },
      {
        title: t("timeline.title"),
        columns: [
          { key: "label", label: locale === "ar" ? "العنصر" : "Item" },
          { key: "value", label: locale === "ar" ? "الوقت" : "Timestamp" },
        ],
        rows: timelineItems,
      },
      {
        title: t("attachments"),
        columns: [
          { key: "stage", label: locale === "ar" ? "المرحلة" : "Stage" },
          {
            key: "proofUrl",
            label: locale === "ar" ? "رابط الإثبات" : "Proof URL",
          },
        ],
        rows: task.stages
          .filter((stage) => stage.proofUrl)
          .map((stage) => ({
            stage: getLocalizedText(stage.titleAr, stage.titleEn),
            proofUrl: stage.proofUrl || "",
          })),
      },
    ];
  }, [
    formatDate,
    formatDateTime,
    getLocalizedText,
    locale,
    reinforcementT,
    t,
    task,
    timelineItems,
  ]);

  const handleExport = async (format: ReinforcementExportFormat) => {
    if (!task) return;

    exportReinforcementData({
      title: getLocalizedText(task.titleAr, task.titleEn),
      metadata: {
        yearName: selectedAcademicYear?.name || undefined,
        termName: selectedTerm?.name || undefined,
        viewName: t("description"),
        exportDate: formatReinforcementExportDate(locale),
      },
      filename: generateReinforcementExportFilename("reinforcement-task", task.id),
      format,
      sections: detailSections,
      jsonData: {
        title: "Reinforcement Task Details",
        metadata: {
          yearName: selectedAcademicYear?.name || null,
          termName: selectedTerm?.name || null,
          exportDate: formatReinforcementExportDate("en"),
        },
        task: {
          id: task.id,
          titleEn: task.titleEn,
          titleAr: task.titleAr,
          descriptionEn: task.descriptionEn || null,
          descriptionAr: task.descriptionAr || null,
          source: task.source,
          status: task.status,
          rewardType: task.rewardType,
          rewardValue: task.rewardValue,
          dueDate: task.dueDate || null,
          assignedById: task.assignedById || null,
          assignedByName: task.assignedByName || null,
          primaryTargetType: task.primaryTargetType,
          primaryTargetId: task.primaryTargetId,
          targetSummaryEn: task.targetSummaryEn,
          targetSummaryAr: task.targetSummaryAr,
          audienceCount: task.audienceCount,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        },
        targets: task.targets,
        stages: task.stages,
        timeline: timelineItems,
        attachments: task.stages
          .filter((stage) => stage.proofUrl)
          .map((stage) => ({
            stageId: stage.id,
            titleEn: stage.titleEn,
            titleAr: stage.titleAr,
            proofUrl: stage.proofUrl,
          })),
      },
      locale,
      emptyMessage: tExport("errors.noData"),
    });
  };

  if (!task) {
    return <div className="rounded-xl bg-white p-6 shadow-sm">{t("notFound")}</div>;
  }

  const isSingleStudentTask =
    task.primaryTargetType === "student" && task.targets.length === 1;

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            onClick={() => router.push(`/${locale}/reinforcement/tasks`)}
            className="text-sm font-medium text-gray-500 hover:text-primary"
          >
            {t("back")}
          </button>
          <Button
            variant="secondary"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => setIsExportModalOpen(true)}
          >
            {tExport("button")}
          </Button>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getLocalizedText(task.titleAr, task.titleEn)}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              {isSingleStudentTask ? (
                <>
                  <span>{task.studentName}</span>
                  <span>&bull;</span>
                  <span>{task.className}</span>
                </>
              ) : (
                <>
                  <span>{getLocalizedText(task.targetSummaryAr, task.targetSummaryEn)}</span>
                  <span>&bull;</span>
                  <span>{t("audienceCount", { count: task.audienceCount })}</span>
                </>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ReinforcementBadge type="status" value={task.status} />
              <ReinforcementBadge type="source" value={task.source} />
              <ReinforcementBadge type="rewardType" value={task.rewardType} />
              <ReinforcementBadge type="scope" value={task.primaryTargetType} />
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-sm text-gray-500">{t("rewardSection")}</div>
            <div className="mt-1 text-base font-semibold text-gray-900">
              {task.rewardValue}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {t("assignedBy")}: {task.assignedByName || "-"}
            </div>
            <div className="text-sm text-gray-500">
              {t("dueDate")}: {task.dueDate || "-"}
            </div>
          </div>
        </div>
      </div>

      <ReinforcementGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        title={tExport("title")}
        subtitle={getLocalizedText(task.titleAr, task.titleEn)}
        datasetCount={1}
        emptyStateMessage={tExport("errors.noData")}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr,0.75fr]">
        <div className="space-y-6">
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              {t("description")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {getLocalizedText(task.descriptionAr || "", task.descriptionEn || "")}
            </p>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">{t("stages")}</h2>
            <div className="mt-4 space-y-3">
              {task.stages.map((stage, index) => (
                <div key={stage.id} className="rounded-lg border border-gray-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {index + 1}. {getLocalizedText(stage.titleAr, stage.titleEn)}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {getLocalizedText(
                          stage.descriptionAr || "",
                          stage.descriptionEn || "",
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <ReinforcementBadge type="proofType" value={stage.proofType} />
                      <ReinforcementBadge
                        type="active"
                        value={stage.isApproved ? "active" : "inactive"}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span>
                      {t("stageStatus.completed")}:{" "}
                      {stage.isCompleted ? t("yes") : t("no")}
                    </span>
                    <span>
                      {t("stageStatus.approved")}:{" "}
                      {stage.isApproved ? t("yes") : t("no")}
                    </span>
                    <span>
                      {t("stageStatus.submittedAt")}:{" "}
                      {formatDateTime(stage.submittedAt) || "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              {t("attachments")}
            </h2>
            <div className="mt-4 space-y-3">
              {task.stages.filter((stage) => stage.proofUrl).length > 0 ? (
                task.stages
                  .filter((stage) => stage.proofUrl)
                  .map((stage) => (
                    <div
                      key={stage.id}
                      className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600"
                    >
                      <div className="font-medium text-gray-900">
                        {getLocalizedText(stage.titleAr, stage.titleEn)}
                      </div>
                      <div className="mt-1">{stage.proofUrl}</div>
                    </div>
                  ))
              ) : (
                <div className="rounded-lg bg-gray-50 px-4 py-6 text-sm text-gray-500">
                  {t("noAttachments")}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              {t("audienceSummary")}
            </h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-gray-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t("assignmentLevel")}
                </div>
                <div className="mt-2">
                  <ReinforcementBadge type="scope" value={task.primaryTargetType} />
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t("targetList")}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {task.targets.map((target) => (
                    <span
                      key={`${target.scopeType}:${target.scopeId}`}
                      className="inline-flex rounded-full bg-white px-3 py-1 text-sm text-gray-700 ring-1 ring-gray-200"
                    >
                      {getLocalizedText(target.nameAr, target.nameEn)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
                {t("audienceCount", { count: task.audienceCount })}
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              {t("timeline.title")}
            </h2>
            <div className="mt-4 space-y-3">
              {timelineItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-gray-100 px-4 py-3"
                >
                  <div className="text-sm font-medium text-gray-900">{item.label}</div>
                  <div className="mt-1 text-xs text-gray-500">{item.value}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
