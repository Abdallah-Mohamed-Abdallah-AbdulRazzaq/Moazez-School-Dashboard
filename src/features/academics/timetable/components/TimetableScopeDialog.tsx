"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import Modal from "@/components/ui/modal/Modal";
import Select from "@/components/ui/input/Select";
import type { StructureTree } from "../../academic-structure-tree/services/structureService";
import type {
  TimetableDashboardAllResponseDto,
  TimetableDashboardConfigSummaryDto,
} from "../services/timetableApiTypes";
import { classroomsForTimetableScope } from "../services/timetableDisplayScope";
import {
  timetableScopeTargets,
  timetableTargetPath,
} from "../services/timetableOverview";
import {
  resolveTimetableScopeSelection,
  timetableConfigScopeId,
  type TimetableScopeSelection,
} from "../services/timetableScope";
import { dashboardConfigScopeId } from "../services/timetableDashboardContract";

interface TimetableScopeDialogProps {
  tree: StructureTree;
  dashboard: TimetableDashboardAllResponseDto;
  configurations: TimetableDashboardConfigSummaryDto[];
  onClose: () => void;
  onContinue: (scope: TimetableScopeSelection, configId?: string) => void;
}

export default function TimetableScopeDialog({
  tree,
  dashboard,
  configurations,
  onClose,
  onContinue,
}: TimetableScopeDialogProps) {
  const t = useTranslations("academics.timetable.overview");
  const locale = useLocale();
  const [custom, setCustom] = useState(false);
  const [scopeType, setScopeType] =
    useState<Exclude<TimetableScopeSelection["scopeType"], "TERM">>("STAGE");
  const [targetId, setTargetId] = useState("");
  const scope = custom
    ? resolveTimetableScopeSelection({
        stageId: scopeType === "STAGE" ? targetId : undefined,
        gradeId: scopeType === "GRADE" ? targetId : undefined,
        sectionId: scopeType === "SECTION" ? targetId : undefined,
        classroomId: scopeType === "CLASSROOM" ? targetId : undefined,
      })
    : { scopeType: "TERM" as const };
  const ready = !custom || !!targetId;
  const affected = ready ? classroomsForTimetableScope({ ...tree, scope }) : [];
  const exactConfig = ready
    ? configurations.find(
        (config) =>
          config.scopeType.toUpperCase() === scope.scopeType &&
          (scope.scopeType === "TERM" ||
            dashboardConfigScopeId(config) === timetableConfigScopeId(scope)),
      )
    : undefined;
  const inherited = configurations.filter(
    (config) =>
      config.id !== exactConfig?.id &&
      dashboard.items.some(
        (item) =>
          affected.some((classroom) => classroom.id === item.classroomId) &&
          item.effectiveConfig?.id === config.id,
      ),
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t("createTitle")}
      description={t("createDescription")}
      size="lg"
      footer={
        <div className="flex w-full flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            disabled={!ready}
            onClick={() => onContinue(scope, exactConfig?.id)}
          >
            {t(exactConfig ? "openExisting" : "continue")}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="sr-only">{t("scopeChoice")}</legend>
          {[false, true].map((isCustom) => (
            <label
              key={String(isCustom)}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 focus-within:ring-2 focus-within:ring-primary ${custom === isCustom ? "border-primary bg-primary-50" : "border-gray-200"}`}
            >
              <input
                type="radio"
                name="timetable-scope-kind"
                checked={custom === isCustom}
                onChange={() => setCustom(isCustom)}
                className="mt-1 accent-primary"
              />
              <span>
                <span className="block font-semibold text-gray-950">
                  {t(isCustom ? "custom" : "schoolDefault")}
                </span>
                <span className="mt-1 block text-sm leading-6 text-gray-600">
                  {t(isCustom ? "customDescription" : "defaultDescription")}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        {custom && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={t("scopeLevel")}
              value={scopeType}
              options={(
                ["STAGE", "GRADE", "SECTION", "CLASSROOM"] as const
              ).map((value) => ({ value, label: t(`scope.${value}`) }))}
              onChange={(value) => {
                setScopeType(value as typeof scopeType);
                setTargetId("");
              }}
            />
            <Select
              label={t("scopeTarget")}
              placeholder={t("selectTarget")}
              value={targetId}
              onChange={setTargetId}
              options={timetableScopeTargets(tree, scopeType, locale)}
              searchable
              searchPlaceholder={t("searchTarget")}
              searchLabel={t("searchTarget")}
              noResultsText={t("noResults")}
              noOptionsText={t("noTargets")}
            />
          </div>
        )}
        <section
          className="rounded-xl border border-gray-200 bg-gray-50 p-4"
          aria-live="polite"
        >
          <h3 className="font-semibold text-gray-950">{t("preview")}</h3>
          {ready ? (
            <>
              <p className="mt-1 text-sm text-gray-700">
                {t("affected", { count: affected.length })}
              </p>
              <ul className="mt-3 max-h-36 space-y-1 overflow-y-auto text-sm text-gray-600">
                {affected.map((classroom) => (
                  <li key={classroom.id}>
                    {timetableTargetPath(tree, classroom.id, locale)}
                  </li>
                ))}
              </ul>
              {!affected.length && (
                <p className="mt-2 text-sm text-amber-800">
                  {t("noClassrooms")}
                </p>
              )}
              {exactConfig && (
                <p className="mt-3 text-sm font-medium text-primary">
                  {t("existing", { name: exactConfig.name })}
                </p>
              )}
              {!exactConfig && custom && inherited.length > 0 && (
                <p className="mt-3 text-sm text-amber-900">
                  {t("inherits", {
                    names: inherited
                      .map((config) => config.name)
                      .join(locale === "ar" ? "، " : ", "),
                  })}
                </p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-gray-600">{t("chooseTarget")}</p>
          )}
        </section>
      </div>
    </Modal>
  );
}
