"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import Modal from "@/components/ui/modal/Modal";
import type { StructureTree } from "../../academic-structure-tree/services/structureService";
import type {
  TimetableDashboardAllResponseDto,
  TimetableDashboardConfigSummaryDto,
} from "../services/timetableApiTypes";
import {
  dashboardConfigurationScope,
  timetableTargetPath,
} from "../services/timetableOverview";
import {
  overviewScopePath,
  type CoverageCategory,
} from "../services/timetableOverviewCoverage";
import type { TimetableScopeSelection } from "../services/timetableScope";

type Props = {
  tree: StructureTree;
  dashboard: TimetableDashboardAllResponseDto;
  configurations: TimetableDashboardConfigSummaryDto[];
  classrooms: StructureTree["classrooms"];
  category: CoverageCategory;
  scopeLabel: string;
  readOnly: boolean;
  onClose: () => void;
  onOpen: (
    scope: TimetableScopeSelection,
    configId?: string,
    classroomId?: string,
  ) => void;
};

export default function TimetableCoverageDialog({
  tree,
  dashboard,
  configurations,
  classrooms,
  category,
  scopeLabel,
  readOnly,
  onClose,
  onOpen,
}: Props) {
  const t = useTranslations("academics.timetable.overview");
  const locale = useLocale();
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t(`coverageType.${category}`, {
        count: classrooms.length,
      })}
      description={scopeLabel}
      size="lg"
      className="motion-reduce:!animate-none motion-reduce:transition-none"
    >
      <p className="mb-4 text-sm leading-6 text-gray-600">
        {t(`coverageHelp.${category}`)}
      </p>
      <ul className="divide-y divide-gray-200">
        {classrooms.map((classroom) => {
          const dashboardItem = dashboard.items.find(
            (item) => item.classroomId === classroom.id,
          );
          const source = dashboardItem?.effectiveConfig;
          const existing =
            source ??
            configurations.find((config) => {
              const scope = dashboardConfigurationScope(config);
              return (
                scope?.scopeType === "CLASSROOM" &&
                scope.classroomId === classroom.id
              );
            });
          const scope = existing
            ? dashboardConfigurationScope(existing)
            : {
                scopeType: "CLASSROOM" as const,
                classroomId: classroom.id,
              };
          const isDraft = !source && existing?.status.toLowerCase() === "draft";
          const savedLessonCount =
            !source && existing && dashboardItem
              ? dashboardItem.entries.filter(
                  (entry) =>
                    entry.timetableConfigId === existing.id &&
                    entry.classroom.id === classroom.id &&
                    entry.subject &&
                    entry.status !== "cancelled",
                ).length
              : undefined;
          return (
            <li
              key={classroom.id}
              className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0">
                <p className="break-words font-medium text-gray-950">
                  {timetableTargetPath(tree, classroom.id, locale)}
                </p>
                <p className="mt-1 break-words text-sm text-gray-600">
                  {source
                    ? t("effectiveSource", {
                        name:
                          overviewScopePath(tree, source, locale) ||
                          t("schoolDefault"),
                      })
                    : t("noEffectiveTimetable")}
                </p>
                {!source && existing && (
                  <p className="mt-2 break-words text-sm font-medium text-primary">
                    {t(isDraft ? "draftSource" : "savedSource", {
                      name: existing.name,
                    })}
                  </p>
                )}
                {savedLessonCount !== undefined && (
                  <p className="mt-1 text-sm text-gray-600">
                    {t("savedLessonCount", { count: savedLessonCount })}
                  </p>
                )}
              </div>
              <Button
                variant="secondary"
                className="min-h-11 shrink-0 focus-visible:ring-2"
                disabled={!scope || (readOnly && !existing)}
                onClick={() =>
                  scope && onOpen(scope, existing?.id, classroom.id)
                }
              >
                {t(
                  isDraft
                    ? "openDraft"
                    : existing
                      ? "open"
                      : "configureClassroom",
                )}
              </Button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
