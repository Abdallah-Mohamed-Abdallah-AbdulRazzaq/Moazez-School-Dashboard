"use client";

import { Award, CheckCircle2, ClipboardList, Clock3 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type {
  ReinforcementTemplate,
  ReinforcementTemplateStage,
} from "../types";
import ReinforcementTableSkeleton from "./shared/ReinforcementTableSkeleton";

interface ReinforcementTemplateTableProps {
  templates: ReinforcementTemplate[];
  loading?: boolean;
  search?: string;
  canManage?: boolean;
}

const formatRewardValue = (value: unknown): string => {
  if (typeof value === "number") return new Intl.NumberFormat().format(value);
  if (typeof value === "string" && value.trim() !== "") return value;
  return "-";
};

const formatDate = (value: string | undefined, locale: string): string => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const localizedText = (
  locale: string,
  english?: string | null,
  arabic?: string | null,
): string =>
  locale === "ar" ? arabic || english || "-" : english || arabic || "-";

const sortStages = (
  stages: ReinforcementTemplateStage[] = [],
): ReinforcementTemplateStage[] =>
  [...stages].sort((left, right) => left.sortOrder - right.sortOrder);

export default function ReinforcementTemplateTable({
  templates,
  loading = false,
  search = "",
}: ReinforcementTemplateTableProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const isRTL = locale === "ar";

  const renderRewardSummary = (template: ReinforcementTemplate) => {
    const rewardType = template.reward?.type || "xp";
    const rewardValue = formatRewardValue(template.reward?.value);

    return `${t(`rewardType.${rewardType}`)} / ${rewardValue}`;
  };

  const renderStagePreview = (template: ReinforcementTemplate) => {
    const stages = sortStages(template.stages);

    if (stages.length === 0) return null;

    return (
      <div data-testid="template-stage-summary" className="">
        <div className="mb-2 flex items-center gap-3 text-xs">
          <span className="font-semibold text-slate-700">
            {t("templates.stageCount", { count: stages.length })}
          </span>
          <span className="text-slate-500">
            <span className="font-semibold text-slate-700">
              {stages.filter((stage) => stage.requiresApproval).length}
            </span>{" "}
            <span>{t("templates.table.approvalRequired")}</span>
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {stages.slice(0, 4).map((stage) => (
            <div
              key={stage.id || `${template.id}-${stage.sortOrder}`}
              className="group flex min-w-0 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary ring-1 ring-slate-200">
                {stage.sortOrder}
              </span>
              <span
                className="max-w-32 truncate font-medium text-slate-700"
                title={localizedText(locale, stage.titleEn, stage.titleAr)}
              >
                {localizedText(locale, stage.titleEn, stage.titleAr)}
              </span>
              <span className="shrink-0 text-[10px] text-slate-500">
                {t(`proofType.${stage.proofType}`)}
              </span>
              {stage.requiresApproval ? (
                <CheckCircle2
                  className="h-3.5 w-3.5 shrink-0 text-emerald-600"
                  aria-label={t("templates.table.approvalRequired")}
                />
              ) : null}
            </div>
          ))}
          {stages.length > 4 ? (
            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1.5 text-xs font-semibold text-slate-600">
              +{stages.length - 4}
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  if (loading) return <ReinforcementTableSkeleton columns={5} />;

  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
        <ClipboardList className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-3 text-sm font-medium text-gray-900">
          {t("emptyStates.templates")}
        </p>
        {search ? (
          <p className="mt-1 text-sm text-gray-500">
            {t("templates.noSearchResults")}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="w-[30%] px-5 py-3.5 text-start text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {t("templates.table.template")}
              </th>
              <th className="w-[22%] px-4 py-3.5 text-start text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {t("templates.table.reward")}
              </th>
              <th className="w-[30%] px-4 py-3.5 text-start text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {t("templates.table.stages")}
              </th>
              <th className="w-[9%] px-4 py-3.5 text-start text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {t("templates.table.createdAt")}
              </th>
              <th className="w-[9%] px-4 py-3.5 text-start text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {t("templates.table.updatedAt")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {templates.map((template) => (
              <tr
                key={template.id}
                className="group transition-colors hover:bg-slate-50/70 focus-within:bg-slate-50/70"
              >
                <td className="max-w-sm px-5 py-5 align-top">
                  <div className="font-semibold leading-6 text-slate-900">
                    {locale === "ar"
                      ? template.nameAr || template.nameEn
                      : template.nameEn || template.nameAr}
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                    {locale === "ar"
                      ? template.descriptionAr || template.descriptionEn
                      : template.descriptionEn || template.descriptionAr}
                  </div>
                </td>
                <td
                  data-testid="template-metadata"
                  className="px-4 py-5 align-top"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      <Award className="h-3.5 w-3.5" />
                      {renderRewardSummary(template)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {t(`source.${template.source}`)}
                    </span>
                  </div>
                  {(template.reward?.labelEn || template.reward?.labelAr) && (
                    <div className="mt-2 text-xs text-slate-500">
                      {localizedText(
                        locale,
                        template.reward.labelEn,
                        template.reward.labelAr,
                      )}
                    </div>
                  )}
                </td>
                <td className="min-w-80 px-4 py-5 align-top text-sm text-slate-700">
                  {renderStagePreview(template)}
                </td>
                <td className="px-4 py-5 align-top text-xs text-slate-500">
                  {formatDate(template.createdAt, locale)}
                </td>
                <td className="px-4 py-5 align-top text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formatDate(template.updatedAt, locale)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className="grid gap-3 bg-slate-50/50 p-3 lg:hidden"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {templates.map((template) => (
          <article
            key={template.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-bold leading-5 text-slate-900">
                  {locale === "ar"
                    ? template.nameAr || template.nameEn
                    : template.nameEn || template.nameAr}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                  {locale === "ar"
                    ? template.descriptionAr || template.descriptionEn
                    : template.descriptionEn || template.descriptionAr}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                {template.stages?.length || 0}
              </span>
            </div>
            <div
              data-testid="template-metadata"
              className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                <Award className="h-3.5 w-3.5" />
                {renderRewardSummary(template)}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium">
                {t(`source.${template.source}`)}
              </span>
            </div>
            {(template.reward?.labelEn || template.reward?.labelAr) && (
              <p className="mt-2 text-xs text-slate-500">
                {localizedText(
                  locale,
                  template.reward.labelEn,
                  template.reward.labelAr,
                )}
              </p>
            )}
            {renderStagePreview(template)}
            <div className="mt-4 grid gap-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>
                {t("templates.table.createdAt")}:{" "}
                {formatDate(template.createdAt, locale)}
              </span>
              <span>
                {t("templates.table.updatedAt")}:{" "}
                {formatDate(template.updatedAt, locale)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
