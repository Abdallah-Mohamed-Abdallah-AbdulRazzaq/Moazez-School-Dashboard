"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  BookOpen,
  Coffee,
  Edit2,
  Plus,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui";
import Modal from "@/components/ui/modal/Modal";
import Select from "@/components/ui/input/Select";
import type {
  BackendTimetableConfigDto,
  BackendTimetablePeriodDto,
  CreatePeriodRequest,
  TimetableScopeType,
  UpsertConfigRequest,
} from "@/features/academics/timetable/services/timetableApiTypes";
import { upsertBackendTimetableConfig } from "@/features/academics/timetable/services/timetableConfigService";
import {
  createTimetablePeriodDto,
  deleteTimetablePeriod,
  updateTimetablePeriodDto,
} from "@/features/academics/timetable/services/timetablePeriodsService";
import {
  validatePeriodForm,
  type PeriodFormValues,
} from "@/features/academics/timetable/services/timetablePeriodValidation";
import { formatTimetableTimeRange } from "@/features/academics/timetable/services/timetableTimeFormat";
import {
  timetableFormErrors,
  type TimetableErrorCode,
  type TimetableFormErrors,
} from "@/features/academics/timetable/services/timetableErrorHandling";
import type { TimetableEntry } from "@/features/academics/timetable/types/timetable";

interface TimetableConfigDialogProps {
  mode: "config" | "periods";
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
  academicYearId: string;
  termId: string;
  config: BackendTimetableConfigDto | null;
  periods: BackendTimetablePeriodDto[];
  entries: TimetableEntry[];
  selectedGradeId: string;
  selectedSectionId: string;
  selectedClassroomId: string;
  readOnly: boolean;
  locale: string;
}

type PeriodType = "CLASS" | "BREAK" | "ASSEMBLY" | "ACTIVITY";

type PeriodFormState = PeriodFormValues & {
  label: string;
  type: PeriodType;
  isInstructional: boolean;
};

const days = [
  { index: 0, key: "sun", nameAr: "الأحد", nameEn: "Sunday" },
  { index: 1, key: "mon", nameAr: "الإثنين", nameEn: "Monday" },
  { index: 2, key: "tue", nameAr: "الثلاثاء", nameEn: "Tuesday" },
  { index: 3, key: "wed", nameAr: "الأربعاء", nameEn: "Wednesday" },
  { index: 4, key: "thu", nameAr: "الخميس", nameEn: "Thursday" },
  { index: 5, key: "fri", nameAr: "الجمعة", nameEn: "Friday" },
  { index: 6, key: "sat", nameAr: "السبت", nameEn: "Saturday" },
] as const;

const formatTimeInput = (date: Date): string =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

const emptyPeriodForm = (nextIndex: number): PeriodFormState => {
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

  return {
    index: nextIndex,
    label: "",
    startTime: formatTimeInput(startTime),
    endTime: formatTimeInput(endTime),
    type: "CLASS",
    isInstructional: true,
  };
};

const emptyFormErrors = (): TimetableFormErrors => ({
  form: [],
  fields: {},
});

const periodType = (type: string): PeriodType => {
  const normalizedType = type.toUpperCase();
  return isPeriodType(normalizedType) ? normalizedType : "CLASS";
};

const isPeriodType = (type: string): type is PeriodType =>
  ["CLASS", "BREAK", "ASSEMBLY", "ACTIVITY"].includes(type);

const nextPeriodIndex = (periods: BackendTimetablePeriodDto[]): number =>
  Math.max(0, ...periods.map((period) => period.index)) + 1;

export default function TimetableConfigDialog({
  mode,
  open,
  onClose,
  onSaved,
  academicYearId,
  termId,
  config,
  periods,
  entries,
  selectedGradeId,
  selectedSectionId,
  selectedClassroomId,
  readOnly,
  locale,
}: TimetableConfigDialogProps) {
  const t = useTranslations("academics.timetable");
  const isConfigMode = mode === "config";
  const translateTimetableError = (code: TimetableErrorCode) =>
    t(`errors.${code.replace("academics.timetable.", "")}`);
  const scopeType = defaultScopeType({
    selectedGradeId,
    selectedSectionId,
    selectedClassroomId,
  });
  const [name, setName] = useState("");
  const [weekStartDay, setWeekStartDay] = useState(0);
  const [activeDays, setActiveDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [periodForm, setPeriodForm] = useState<PeriodFormState>(
    emptyPeriodForm(1),
  );
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSavingPeriod, setIsSavingPeriod] = useState(false);
  const [deletingPeriodId, setDeletingPeriodId] = useState<string | null>(null);
  const [periodStatus, setPeriodStatus] = useState("");
  const periodLabelInputRef = useRef<HTMLInputElement>(null);
  const initializedPeriodSessionRef = useRef<string | null>(null);
  const periodSessionKey = [
    config?.id ?? "new",
    selectedGradeId,
    selectedSectionId,
    selectedClassroomId,
  ].join(":");

  useEffect(() => {
    if (!open) {
      initializedPeriodSessionRef.current = null;
      return;
    }
    if (initializedPeriodSessionRef.current === periodSessionKey) {
      return;
    }
    initializedPeriodSessionRef.current = periodSessionKey;
    void Promise.resolve().then(() => {
      setName(config?.name ?? t("config.defaultName"));
      setWeekStartDay(config?.weekStartDay ?? 0);
      setActiveDays(config?.activeDays ?? [0, 1, 2, 3, 4]);
      setPeriodForm(emptyPeriodForm(nextPeriodIndex(periods)));
      setEditingPeriodId(null);
      setPeriodStatus("");
      setFormErrors([]);
      setFieldErrors({});
    });
  }, [
    config,
    open,
    periodSessionKey,
    selectedClassroomId,
    selectedGradeId,
    selectedSectionId,
    t,
  ]);

  const sortedPeriods = useMemo(
    () => [...periods].sort((first, second) => first.index - second.index),
    [periods],
  );

  const periodIdsInUse = useMemo(
    () =>
      new Set(
        entries
          .filter((entry) => entry.subjectId || entry.teacherId || entry.roomId)
          .map((entry) => periodByIndex(periods, entry.periodIndex)?.id)
          .filter((periodId): periodId is string => Boolean(periodId)),
      ),
    [entries, periods],
  );

  const dayOptions = days.map((day) => ({
    value: String(day.index),
    label: locale === "ar" ? day.nameAr : day.nameEn,
  }));

  const resetPeriodForm = () => {
    setPeriodForm(emptyPeriodForm(nextPeriodIndex(periods)));
    setEditingPeriodId(null);
    setPeriodStatus("");
  };

  const applyErrors = (nextErrors: TimetableFormErrors) => {
    setFormErrors(nextErrors.form);
    setFieldErrors(nextErrors.fields);
  };

  const clearErrors = () => {
    applyErrors(emptyFormErrors());
  };

  const toggleActiveDay = (dayIndex: number) => {
    setActiveDays((currentDays) =>
      currentDays.includes(dayIndex)
        ? currentDays.filter((index) => index !== dayIndex)
        : [...currentDays, dayIndex].sort((first, second) => first - second),
    );
  };

  const saveConfig = async () => {
    if (readOnly) {
      return;
    }

    const validationErrors = validateConfig();
    if (hasErrors(validationErrors)) {
      applyErrors(validationErrors);
      return;
    }
    if (
      editingPeriodId &&
      !periodForm.isInstructional &&
      periodIdsInUse.has(editingPeriodId)
    ) {
      applyErrors({ form: [t("config.errors.periodInUse")], fields: {} });
      return;
    }

    setIsSavingConfig(true);
    try {
      await upsertBackendTimetableConfig(buildConfigPayload());
      await onSaved();
      clearErrors();
    } catch (error) {
      applyErrors(
        timetableFormErrors(
          error,
          t("config.errors.saveConfig"),
          translateTimetableError,
        ),
      );
    } finally {
      setIsSavingConfig(false);
    }
  };

  const savePeriod = async () => {
    if (!config || readOnly) {
      return;
    }

    const validationErrors = validatePeriodDraft(periodForm, periods, {
      labelRequired: t("config.validation.periodLabelRequired"),
      startTimeRequired: t("config.validation.startTimeRequired"),
      endTimeRequired: t("config.validation.endTimeRequired"),
      translateError: translateTimetableError,
    });
    if (hasErrors(validationErrors)) {
      applyErrors(validationErrors);
      return;
    }

    setIsSavingPeriod(true);
    try {
      if (editingPeriodId) {
        await updateTimetablePeriodDto(editingPeriodId, periodPayload());
      } else {
        const createdPeriod = await createTimetablePeriodDto({
          timetableConfigId: config.id,
          ...periodPayload(),
        });
        await onSaved();
        setPeriodForm({
          ...periodForm,
          index: createdPeriod.index + 1,
          label: "",
        });
        setPeriodStatus(t("config.periodAdded"));
        periodLabelInputRef.current?.focus();
        clearErrors();
        return;
      }
      await onSaved();
      resetPeriodForm();
      clearErrors();
    } catch (error) {
      applyErrors(
        timetableFormErrors(
          error,
          t("config.errors.savePeriod"),
          translateTimetableError,
        ),
      );
    } finally {
      setIsSavingPeriod(false);
    }
  };

  const editPeriod = (period: BackendTimetablePeriodDto) => {
    if (readOnly) {
      return;
    }

    setEditingPeriodId(period.id);
    setPeriodStatus("");
    setPeriodForm({
      id: period.id,
      index: period.index,
      label: period.label,
      startTime: period.startTime,
      endTime: period.endTime,
      type: periodType(period.type),
      isInstructional: period.isInstructional,
    });
    clearErrors();
  };

  const removePeriod = async (period: BackendTimetablePeriodDto) => {
    if (readOnly) {
      return;
    }

    if (periodIdsInUse.has(period.id)) {
      applyErrors({
        form: [t("config.errors.periodInUse")],
        fields: {},
      });
      return;
    }

    setDeletingPeriodId(period.id);
    try {
      await deleteTimetablePeriod(period.id);
      await onSaved();
      if (editingPeriodId === period.id) {
        resetPeriodForm();
      }
      clearErrors();
    } catch (error) {
      applyErrors(
        timetableFormErrors(
          error,
          t("config.errors.deletePeriod"),
          translateTimetableError,
        ),
      );
    } finally {
      setDeletingPeriodId(null);
    }
  };

  const validateConfig = (): TimetableFormErrors => {
    const validationErrors = emptyFormErrors();
    if (!name.trim()) {
      validationErrors.fields.name = [t("config.validation.nameRequired")];
    }
    if (activeDays.length === 0) {
      validationErrors.fields.activeDays = [
        t("config.validation.atLeastOneDay"),
      ];
    }
    const removedDays = (config?.activeDays ?? []).filter(
      (dayIndex) => !activeDays.includes(dayIndex),
    );
    if (
      entries.some(
        (entry) =>
          entry.subjectId &&
          removedDays.includes(dayIndexFromKey(entry.dayKey)),
      )
    ) {
      validationErrors.fields.activeDays = [
        t("config.errors.activeDayInUse"),
      ];
    }
    if (scopeType === "GRADE" && !selectedGradeId) {
      validationErrors.fields.gradeId = [t("config.validation.selectGrade")];
    }
    if (scopeType === "SECTION" && !selectedSectionId) {
      validationErrors.fields.sectionId = [
        t("config.validation.selectSection"),
      ];
    }
    if (scopeType === "CLASSROOM" && !selectedClassroomId) {
      validationErrors.fields.classroomId = [
        t("config.validation.selectClassroom"),
      ];
    }
    return validationErrors;
  };

  const buildConfigPayload = (): UpsertConfigRequest => ({
    academicYearId,
    termId,
    scopeType,
    gradeId: scopeType === "GRADE" ? selectedGradeId : undefined,
    sectionId: scopeType === "SECTION" ? selectedSectionId : undefined,
    classroomId: scopeType === "CLASSROOM" ? selectedClassroomId : undefined,
    name: name.trim(),
    weekStartDay,
    activeDays,
    status: "DRAFT",
  });

  const periodPayload = (): Omit<CreatePeriodRequest, "timetableConfigId"> => ({
    index: periodForm.index,
    label: periodForm.label.trim(),
    startTime: periodForm.startTime,
    endTime: periodForm.endTime,
    type: periodForm.type,
    isInstructional: periodForm.isInstructional,
  });

  const periodTypeLabel = (type: string): string => {
    switch (periodType(type)) {
      case "BREAK":
        return t("editSlot.break");
      case "ASSEMBLY":
        return t("config.periodTypes.assembly");
      case "ACTIVITY":
        return t("config.periodTypes.activity");
      default:
        return t("editSlot.class");
    }
  };

  const periodTypeIcon = (type: string) => {
    switch (periodType(type)) {
      case "BREAK":
        return Coffee;
      case "ASSEMBLY":
        return Users;
      case "ACTIVITY":
        return Sparkles;
      default:
        return BookOpen;
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={t(isConfigMode ? "config.title" : "config.periodsTitle")}
      description={t(
        isConfigMode ? "config.configDescription" : "config.periodsDescription",
      )}
      size="xl"
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button onClick={onClose} variant="secondary">
            {t("config.close")}
          </Button>
          {!readOnly && isConfigMode && (
            <Button
              onClick={saveConfig}
              loading={isSavingConfig}
              variant="primary"
            >
              {t("config.saveConfig")}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {formErrors.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {formErrors.map((error) => (
              <div key={error} className="flex gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        )}

        {isConfigMode && <section className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">
            {t("config.configSection")}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("config.name")}
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={readOnly}
                className={inputClassName(fieldErrors, "name")}
              />
              <FieldError errors={fieldErrors} field="name" />
            </label>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              <div className="font-medium text-gray-900">
                {t("config.scopeLabel")}: {t(`config.scopeOptions.${scopeType.toLowerCase()}`)}
              </div>
              <p className="mt-1 text-xs text-gray-600">
                {t("config.scopeLockedHelp")}
              </p>
            </div>
            <Select
              label={t("config.weekStartDay")}
              value={String(weekStartDay)}
              onChange={(value) => setWeekStartDay(Number(value))}
              disabled={readOnly}
              options={dayOptions}
            />
          </div>
          <div>
            <div className="mb-2 text-sm font-medium text-gray-700">
              {t("config.activeDays")}
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {days.map((day) => (
                <label
                  key={day.key}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={activeDays.includes(day.index)}
                    onChange={() => toggleActiveDay(day.index)}
                    disabled={readOnly}
                  />
                  <span>{locale === "ar" ? day.nameAr : day.nameEn}</span>
                </label>
              ))}
            </div>
            <FieldError errors={fieldErrors} field="activeDays" />
          </div>
        </section>}

        {!isConfigMode && <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {t("config.periodsSection")}
              </h3>
              {config && (
                <p className="mt-1 text-xs text-gray-500">
                  {t("config.periodsAdded", { count: sortedPeriods.length })}
                </p>
              )}
            </div>
            {!config && (
              <span className="text-xs text-amber-700">
                {t("config.saveBeforePeriods")}
              </span>
            )}
          </div>

          {config && !readOnly && (
            <>
              <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h4 className="text-sm font-semibold text-gray-900">
                  {editingPeriodId
                    ? t("config.updatePeriod")
                    : t("config.newPeriod")}
                </h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                <label className="text-sm font-medium text-gray-700">
                  {t("config.periodIndex")}
                  <input
                    type="number"
                    min={1}
                    value={periodForm.index}
                    onChange={(event) =>
                      setPeriodForm({
                        ...periodForm,
                        index: Number(event.target.value) || 1,
                      })
                    }
                    className={inputClassName(fieldErrors, "index")}
                  />
                  <FieldError errors={fieldErrors} field="index" />
                </label>
                <label className="text-sm font-medium text-gray-700 md:col-span-2">
                  {t("config.periodLabel")}
                  <input
                    ref={periodLabelInputRef}
                    value={periodForm.label}
                    onChange={(event) =>
                      setPeriodForm({
                        ...periodForm,
                        label: event.target.value,
                      })
                    }
                    className={inputClassName(fieldErrors, "label")}
                  />
                  <FieldError errors={fieldErrors} field="label" />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  {t("config.startTime")}
                  <input
                    type="time"
                    value={periodForm.startTime}
                    onChange={(event) =>
                      setPeriodForm({
                        ...periodForm,
                        startTime: event.target.value,
                      })
                    }
                    className={inputClassName(fieldErrors, "startTime")}
                  />
                  <FieldError errors={fieldErrors} field="startTime" />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  {t("config.endTime")}
                  <input
                    type="time"
                    value={periodForm.endTime}
                    onChange={(event) =>
                      setPeriodForm({
                        ...periodForm,
                        endTime: event.target.value,
                      })
                    }
                    className={inputClassName(fieldErrors, "endTime")}
                  />
                  <FieldError errors={fieldErrors} field="endTime" />
                </label>
                <div className="space-y-2">
                  <Select
                    label={t("config.periodType")}
                    value={periodForm.type}
                    onChange={(value) =>
                      setPeriodForm({
                        ...periodForm,
                        type: value as PeriodType,
                        isInstructional: value === "CLASS",
                      })
                    }
                    options={[
                      { value: "CLASS", label: t("editSlot.class") },
                      { value: "BREAK", label: t("editSlot.break") },
                      {
                        value: "ASSEMBLY",
                        label: t("config.periodTypes.assembly"),
                      },
                      {
                        value: "ACTIVITY",
                        label: t("config.periodTypes.activity"),
                      },
                    ]}
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={periodForm.isInstructional}
                      onChange={(event) =>
                        setPeriodForm({
                          ...periodForm,
                          isInstructional: event.target.checked,
                        })
                      }
                    />
                    {t("config.instructional")}
                  </label>
                </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={savePeriod}
                    loading={isSavingPeriod}
                    variant="primary"
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    {editingPeriodId
                      ? t("config.updatePeriod")
                      : t("config.addNextPeriod")}
                  </Button>
                  {editingPeriodId && (
                    <Button
                      onClick={resetPeriodForm}
                      variant="secondary"
                      leftIcon={<X className="h-4 w-4" />}
                    >
                      {t("config.cancelEdit")}
                    </Button>
                  )}
                </div>
                {periodStatus && (
                  <p
                    aria-live="polite"
                    role="status"
                    className="text-sm text-emerald-700"
                  >
                    {periodStatus}
                  </p>
                )}
              </section>

              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">
                  {t("config.savedPeriods")}
                </h4>
                <div className="max-h-72 overflow-auto rounded-lg border border-gray-200">
                  {sortedPeriods.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">
                      {t("config.noPeriods")}
                    </div>
                  ) : (
                    sortedPeriods.map((period) => {
                    const PeriodTypeIcon = periodTypeIcon(period.type);

                    return (
                      <div
                        key={period.id}
                        className="grid grid-cols-[4rem_1fr_auto] items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0"
                      >
                        <span className="text-sm font-semibold text-gray-900">
                          {period.index}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                            <PeriodTypeIcon className="h-4 w-4 shrink-0 text-gray-500" />
                            <span>{period.label}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            <span dir="ltr">
                              {formatTimetableTimeRange(
                                period.startTime,
                                period.endTime,
                              )}
                            </span>{" "}
                            · {periodTypeLabel(period.type)}
                            {period.isInstructional
                              ? ` · ${t("config.instructional")}`
                              : ""}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => editPeriod(period)}
                            variant="ghost"
                            size="sm"
                            leftIcon={<Edit2 className="h-4 w-4" />}
                          >
                            {t("config.editPeriod")}
                          </Button>
                          <Button
                            onClick={() => removePeriod(period)}
                            variant="danger"
                            size="sm"
                            loading={deletingPeriodId === period.id}
                            disabled={periodIdsInUse.has(period.id)}
                            leftIcon={<Trash2 className="h-4 w-4" />}
                          >
                            {t("config.deletePeriod")}
                          </Button>
                        </div>
                      </div>
                    );
                    })
                  )}
                </div>
              </section>
            </>
          )}
          {config && readOnly && (
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">
                {t("config.savedPeriods")}
              </h4>
              <div className="max-h-72 overflow-auto rounded-lg border border-gray-200">
                {sortedPeriods.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">
                    {t("config.noPeriods")}
                  </div>
                ) : (
                  sortedPeriods.map((period) => {
                  const PeriodTypeIcon = periodTypeIcon(period.type);

                  return (
                    <div
                      key={period.id}
                      className="grid grid-cols-[4rem_1fr] items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0"
                    >
                      <span className="text-sm font-semibold text-gray-900">
                        {period.index}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                          <PeriodTypeIcon className="h-4 w-4 shrink-0 text-gray-500" />
                          <span>{period.label}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          <span dir="ltr">
                            {formatTimetableTimeRange(
                              period.startTime,
                              period.endTime,
                            )}
                          </span>{" "}
                          · {periodTypeLabel(period.type)}
                          {period.isInstructional
                            ? ` · ${t("config.instructional")}`
                            : ""}
                        </div>
                      </div>
                    </div>
                  );
                  })
                )}
              </div>
            </section>
          )}
        </section>}
      </div>
    </Modal>
  );
}

function dayIndexFromKey(dayKey: string): number {
  return days.find((day) => day.key === dayKey)?.index ?? -1;
}

function periodByIndex(
  periods: BackendTimetablePeriodDto[],
  periodIndex: number,
): BackendTimetablePeriodDto | undefined {
  return periods.find((period) => period.index === periodIndex);
}

function validatePeriodDraft(
  period: PeriodFormState,
  periods: BackendTimetablePeriodDto[],
  messages: {
    labelRequired: string;
    startTimeRequired: string;
    endTimeRequired: string;
    translateError: (code: TimetableErrorCode) => string;
  },
): TimetableFormErrors {
  const validationErrors = emptyFormErrors();
  validationErrors.form = validatePeriodForm(period, periods).map(
    messages.translateError,
  );
  if (!period.label.trim()) {
    validationErrors.fields.label = [messages.labelRequired];
  }
  if (!period.startTime) {
    validationErrors.fields.startTime = [messages.startTimeRequired];
  }
  if (!period.endTime) {
    validationErrors.fields.endTime = [messages.endTimeRequired];
  }
  return validationErrors;
}

function hasErrors(errors: TimetableFormErrors): boolean {
  return errors.form.length > 0 || Object.keys(errors.fields).length > 0;
}

function firstFieldError(
  errors: Record<string, string[]>,
  field: string,
): string | undefined {
  return errors[field]?.[0];
}

function inputClassName(
  errors: Record<string, string[]>,
  field: string,
): string {
  const baseClassName =
    "mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2";
  return firstFieldError(errors, field)
    ? `${baseClassName} border-red-500 focus:border-red-500 focus:ring-red-500/20`
    : `${baseClassName} border-gray-200 focus:border-primary focus:ring-primary/20`;
}

function FieldError({
  errors,
  field,
}: {
  errors: Record<string, string[]>;
  field: string;
}) {
  const error = firstFieldError(errors, field);
  if (!error) {
    return null;
  }
  return <div className="mt-1 text-xs text-red-600">{error}</div>;
}

function defaultScopeType({
  selectedGradeId,
  selectedSectionId,
  selectedClassroomId,
}: {
  selectedGradeId: string;
  selectedSectionId: string;
  selectedClassroomId: string;
}): TimetableScopeType {
  if (selectedClassroomId) {
    return "CLASSROOM";
  }
  if (selectedSectionId) {
    return "SECTION";
  }
  if (selectedGradeId) {
    return "GRADE";
  }
  return "TERM";
}
