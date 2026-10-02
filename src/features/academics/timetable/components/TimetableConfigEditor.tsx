"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import Select from "@/components/ui/input/Select";
import {
  TimetableFieldError,
  TimetableFormErrors,
  timetableInputClassName,
} from "@/features/academics/timetable/components/TimetableFormFeedback";
import type {
  BackendTimetableConfigDto,
  TimetableScopeType,
} from "@/features/academics/timetable/services/timetableApiTypes";
import { upsertBackendTimetableConfig } from "@/features/academics/timetable/services/timetableConfigService";
import {
  resolveTimetableScopeSelection,
  type TimetableScopeIds,
} from "@/features/academics/timetable/services/timetableScope";
import {
  timetableFormErrors,
  type TimetableErrorCode,
  type TimetableFormErrors as TimetableFormErrorState,
} from "@/features/academics/timetable/services/timetableErrorHandling";
import type { TimetableEntry } from "@/features/academics/timetable/types/timetable";

interface TimetableConfigEditorProps {
  academicYearId: string;
  termId: string;
  config: BackendTimetableConfigDto | null;
  entries: TimetableEntry[];
  scopeIds: TimetableScopeIds;
  allowScopeSelection: boolean;
  fixedName?: string;
  readOnly: boolean;
  locale: string;
  submitLabel: string;
  onSaved: (config: BackendTimetableConfigDto) => Promise<void> | void;
}

const timetableDays = [
  { index: 0, key: "sun", nameAr: "الأحد", nameEn: "Sunday" },
  { index: 1, key: "mon", nameAr: "الإثنين", nameEn: "Monday" },
  { index: 2, key: "tue", nameAr: "الثلاثاء", nameEn: "Tuesday" },
  { index: 3, key: "wed", nameAr: "الأربعاء", nameEn: "Wednesday" },
  { index: 4, key: "thu", nameAr: "الخميس", nameEn: "Thursday" },
  { index: 5, key: "fri", nameAr: "الجمعة", nameEn: "Friday" },
  { index: 6, key: "sat", nameAr: "السبت", nameEn: "Saturday" },
] as const;

export default function TimetableConfigEditor({
  academicYearId,
  termId,
  config,
  entries,
  scopeIds,
  allowScopeSelection,
  fixedName,
  readOnly,
  locale,
  submitLabel,
  onSaved,
}: TimetableConfigEditorProps) {
  const t = useTranslations("academics.timetable");
  const [scopeType, setScopeType] = useState<TimetableScopeType>("TERM");
  const [name, setName] = useState("");
  const [weekStartDay, setWeekStartDay] = useState(0);
  const [activeDays, setActiveDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [errors, setErrors] = useState<TimetableFormErrorState>(emptyErrors);
  const [isSaving, setIsSaving] = useState(false);
  const defaultName = t("config.defaultName");
  const defaultScope = resolveTimetableScopeSelection(scopeIds).scopeType;

  useEffect(() => {
    setName(fixedName ?? config?.name ?? defaultName);
    setScopeType(
      allowScopeSelection && !config
        ? defaultScope
        : ((config?.scopeType.toUpperCase() as TimetableScopeType) ?? "TERM"),
    );
    setWeekStartDay(config?.weekStartDay ?? 0);
    setActiveDays(config?.activeDays ?? [0, 1, 2, 3, 4]);
    setErrors(emptyErrors());
  }, [allowScopeSelection, config, defaultName, defaultScope, fixedName]);

  const saveConfig = async () => {
    if (readOnly) return;
    const validationErrors = validateConfig({
      name: fixedName ?? name,
      activeDays,
      config,
      entries,
      scopeType,
      scopeIds,
      t,
    });
    if (hasErrors(validationErrors)) return setErrors(validationErrors);

    setIsSaving(true);
    try {
      const savedConfig = await upsertBackendTimetableConfig({
        academicYearId,
        termId,
        ...(allowScopeSelection
          ? scopeSelectionForType(scopeType, scopeIds)
          : { scopeType: "TERM" as const }),
        name: (fixedName ?? name).trim(),
        weekStartDay,
        activeDays,
        status: "DRAFT",
      });
      await onSaved(savedConfig);
      setErrors(emptyErrors());
    } catch (error) {
      setErrors(
        timetableFormErrors(
          error,
          t("config.errors.saveConfig"),
          translateTimetableError(t),
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const dayOptions = timetableDays.map((day) => ({
    value: String(day.index),
    label: locale === "ar" ? day.nameAr : day.nameEn,
  }));

  return (
    <section className="space-y-4">
      <TimetableFormErrors errors={errors.form} />
      <h3 className="text-sm font-semibold text-gray-900">
        {t("config.configSection")}
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {!fixedName && (
          <label className="block text-sm font-medium text-gray-700">
            {t("config.name")}
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={readOnly}
              className={timetableInputClassName(errors.fields.name?.[0])}
            />
            <TimetableFieldError error={errors.fields.name?.[0]} />
          </label>
        )}
        {allowScopeSelection && (
          <Select
            label={t("config.scopeLabel")}
            value={scopeType}
            onChange={(selectedScope) =>
              setScopeType(selectedScope as TimetableScopeType)
            }
            disabled={readOnly || Boolean(config)}
            options={scopeOptions(scopeIds, t)}
            helperText={t(
              config ? "config.scopeLockedHelp" : "config.scopeSelectHelp",
            )}
          />
        )}
        <Select
          label={t("config.weekStartDay")}
          value={String(weekStartDay)}
          onChange={(selectedDay) => setWeekStartDay(Number(selectedDay))}
          disabled={readOnly}
          options={dayOptions}
        />
      </div>
      <div>
        <div className="mb-2 text-sm font-medium text-gray-700">
          {t("config.activeDays")}
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {timetableDays.map((day) => (
            <label
              key={day.key}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={activeDays.includes(day.index)}
                onChange={() =>
                  setActiveDays((currentDays) =>
                    toggleDay(currentDays, day.index),
                  )
                }
                disabled={readOnly}
              />
              <span>{locale === "ar" ? day.nameAr : day.nameEn}</span>
            </label>
          ))}
        </div>
        <TimetableFieldError error={errors.fields.activeDays?.[0]} />
      </div>
      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={saveConfig} loading={isSaving} variant="primary">
            {submitLabel}
          </Button>
        </div>
      )}
    </section>
  );
}

function emptyErrors(): TimetableFormErrorState {
  return { form: [], fields: {} };
}

function hasErrors(errors: TimetableFormErrorState): boolean {
  return errors.form.length > 0 || Object.keys(errors.fields).length > 0;
}

function toggleDay(activeDays: number[], dayIndex: number): number[] {
  return activeDays.includes(dayIndex)
    ? activeDays.filter((index) => index !== dayIndex)
    : [...activeDays, dayIndex].sort((first, second) => first - second);
}

function scopeSelectionForType(
  scopeType: TimetableScopeType,
  scopeIds: TimetableScopeIds,
) {
  return resolveTimetableScopeSelection({
    stageId: scopeType === "STAGE" ? scopeIds.stageId : undefined,
    gradeId: scopeType === "GRADE" ? scopeIds.gradeId : undefined,
    sectionId: scopeType === "SECTION" ? scopeIds.sectionId : undefined,
    classroomId:
      scopeType === "CLASSROOM" ? scopeIds.classroomId : undefined,
  });
}

function scopeOptions(
  scopeIds: TimetableScopeIds,
  t: ReturnType<typeof useTranslations>,
) {
  return availableScopeTypes(scopeIds).map((scopeType) => ({
    value: scopeType,
    label: t(`config.scopeOptions.${scopeType.toLowerCase()}`),
  }));
}

function availableScopeTypes(scopeIds: TimetableScopeIds): TimetableScopeType[] {
  const scopeTypes: TimetableScopeType[] = ["TERM"];
  if (scopeIds.stageId) scopeTypes.push("STAGE");
  if (scopeIds.gradeId) scopeTypes.push("GRADE");
  if (scopeIds.sectionId) scopeTypes.push("SECTION");
  if (scopeIds.classroomId) scopeTypes.push("CLASSROOM");
  return scopeTypes;
}

interface ConfigValidationInput {
  name: string;
  activeDays: number[];
  config: BackendTimetableConfigDto | null;
  entries: TimetableEntry[];
  scopeType: TimetableScopeType;
  scopeIds: TimetableScopeIds;
  t: ReturnType<typeof useTranslations>;
}

function validateConfig(input: ConfigValidationInput): TimetableFormErrorState {
  const errors = emptyErrors();
  if (!input.name.trim()) {
    errors.fields.name = [input.t("config.validation.nameRequired")];
  }
  if (input.activeDays.length === 0) {
    errors.fields.activeDays = [input.t("config.validation.atLeastOneDay")];
  }
  if (entriesUseRemovedDays(input)) {
    errors.fields.activeDays = [input.t("config.errors.activeDayInUse")];
  }
  addScopeErrors(errors, input);
  return errors;
}

function entriesUseRemovedDays(input: ConfigValidationInput): boolean {
  const removedDays = (input.config?.activeDays ?? []).filter(
    (dayIndex) => !input.activeDays.includes(dayIndex),
  );
  return input.entries.some(
    (entry) =>
      Boolean(entry.subjectId) && removedDays.includes(dayIndex(entry.dayKey)),
  );
}

function addScopeErrors(
  errors: TimetableFormErrorState,
  input: ConfigValidationInput,
) {
  if (input.scopeType === "GRADE" && !input.scopeIds.gradeId) {
    errors.fields.gradeId = [input.t("config.validation.selectGrade")];
  }
  if (input.scopeType === "SECTION" && !input.scopeIds.sectionId) {
    errors.fields.sectionId = [input.t("config.validation.selectSection")];
  }
  if (input.scopeType === "CLASSROOM" && !input.scopeIds.classroomId) {
    errors.fields.classroomId = [input.t("config.validation.selectClassroom")];
  }
}

function dayIndex(dayKey: string): number {
  return timetableDays.find((day) => day.key === dayKey)?.index ?? -1;
}

function translateTimetableError(t: ReturnType<typeof useTranslations>) {
  return (code: TimetableErrorCode) =>
    t(`errors.${code.replace("academics.timetable.", "")}`);
}
