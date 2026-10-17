"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import TimetableOverviewProgress from "./TimetableOverviewProgress";
import type { TimetableDashboardConfigSummaryDto } from "../services/timetableApiTypes";
import type { TimetableScopeSelection } from "../services/timetableScope";
import type { StructureTree } from "../../academic-structure-tree/services/structureService";
import { dashboardConfigurationScope } from "../services/timetableOverview";
import {
  overviewScopePath,
  coverageCategories,
  type overviewCoverage,
  type CoverageCategory,
} from "../services/timetableOverviewCoverage";
import type { overviewProgress } from "../services/timetableOverviewProgress";

type Props = {
  row: {
    config: TimetableDashboardConfigSummaryDto;
    scope: TimetableScopeSelection | null;
    path: string;
    parent: TimetableDashboardConfigSummaryDto | undefined;
    coverage: ReturnType<typeof overviewCoverage>;
  };
  tree: StructureTree;
  status: string;
  progress: ReturnType<typeof overviewProgress>;
  readOnly: boolean;
  onOpen: (scope: TimetableScopeSelection, configId?: string) => void;
  onCoverage: (category: CoverageCategory) => void;
};

export default function TimetableOverviewRow({
  row,
  tree,
  status,
  progress,
  readOnly,
  onOpen,
  onCoverage,
}: Props) {
  const t = useTranslations("academics.timetable.overview");
  const locale = useLocale();
  const rowTitle =
    row.path ||
    (row.scope ? t(`scope.${row.scope.scopeType}`) : t("unknownScope"));
  const parent = row.parent;
  const parentScope = parent ? dashboardConfigurationScope(parent) : null;
  return (
    <article
      aria-label={rowTitle}
      className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.9fr)_10rem] xl:items-center"
    >
      <div className="min-w-0">
        <p className="mb-1 text-xs font-medium text-primary">
          {row.scope ? t(`scope.${row.scope.scopeType}`) : t("unknownScope")}
        </p>
        <h4 className="break-words font-semibold text-gray-950">{rowTitle}</h4>
        <p className="mt-1 break-words text-sm text-gray-600">
          {row.config.name}
        </p>
        {row.scope?.scopeType !== "TERM" && (
          <div className="mt-1 text-xs leading-5 text-gray-500">
            {parent && parentScope ? (
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11 max-w-full px-0 text-start text-xs text-primary underline decoration-dotted underline-offset-4 focus-visible:ring-2"
                onClick={() => {
                  onOpen(parentScope, parent.id);
                }}
              >
                {t("parentConfiguration", {
                  name:
                    overviewScopePath(tree, parent, locale) ||
                    t("schoolDefault"),
                })}
              </Button>
            ) : (
              t("noParentConfiguration")
            )}
          </div>
        )}
        <span
          className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${status === "published" || status === "active" ? "bg-emerald-50 text-emerald-800" : "bg-gray-100 text-gray-700"}`}
        >
          {t(
            ["published", "active", "draft", "archived", "checking"].includes(
              status,
            )
              ? `status.${status}`
              : "status.unknown",
          )}
        </span>
      </div>
      <div>
        <p className="mb-1 text-xs text-gray-500">
          {t("coverage", {
            total: Object.values(row.coverage).flat().length,
            effective: row.coverage.using.length,
          })}
        </p>
        <div className="flex flex-wrap gap-x-3">
          {coverageCategories
            .filter((category) => row.coverage[category].length > 0)
            .map((category) => (
              <Button
                key={category}
                variant="ghost"
                size="sm"
                className={`min-h-11 px-1 text-start underline decoration-dotted underline-offset-4 focus-visible:ring-2 ${category === "uncovered" ? "text-amber-800" : "text-primary"}`}
                onClick={() => onCoverage(category)}
              >
                {t(`coverageType.${category}`, {
                  count: row.coverage[category].length,
                })}
              </Button>
            ))}
        </div>
      </div>
      <TimetableOverviewProgress progress={progress} />
      <Button
        variant="secondary"
        className="min-h-11 w-full focus-visible:ring-2 xl:justify-self-end"
        disabled={!row.scope}
        onClick={() => row.scope && onOpen(row.scope, row.config.id)}
      >
        {t(
          !readOnly &&
            !["published", "archived"].includes(status) &&
            progress.step !== "unknown"
            ? "continueTimetable"
            : "open",
        )}
      </Button>
    </article>
  );
}
