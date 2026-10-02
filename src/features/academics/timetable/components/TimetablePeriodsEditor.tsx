"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useTranslations } from "next-intl";
import {
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
import Select from "@/components/ui/input/Select";
import {
  TimetableFieldError,
  TimetableFormErrors,
  timetableInputClassName,
} from "@/features/academics/timetable/components/TimetableFormFeedback";
import type {
  BackendTimetableConfigDto,
  BackendTimetablePeriodDto,
  CreatePeriodRequest,
} from "@/features/academics/timetable/services/timetableApiTypes";
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
  type TimetableFormErrors as TimetableFormErrorState,
} from "@/features/academics/timetable/services/timetableErrorHandling";
import type { TimetableEntry } from "@/features/academics/timetable/types/timetable";

interface TimetablePeriodsEditorProps {
  config: BackendTimetableConfigDto;
  periods: BackendTimetablePeriodDto[];
  entries: TimetableEntry[];
  readOnly: boolean;
  onSaved: () => Promise<void> | void;
}

type PeriodType = "CLASS" | "BREAK" | "ASSEMBLY" | "ACTIVITY";
type PeriodFormState = PeriodFormValues & {
  label: string;
  type: PeriodType;
  isInstructional: boolean;
};

export default function TimetablePeriodsEditor({
  config,
  periods,
  entries,
  readOnly,
  onSaved,
}: TimetablePeriodsEditorProps) {
  const t = useTranslations("academics.timetable");
  const [periodForm, setPeriodForm] = useState(() => emptyPeriodForm(periods));
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [errors, setErrors] = useState<TimetableFormErrorState>(emptyErrors);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingPeriodId, setDeletingPeriodId] = useState<string | null>(null);
  const [periodStatus, setPeriodStatus] = useState("");
  const periodLabelInputRef = useRef<HTMLInputElement>(null);
  const initializedConfigIdRef = useRef(config.id);

  useEffect(() => {
    if (initializedConfigIdRef.current === config.id) return;
    initializedConfigIdRef.current = config.id;
    setPeriodForm(emptyPeriodForm(periods));
    setEditingPeriodId(null);
    setPeriodStatus("");
    setErrors(emptyErrors());
  }, [config.id, periods]);

  const sortedPeriods = useMemo(
    () => [...periods].sort((first, second) => first.index - second.index),
    [periods],
  );
  const periodIdsInUse = useMemo(
    () => usedPeriodIds(entries, periods),
    [entries, periods],
  );

  const savePeriod = async () => {
    const validationErrors = periodErrors(periodForm, periods, t);
    if (hasErrors(validationErrors)) return setErrors(validationErrors);

    setIsSaving(true);
    try {
      if (editingPeriodId) {
        await updateTimetablePeriodDto(editingPeriodId, periodPayload(periodForm));
        await onSaved();
        resetPeriodForm();
      } else {
        await addPeriod();
      }
      setErrors(emptyErrors());
    } catch (error) {
      setErrors(
        timetableFormErrors(
          error,
          t("config.errors.savePeriod"),
          translateTimetableError(t),
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const addPeriod = async () => {
    const createdPeriod = await createTimetablePeriodDto({
      timetableConfigId: config.id,
      ...periodPayload(periodForm),
    });
    await onSaved();
    setPeriodForm({ ...periodForm, index: createdPeriod.index + 1, label: "" });
    setPeriodStatus(t("config.periodAdded"));
    periodLabelInputRef.current?.focus();
  };

  const resetPeriodForm = () => {
    setPeriodForm(emptyPeriodForm(periods));
    setEditingPeriodId(null);
    setPeriodStatus("");
  };

  const editPeriod = (period: BackendTimetablePeriodDto) => {
    setEditingPeriodId(period.id);
    setPeriodStatus("");
    setPeriodForm(periodFormFromDto(period));
    setErrors(emptyErrors());
  };

  const removePeriod = async (period: BackendTimetablePeriodDto) => {
    if (periodIdsInUse.has(period.id)) {
      setErrors({ form: [t("config.errors.periodInUse")], fields: {} });
      return;
    }
    setDeletingPeriodId(period.id);
    try {
      await deleteTimetablePeriod(period.id);
      await onSaved();
      if (editingPeriodId === period.id) resetPeriodForm();
      setErrors(emptyErrors());
    } catch (error) {
      setErrors(
        timetableFormErrors(
          error,
          t("config.errors.deletePeriod"),
          translateTimetableError(t),
        ),
      );
    } finally {
      setDeletingPeriodId(null);
    }
  };

  return (
    <section className="space-y-4">
      <TimetableFormErrors errors={errors.form} />
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          {t("config.periodsSection")}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          {t("config.periodsAdded", { count: sortedPeriods.length })}
        </p>
      </div>
      {!readOnly && (
        <PeriodForm
          form={periodForm}
          errors={errors}
          isSaving={isSaving}
          isEditing={Boolean(editingPeriodId)}
          labelInputRef={periodLabelInputRef}
          onChange={setPeriodForm}
          onSave={savePeriod}
          onCancelEdit={resetPeriodForm}
        />
      )}
      {periodStatus && (
        <p aria-live="polite" role="status" className="text-sm text-emerald-700">
          {periodStatus}
        </p>
      )}
      <PeriodsList
        periods={sortedPeriods}
        readOnly={readOnly}
        periodIdsInUse={periodIdsInUse}
        deletingPeriodId={deletingPeriodId}
        onEdit={editPeriod}
        onDelete={removePeriod}
      />
    </section>
  );
}

interface PeriodFormProps {
  form: PeriodFormState;
  errors: TimetableFormErrorState;
  isSaving: boolean;
  isEditing: boolean;
  labelInputRef: RefObject<HTMLInputElement | null>;
  onChange: (form: PeriodFormState) => void;
  onSave: () => void;
  onCancelEdit: () => void;
}

function PeriodForm({
  form,
  errors,
  isSaving,
  isEditing,
  labelInputRef,
  onChange,
  onSave,
  onCancelEdit,
}: PeriodFormProps) {
  const t = useTranslations("academics.timetable");
  return (
    <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <h4 className="text-sm font-semibold text-gray-900">
        {t(isEditing ? "config.updatePeriod" : "config.newPeriod")}
      </h4>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
        <PeriodInput
          label={t("config.periodIndex")}
          type="number"
          value={String(form.index)}
          error={errors.fields.index?.[0]}
          onChange={(nextIndex) =>
            onChange({ ...form, index: Number(nextIndex) || 1 })
          }
        />
        <PeriodInput
          label={t("config.periodLabel")}
          value={form.label}
          error={errors.fields.label?.[0]}
          className="md:col-span-2"
          inputRef={labelInputRef}
          onChange={(label) => onChange({ ...form, label })}
        />
        <PeriodInput
          label={t("config.startTime")}
          type="time"
          value={form.startTime}
          error={errors.fields.startTime?.[0]}
          onChange={(startTime) => onChange({ ...form, startTime })}
        />
        <PeriodInput
          label={t("config.endTime")}
          type="time"
          value={form.endTime}
          error={errors.fields.endTime?.[0]}
          onChange={(endTime) => onChange({ ...form, endTime })}
        />
        <div className="space-y-2">
          <Select
            label={t("config.periodType")}
            value={form.type}
            onChange={(type) =>
              onChange({
                ...form,
                type: type as PeriodType,
                isInstructional: type === "CLASS",
              })
            }
            options={periodTypeOptions(t)}
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isInstructional}
              onChange={(event) =>
                onChange({ ...form, isInstructional: event.target.checked })
              }
            />
            {t("config.instructional")}
          </label>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={onSave}
          loading={isSaving}
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          {t(isEditing ? "config.updatePeriod" : "config.addNextPeriod")}
        </Button>
        {isEditing && (
          <Button
            onClick={onCancelEdit}
            variant="secondary"
            leftIcon={<X className="h-4 w-4" />}
          >
            {t("config.cancelEdit")}
          </Button>
        )}
      </div>
    </section>
  );
}

interface PeriodInputProps {
  label: string;
  value: string;
  type?: "text" | "number" | "time";
  error?: string;
  className?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
}

function PeriodInput({
  label,
  value,
  type = "text",
  error,
  className,
  inputRef,
  onChange,
}: PeriodInputProps) {
  return (
    <label className={`text-sm font-medium text-gray-700 ${className ?? ""}`}>
      {label}
      <input
        ref={inputRef}
        type={type}
        min={type === "number" ? 1 : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={timetableInputClassName(error)}
      />
      <TimetableFieldError error={error} />
    </label>
  );
}

interface PeriodsListProps {
  periods: BackendTimetablePeriodDto[];
  readOnly: boolean;
  periodIdsInUse: Set<string>;
  deletingPeriodId: string | null;
  onEdit: (period: BackendTimetablePeriodDto) => void;
  onDelete: (period: BackendTimetablePeriodDto) => void;
}

function PeriodsList({
  periods,
  readOnly,
  periodIdsInUse,
  deletingPeriodId,
  onEdit,
  onDelete,
}: PeriodsListProps) {
  const t = useTranslations("academics.timetable");
  return (
    <section className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-900">
        {t("config.savedPeriods")}
      </h4>
      <div className="max-h-72 overflow-auto rounded-lg border border-gray-200">
        {periods.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">{t("config.noPeriods")}</div>
        ) : (
          periods.map((period) => (
            <PeriodRow
              key={period.id}
              period={period}
              readOnly={readOnly}
              inUse={periodIdsInUse.has(period.id)}
              isDeleting={deletingPeriodId === period.id}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </section>
  );
}

function PeriodRow({
  period,
  readOnly,
  inUse,
  isDeleting,
  onEdit,
  onDelete,
}: {
  period: BackendTimetablePeriodDto;
  readOnly: boolean;
  inUse: boolean;
  isDeleting: boolean;
  onEdit: (period: BackendTimetablePeriodDto) => void;
  onDelete: (period: BackendTimetablePeriodDto) => void;
}) {
  const t = useTranslations("academics.timetable");
  return (
    <div className="grid grid-cols-[4rem_1fr_auto] items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0">
      <span className="text-sm font-semibold text-gray-900">{period.index}</span>
      <div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
          <PeriodTypeIcon type={period.type} />
          <span>{period.label}</span>
        </div>
        <div className="text-xs text-gray-500">
          <span dir="ltr">
            {formatTimetableTimeRange(period.startTime, period.endTime)}
          </span>{" "}
          · {periodTypeLabel(period.type, t)}
          {period.isInstructional ? ` · ${t("config.instructional")}` : ""}
        </div>
      </div>
      {!readOnly && (
        <div className="flex gap-2">
          <Button
            onClick={() => onEdit(period)}
            variant="ghost"
            size="sm"
            leftIcon={<Edit2 className="h-4 w-4" />}
          >
            {t("config.editPeriod")}
          </Button>
          <Button
            onClick={() => onDelete(period)}
            variant="danger"
            size="sm"
            loading={isDeleting}
            disabled={inUse}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            {t("config.deletePeriod")}
          </Button>
        </div>
      )}
    </div>
  );
}

function emptyErrors(): TimetableFormErrorState {
  return { form: [], fields: {} };
}

function hasErrors(errors: TimetableFormErrorState): boolean {
  return errors.form.length > 0 || Object.keys(errors.fields).length > 0;
}

function formatTimeInput(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function emptyPeriodForm(periods: BackendTimetablePeriodDto[]): PeriodFormState {
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
  return {
    index: Math.max(0, ...periods.map((period) => period.index)) + 1,
    label: "",
    startTime: formatTimeInput(startTime),
    endTime: formatTimeInput(endTime),
    type: "CLASS",
    isInstructional: true,
  };
}

function periodFormFromDto(period: BackendTimetablePeriodDto): PeriodFormState {
  return {
    id: period.id,
    index: period.index,
    label: period.label,
    startTime: period.startTime,
    endTime: period.endTime,
    type: normalizedPeriodType(period.type),
    isInstructional: period.isInstructional,
  };
}

function normalizedPeriodType(type: string): PeriodType {
  const normalizedType = type.toUpperCase();
  return isPeriodType(normalizedType) ? normalizedType : "CLASS";
}

function isPeriodType(type: string): type is PeriodType {
  return ["CLASS", "BREAK", "ASSEMBLY", "ACTIVITY"].includes(type);
}

function periodPayload(
  form: PeriodFormState,
): Omit<CreatePeriodRequest, "timetableConfigId"> {
  return {
    index: form.index,
    label: form.label.trim(),
    startTime: form.startTime,
    endTime: form.endTime,
    type: form.type,
    isInstructional: form.isInstructional,
  };
}

function periodErrors(
  form: PeriodFormState,
  periods: BackendTimetablePeriodDto[],
  t: ReturnType<typeof useTranslations>,
): TimetableFormErrorState {
  const errors = emptyErrors();
  errors.form = validatePeriodForm(form, periods).map(translateTimetableError(t));
  if (!form.label.trim()) {
    errors.fields.label = [t("config.validation.periodLabelRequired")];
  }
  if (!form.startTime) {
    errors.fields.startTime = [t("config.validation.startTimeRequired")];
  }
  if (!form.endTime) {
    errors.fields.endTime = [t("config.validation.endTimeRequired")];
  }
  return errors;
}

function usedPeriodIds(
  entries: TimetableEntry[],
  periods: BackendTimetablePeriodDto[],
): Set<string> {
  return new Set(
    entries
      .filter((entry) => entry.subjectId || entry.teacherId || entry.roomId)
      .map((entry) =>
        periods.find((period) => period.index === entry.periodIndex),
      )
      .flatMap((period) => (period ? [period.id] : [])),
  );
}

function periodTypeOptions(t: ReturnType<typeof useTranslations>) {
  return [
    { value: "CLASS", label: t("editSlot.class") },
    { value: "BREAK", label: t("editSlot.break") },
    { value: "ASSEMBLY", label: t("config.periodTypes.assembly") },
    { value: "ACTIVITY", label: t("config.periodTypes.activity") },
  ];
}

function PeriodTypeIcon({ type }: { type: string }) {
  const className = "h-4 w-4 shrink-0 text-gray-500";
  switch (normalizedPeriodType(type)) {
    case "BREAK":
      return <Coffee className={className} />;
    case "ASSEMBLY":
      return <Users className={className} />;
    case "ACTIVITY":
      return <Sparkles className={className} />;
    default:
      return <BookOpen className={className} />;
  }
}

function periodTypeLabel(
  type: string,
  t: ReturnType<typeof useTranslations>,
): string {
  switch (normalizedPeriodType(type)) {
    case "BREAK":
      return t("editSlot.break");
    case "ASSEMBLY":
      return t("config.periodTypes.assembly");
    case "ACTIVITY":
      return t("config.periodTypes.activity");
    default:
      return t("editSlot.class");
  }
}

function translateTimetableError(t: ReturnType<typeof useTranslations>) {
  return (code: TimetableErrorCode) =>
    t(`errors.${code.replace("academics.timetable.", "")}`);
}
