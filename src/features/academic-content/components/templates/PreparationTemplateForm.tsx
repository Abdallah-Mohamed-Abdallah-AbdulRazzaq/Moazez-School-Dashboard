"use client";

import { useEffect, useRef, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import OrderedTextList from "../editor/details/OrderedTextList";
import { normalizeOrderedText } from "../editor/details/DetailFormShell";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import {
  loadAcademicTargetOptions,
  type AcademicTargetOptions,
} from "../../services/academicContentSelectors";
import { academicContentUiError } from "../../services/academicContentErrors";
import type {
  AcademicContentPreparationTemplateDetail,
  CreateAcademicContentPreparationTemplateRequest,
} from "../../types/contracts";

const MAX_ITEMS = 50;
const MAX_ITEM_LENGTH = 500;

type TemplateFormState = Required<
  CreateAcademicContentPreparationTemplateRequest
>;

const EMPTY_FORM: TemplateFormState = {
  name: "",
  description: null,
  stageId: null,
  subjectId: null,
  topic: null,
  objectives: [],
  learningOutcomes: [],
  teachingStrategies: [],
  activities: [],
  resourceNotes: null,
  assessmentNotes: null,
  teacherNotes: null,
};

function formState(
  initial?: AcademicContentPreparationTemplateDetail,
): TemplateFormState {
  if (!initial) return EMPTY_FORM;
  return {
    name: initial.name,
    description: initial.description,
    stageId: initial.stageId,
    subjectId: initial.subjectId,
    topic: initial.topic,
    objectives: [...initial.objectives],
    learningOutcomes: [...initial.learningOutcomes],
    teachingStrategies: [...initial.teachingStrategies],
    activities: [...initial.activities],
    resourceNotes: initial.resourceNotes,
    assessmentNotes: initial.assessmentNotes,
    teacherNotes: initial.teacherNotes,
  };
}

function optionalText(value: string | null): string | null {
  return value?.trim() || null;
}

function selectOptions(
  items: Array<{ id: string; name: string }>,
  emptyLabel: string,
  selectedId: string | null,
  unavailableLabel: string,
): SelectOption[] {
  const options: SelectOption[] = [
    { value: "", label: emptyLabel },
    ...items.map((item) => ({ value: item.id, label: item.name })),
  ];
  if (selectedId && !options.some((option) => option.value === selectedId)) {
    options.push({ value: selectedId, label: unavailableLabel, disabled: true });
  }
  return options;
}

interface PreparationTemplateFormProps {
  initial?: AcademicContentPreparationTemplateDetail;
  onSubmit: (
    request: CreateAcademicContentPreparationTemplateRequest,
  ) => Promise<boolean>;
  onCancel: () => void;
}

export default function PreparationTemplateForm({
  initial,
  onSubmit,
  onCancel,
}: PreparationTemplateFormProps) {
  const { academicYearId, termId } = useAcademicYearTermLayoutContext();
  const [form, setForm] = useState(() => formState(initial));
  const [options, setOptions] = useState<AcademicTargetOptions | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const t = useAcademicContentTranslations("templates");

  useEffect(() => {
    if (!academicYearId || !termId) return;
    let isCurrent = true;
    void loadAcademicTargetOptions({ academicYearId, termId })
      .then((loadedOptions) => {
        if (isCurrent) setOptions(loadedOptions);
      })
      .catch((loadError) => {
        if (isCurrent) {
          setOptionsError(academicContentUiError(loadError).message);
        }
      });
    return () => {
      isCurrent = false;
    };
  }, [academicYearId, termId]);

  const update = <K extends keyof TemplateFormState>(
    field: K,
    value: TemplateFormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return t("name_required");
    if (form.name.trim().length > 180) return t("name_too_long");
    if ((form.description?.length ?? 0) > 1000) return t("description_too_long");
    if ((form.topic?.length ?? 0) > 500) return t("topic_too_long");
    if (
      [form.resourceNotes, form.assessmentNotes, form.teacherNotes].some(
        (value) => (value?.length ?? 0) > 4000,
      )
    ) {
      return t("notes_too_long");
    }
    const lists = [
      form.objectives,
      form.learningOutcomes,
      form.teachingStrategies,
      form.activities,
    ];
    if (lists.some((values) => values.length > MAX_ITEMS)) {
      return t("too_many_items");
    }
    if (lists.some((values) => values.some((value) => !value.trim()))) {
      return t("empty_items");
    }
    if (
      lists.some((values) =>
        values.some((value) => value.trim().length > MAX_ITEM_LENGTH),
      )
    ) {
      return t("item_too_long");
    }
    return null;
  };

  const submit = async () => {
    if (submittingRef.current) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: form.name.trim(),
        description: optionalText(form.description),
        stageId: form.stageId || null,
        subjectId: form.subjectId || null,
        topic: optionalText(form.topic),
        objectives: normalizeOrderedText(form.objectives),
        learningOutcomes: normalizeOrderedText(form.learningOutcomes),
        teachingStrategies: normalizeOrderedText(form.teachingStrategies),
        activities: normalizeOrderedText(form.activities),
        resourceNotes: optionalText(form.resourceNotes),
        assessmentNotes: optionalText(form.assessmentNotes),
        teacherNotes: optionalText(form.teacherNotes),
      });
    } catch (submitError) {
      setError(academicContentUiError(submitError).message);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <form
      noValidate
      className="space-y-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Input
          label={t("name")}
          value={form.name}
          maxLength={180}
          required
          disabled={isSubmitting}
          onChange={(event) => update("name", event.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t("stage")}
            triggerAriaLabel={t("stage")}
            value={form.stageId ?? ""}
            options={selectOptions(
              options?.structure.stages ?? [],
              t("all_stages"),
              form.stageId,
              t("unavailable_selection"),
            )}
            disabled={isSubmitting}
            error={optionsError ?? undefined}
            onChange={(stageId) => update("stageId", stageId || null)}
          />
          <Select
            label={t("subject")}
            triggerAriaLabel={t("subject")}
            value={form.subjectId ?? ""}
            options={selectOptions(
              options?.subjects ?? [],
              t("all_subjects"),
              form.subjectId,
              t("unavailable_selection"),
            )}
            disabled={isSubmitting}
            searchable
            onChange={(subjectId) => update("subjectId", subjectId || null)}
          />
        </div>
      </div>

      <TextArea
        label={t("description")}
        value={form.description ?? ""}
        maxLength={1000}
        disabled={isSubmitting}
        onChange={(event) => update("description", event.target.value)}
      />
      <Input
        label={t("topic")}
        value={form.topic ?? ""}
        maxLength={500}
        disabled={isSubmitting}
        onChange={(event) => update("topic", event.target.value)}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <OrderedTextList
          label={t("objectives")}
          values={form.objectives}
          disabled={isSubmitting}
          maximumItems={MAX_ITEMS}
          maximumLength={MAX_ITEM_LENGTH}
          onChange={(values) => update("objectives", values)}
        />
        <OrderedTextList
          label={t("learning_outcomes")}
          values={form.learningOutcomes}
          disabled={isSubmitting}
          maximumItems={MAX_ITEMS}
          maximumLength={MAX_ITEM_LENGTH}
          onChange={(values) => update("learningOutcomes", values)}
        />
        <OrderedTextList
          label={t("teaching_strategies")}
          values={form.teachingStrategies}
          disabled={isSubmitting}
          maximumItems={MAX_ITEMS}
          maximumLength={MAX_ITEM_LENGTH}
          onChange={(values) => update("teachingStrategies", values)}
        />
        <OrderedTextList
          label={t("activities")}
          values={form.activities}
          disabled={isSubmitting}
          maximumItems={MAX_ITEMS}
          maximumLength={MAX_ITEM_LENGTH}
          onChange={(values) => update("activities", values)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TextArea
          label={t("resource_notes")}
          value={form.resourceNotes ?? ""}
          maxLength={4000}
          disabled={isSubmitting}
          onChange={(event) => update("resourceNotes", event.target.value)}
        />
        <TextArea
          label={t("assessment_notes")}
          value={form.assessmentNotes ?? ""}
          maxLength={4000}
          disabled={isSubmitting}
          onChange={(event) => update("assessmentNotes", event.target.value)}
        />
        <TextArea
          label={t("teacher_notes")}
          value={form.teacherNotes ?? ""}
          maxLength={4000}
          disabled={isSubmitting}
          onChange={(event) => update("teacherNotes", event.target.value)}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          {t("cancel")}
        </Button>
        <Button
          type="submit"
          loading={isSubmitting}
          leftIcon={<Save aria-hidden="true" className="size-4" />}
        >
          {t("save")}
        </Button>
      </div>
    </form>
  );
}
