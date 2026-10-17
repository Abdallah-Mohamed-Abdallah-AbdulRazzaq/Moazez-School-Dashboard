"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Button } from "@/components/ui";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TimetableCoverageDialog from "./TimetableCoverageDialog";
import TimetableOverviewRow from "./TimetableOverviewRow";
import {
  overviewParentConfiguration,
  overviewProgress,
  type OverviewAttention,
} from "../services/timetableOverviewProgress";
import type { StructureTree } from "../../academic-structure-tree/services/structureService";
import type {
  PublicationResponse,
  TimetableDashboardAllResponseDto,
  TimetableDashboardConfigSummaryDto,
} from "../services/timetableApiTypes";
import {
  dashboardConfigurationScope,
  timetableTargetPath,
} from "../services/timetableOverview";
import {
  overviewCoverage,
  overviewScopePath,
  overviewStageId,
  overviewStatus,
  type CoverageCategory,
} from "../services/timetableOverviewCoverage";
import type { TimetableScopeSelection } from "../services/timetableScope";

type Props = {
  readOnly: boolean;
  tree: StructureTree;
  dashboard: TimetableDashboardAllResponseDto;
  configurations: TimetableDashboardConfigSummaryDto[];
  publicationStatuses: Map<string, string>;
  publications: Map<string, PublicationResponse>;
  onOpen: (
    scope: TimetableScopeSelection,
    configId?: string,
    classroomId?: string,
  ) => void;
};

export default function TimetableOverviewList({
  tree,
  dashboard,
  configurations,
  publicationStatuses,
  publications,
  readOnly,
  onOpen,
}: Props) {
  const t = useTranslations("academics.timetable.overview");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [attentionFilter, setAttentionFilter] = useState("");
  const [selection, setSelection] = useState<{
    configId: string;
    category: CoverageCategory;
  } | null>(null);
  const rows = useMemo(
    () =>
      configurations.map((config) => {
        const coverage = overviewCoverage(tree, dashboard, config);
        const path = overviewScopePath(tree, config, locale);
        const searchText = [
          config.name,
          overviewScopePath(tree, config, "ar"),
          overviewScopePath(tree, config, "en"),
          ...Object.values(coverage)
            .flat()
            .flatMap((classroom) => [
              timetableTargetPath(tree, classroom.id, "ar"),
              timetableTargetPath(tree, classroom.id, "en"),
            ]),
        ]
          .join(" ")
          .toLocaleLowerCase(locale);
        return {
          config,
          scope: dashboardConfigurationScope(config),
          path,
          stageId: overviewStageId(tree, config),
          coverage,
          searchText,
          parent: overviewParentConfiguration(tree, config, configurations),
        };
      }),
    [configurations, tree, dashboard, locale],
  );
  const title = (row: (typeof rows)[number]) =>
    row.path ||
    (row.scope ? t(`scope.${row.scope.scopeType}`) : t("unknownScope"));
  const query = search.trim().toLocaleLowerCase(locale);
  const progressFor = (row: (typeof rows)[number]) =>
    overviewProgress(
      row.config,
      publications.get(row.config.id),
      overviewStatus(row.config, publicationStatuses.get(row.config.id)),
    );
  const needsAttention = (row: (typeof rows)[number], category: string) => {
    const progress = progressFor(row);
    const status = overviewStatus(
      row.config,
      publicationStatuses.get(row.config.id),
    );
    if (category === "uncovered") return row.coverage.uncovered.length > 0;
    if (category === "unavailable") return status === "unknown";
    if (["archived", "published"].includes(status)) return false;
    if (category === "setup")
      return ["configuration", "periods", "schedule"].includes(progress.step);
    return category === "review" && progress.needsReview;
  };
  const filtered = rows.filter((row) => {
    if (attentionFilter && !needsAttention(row, attentionFilter)) return false;
    if (scopeFilter && row.scope?.scopeType !== scopeFilter) return false;
    if (
      statusFilter &&
      overviewStatus(row.config, publicationStatuses.get(row.config.id)) !==
        statusFilter
    )
      return false;
    return (
      !query ||
      row.searchText.includes(query) ||
      title(row).toLocaleLowerCase(locale).includes(query)
    );
  });
  const groups = [
    {
      id: "default",
      label: t("schoolDefault"),
      rows: filtered.filter((row) => row.scope?.scopeType === "TERM"),
    },
    ...tree.stages.map((stage) => ({
      id: stage.id,
      label:
        locale === "ar"
          ? stage.nameAr || stage.name
          : stage.nameEn || stage.name,
      rows: filtered.filter(
        (row) => row.stageId === stage.id && row.scope?.scopeType !== "TERM",
      ),
    })),
    {
      id: "other",
      label: t("otherConfigurations"),
      rows: filtered.filter(
        (row) => !row.stageId && row.scope?.scopeType !== "TERM",
      ),
    },
  ];
  const selectedRow = rows.find((row) => row.config.id === selection?.configId);
  const filtersAwaitStatus =
    !!statusFilter ||
    ["setup", "review", "unavailable"].includes(attentionFilter);
  const pendingFilterResults =
    filtersAwaitStatus &&
    configurations.some((config) => !publicationStatuses.has(config.id));
  const clearFilters = () => {
    setSearch("");
    setScopeFilter("");
    setStatusFilter("");
    setAttentionFilter("");
  };

  return (
    <div className="space-y-4">
      <div className="grid items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1.3fr_auto]">
        <Input
          type="search"
          label={t("searchLabel")}
          placeholder={t("searchPlaceholder")}
          leftIcon={<Search aria-hidden className="h-4 w-4" />}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          label={t("scopeFilter")}
          value={scopeFilter}
          onChange={setScopeFilter}
          options={[
            { value: "", label: t("allScopes") },
            ...["TERM", "STAGE", "GRADE", "SECTION", "CLASSROOM"].map(
              (value) => ({ value, label: t(`scope.${value}`) }),
            ),
          ]}
        />
        <Select
          label={t("statusFilter")}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "", label: t("allStatuses") },
            ...[
              "published",
              "active",
              "draft",
              "archived",
              "checking",
              "unknown",
            ].map((value) => ({ value, label: t(`status.${value}`) })),
          ]}
        />
        <Select
          label={t("attentionFilter")}
          value={attentionFilter}
          onChange={setAttentionFilter}
          options={[
            { value: "", label: t("allAttention") },
            ...(
              [
                "setup",
                "review",
                "uncovered",
                "unavailable",
              ] satisfies OverviewAttention[]
            ).map((value) => ({ value, label: t(`attention.${value}`) })),
          ]}
        />
        <Button
          variant="ghost"
          className="min-h-11 focus-visible:ring-2"
          disabled={
            !search && !scopeFilter && !statusFilter && !attentionFilter
          }
          onClick={clearFilters}
        >
          {t("clearFilters")}
        </Button>
      </div>
      <p role="status" className="text-sm text-gray-600">
        {t("matchingCount", { count: filtered.length, total: rows.length })}
      </p>
      {pendingFilterResults && (
        <p role="status" className="text-sm text-primary">
          {t("filterResultsPending")}
        </p>
      )}
      {!filtered.length && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="font-semibold text-gray-950">
            {t(pendingFilterResults ? "checkingMatches" : "noMatches")}
          </p>
          <Button
            className="mt-3 min-h-11 focus-visible:ring-2"
            variant="secondary"
            onClick={clearFilters}
          >
            {t("clearFilters")}
          </Button>
        </div>
      )}
      {groups
        .filter((group) => group.rows.length)
        .map((group) => (
          <section
            key={group.id}
            aria-label={group.label}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white"
          >
            <h3 className="border-b border-gray-200 bg-gray-50 px-4 py-3 font-semibold text-gray-950">
              {group.label}{" "}
              <span className="ms-2 text-sm font-normal text-gray-500">
                {group.rows.length}
              </span>
            </h3>
            <div
              aria-hidden="true"
              className="hidden gap-4 border-b border-gray-100 px-4 py-2 text-xs font-medium text-gray-500 xl:grid xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.9fr)_10rem]"
            >
              <span>{t("scopeColumn")}</span>
              <span>{t("coverageColumn")}</span>
              <span>{t("progressColumn")}</span>
              <span>{t("actionColumn")}</span>
            </div>
            <div className="divide-y divide-gray-100">
              {[...group.rows]
                .sort((a, b) =>
                  title(a).localeCompare(title(b), locale, { numeric: true }),
                )
                .map((row) => (
                  <TimetableOverviewRow
                    key={row.config.id}
                    row={row}
                    tree={tree}
                    status={overviewStatus(
                      row.config,
                      publicationStatuses.get(row.config.id),
                    )}
                    progress={progressFor(row)}
                    readOnly={readOnly}
                    onOpen={onOpen}
                    onCoverage={(category) =>
                      setSelection({ configId: row.config.id, category })
                    }
                  />
                ))}
            </div>
          </section>
        ))}
      {selectedRow && selection && (
        <TimetableCoverageDialog
          tree={tree}
          dashboard={dashboard}
          configurations={configurations}
          classrooms={selectedRow.coverage[selection.category]}
          category={selection.category}
          scopeLabel={title(selectedRow)}
          readOnly={readOnly}
          onClose={() => setSelection(null)}
          onOpen={onOpen}
        />
      )}
    </div>
  );
}
