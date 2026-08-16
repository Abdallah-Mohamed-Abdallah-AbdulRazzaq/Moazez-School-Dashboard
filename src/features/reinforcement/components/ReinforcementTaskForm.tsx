"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Hash } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import ReinforcementAcademicContextFilter, {
  type ReinforcementAcademicContextSelection,
  type ReinforcementAcademicContextValue,
} from "./ReinforcementAcademicContextFilter";
import ReinforcementTaskTargetSelector, {
  type ReinforcementTaskTargetSelection,
} from "./ReinforcementTaskTargetSelector";
import ReinforcementTaskStagesEditor, {
  createEmptyTaskStage,
  mapTaskStagesToPayload,
  type ReinforcementTaskStageDraft,
} from "./ReinforcementTaskStagesEditor";
import type {
  CreateReinforcementTaskPayload,
  ReinforcementRewardType,
  ReinforcementSource,
} from "../types";

interface ReinforcementTaskFormProps {
  onSubmit: (payload: CreateReinforcementTaskPayload) => Promise<void>;
}

interface TaskDraft {
  context: ReinforcementAcademicContextValue;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  source: ReinforcementSource;
  rewardType: ReinforcementRewardType;
  rewardValue: string;
  rewardLabelEn: string;
  rewardLabelAr: string;
  dueDate: string;
  targets: ReinforcementTaskTargetSelection[];
  stages: ReinforcementTaskStageDraft[];
}

type FormErrors = Partial<Record<string, string>>;

const formatDateInput = (date: Date): string => date.toISOString().slice(0, 10);

export const getDefaultReinforcementDueDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return formatDateInput(date);
};

const optionalString = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed || undefined;
};

export function buildReinforcementTaskPayload(
  draft: TaskDraft,
): CreateReinforcementTaskPayload {
  const fallbackTitle = draft.titleEn.trim() || draft.titleAr.trim();
  const descriptionEn = optionalString(draft.descriptionEn);
  const descriptionAr = optionalString(draft.descriptionAr);
  const rewardValue = draft.rewardValue.trim()
    ? Number(draft.rewardValue)
    : undefined;
  const rewardLabelEn = optionalString(draft.rewardLabelEn);
  const rewardLabelAr = optionalString(draft.rewardLabelAr);
  if (!draft.context.termId) {
    throw new Error("A term is required to create a reinforcement task.");
  }

  return {
    ...(draft.context.academicYearId
      ? { academicYearId: draft.context.academicYearId }
      : {}),
    termId: draft.context.termId,
    ...(draft.context.subjectId ? { subjectId: draft.context.subjectId } : {}),
    titleEn: draft.titleEn.trim() || fallbackTitle,
    titleAr: draft.titleAr.trim() || fallbackTitle,
    ...(descriptionEn ? { descriptionEn } : {}),
    ...(descriptionAr ? { descriptionAr } : {}),
    source: draft.source,
    rewardType: draft.rewardType,
    ...(rewardValue !== undefined ? { rewardValue } : {}),
    ...(rewardLabelEn ? { rewardLabelEn } : {}),
    ...(rewardLabelAr ? { rewardLabelAr } : {}),
    dueDate: draft.dueDate,
    targets: draft.targets.map((target) => ({
      scopeType: target.scopeType,
      scopeId: target.scopeId,
    })),
    stages: mapTaskStagesToPayload(draft.stages),
  };
}

export default function ReinforcementTaskForm({
  onSubmit,
}: ReinforcementTaskFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { academicYearId, termId, isInitializing } =
    useAcademicYearTermLayoutContext();
  const [draft, setDraft] = useState<TaskDraft>({
    context: {},
    titleEn: "",
    titleAr: "",
    descriptionEn: "",
    descriptionAr: "",
    source: "teacher",
    rewardType: "xp",
    rewardValue: "",
    rewardLabelEn: "",
    rewardLabelAr: "",
    dueDate: getDefaultReinforcementDueDate(),
    targets: [],
    stages: [createEmptyTaskStage()],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isInitializing) return;
    void Promise.resolve().then(() => setDraft((current) => {
      if (
        current.context.academicYearId === academicYearId &&
        current.context.termId === termId
      ) {
        return current;
      }

      return {
        ...current,
        context: {
          ...current.context,
          academicYearId,
          termId,
          stageId: undefined,
          gradeId: undefined,
          sectionId: undefined,
          classroomId: undefined,
          subjectId: undefined,
          studentId: undefined,
          enrollmentId: undefined,
        },
        targets: [],
      };
    }));
  }, [academicYearId, isInitializing, termId]);

  const stageErrors = useMemo(() => {
    const next: Record<number, string> = {};
    draft.stages.forEach((stage, index) => {
      if (!stage.titleEn.trim() && !stage.titleAr.trim()) {
        next[index] = errors[`stage-${index}`] || "";
      }
    });
    return next;
  }, [draft.stages, errors]);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!draft.context.academicYearId)
      next.academicYear = t("validation.required");
    if (!draft.context.termId) next.term = t("validation.required");
    if (!draft.titleEn.trim() && !draft.titleAr.trim()) {
      next.title = t("validation.titleRequired");
    }
    if (!draft.dueDate) next.dueDate = t("validation.futureDueDateRequired");
    if (
      draft.rewardValue.trim() &&
      (!Number.isFinite(Number(draft.rewardValue)) || Number(draft.rewardValue) < 0)
    ) {
      next.rewardValue = t("validation.rewardValueInvalid");
    }
    if (draft.targets.length === 0)
      next.targets = t("validation.targetRequired");
    if (draft.stages.length === 0) next.stages = t("validation.stageRequired");
    draft.stages.forEach((stage, index) => {
      if (!stage.titleEn.trim() && !stage.titleAr.trim()) {
        next[`stage-${index}`] = t("validation.titleRequired");
      }
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit(buildReinforcementTaskPayload(draft));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">
          {t("tasks.form.context")}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {t("tasks.form.contextDescription")}
        </p>
        <div className="mt-4">
          <ReinforcementAcademicContextFilter
            value={draft.context}
            showAcademicYearTerm={false}
            showStage
            showGrade
            showSection={false}
            showClassroom={false}
            showStudent={false}
            subjectDependsOnGrade
            showSubject
            onChange={(selection: ReinforcementAcademicContextSelection) =>
              setDraft((current) => ({
                ...current,
                context: {
                  academicYearId: selection.academicYearId,
                  termId: selection.termId,
                  stageId: selection.stageId,
                  gradeId: selection.gradeId,
                  sectionId: selection.sectionId,
                  classroomId: selection.classroomId,
                  subjectId: selection.subjectId,
                  studentId: selection.studentId,
                  enrollmentId: selection.enrollmentId,
                },
              }))
            }
          />
        </div>
        {(errors.academicYear || errors.term) && (
          <p className="mt-3 text-sm text-red-600">
            {errors.academicYear || errors.term}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">
          {t("tasks.form.details")}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input
            label={t("tasks.form.titleAr")}
            value={draft.titleAr}
            error={errors.title}
            dir="rtl"
            onChange={(event) =>
              setDraft({ ...draft, titleAr: event.target.value })
            }
          />

          <Input
            label={t("tasks.form.titleEn")}
            value={draft.titleEn}
            error={errors.title}
            onChange={(event) =>
              setDraft({ ...draft, titleEn: event.target.value })
            }
          />

          <TextArea
            label={t("tasks.form.descriptionAr")}
            value={draft.descriptionAr}
            dir="rtl"
            onChange={(event) =>
              setDraft({ ...draft, descriptionAr: event.target.value })
            }
          />

          <TextArea
            label={t("tasks.form.descriptionEn")}
            value={draft.descriptionEn}
            onChange={(event) =>
              setDraft({ ...draft, descriptionEn: event.target.value })
            }
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-violet-100 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-violet-100 bg-violet-50/60 px-4 py-3">
          <span className="mt-0.5 rounded-lg bg-violet-100 p-2 text-violet-700">
            <Gift className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {t("tasks.form.reward")}
            </h2>
            <p className="mt-0.5 text-sm text-gray-600">
              {t("tasks.form.rewardDescription")}
            </p>
          </div>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
          <Select
            label={t("tasks.form.source")}
            value={draft.source}
            onChange={(value) =>
              setDraft({ ...draft, source: value as ReinforcementSource })
            }
            options={[
              { value: "teacher", label: t("source.teacher") },
              { value: "parent", label: t("source.parent") },
              { value: "system", label: t("source.system") },
            ]}
          />
          <Select
            label={t("tasks.form.rewardType")}
            value={draft.rewardType}
            onChange={(value) =>
              setDraft({
                ...draft,
                rewardType: value as ReinforcementRewardType,
              })
            }
            options={[
              { value: "xp", label: t("rewardType.xp") },
              { value: "badge", label: t("rewardType.badge") },
              { value: "moral", label: t("rewardType.moral") },
              { value: "financial", label: t("rewardType.financial") },
            ]}
          />
          <Input
            type="number"
            min={0}
            label={t("tasks.form.rewardValue")}
            helperText={t("tasks.form.rewardValueHint")}
            leftIcon={<Hash className="h-4 w-4" aria-hidden="true" />}
            value={draft.rewardValue}
            error={errors.rewardValue}
            onChange={(event) =>
              setDraft({ ...draft, rewardValue: event.target.value })
            }
          />

          <Input
            label={t("tasks.form.rewardLabelAr")}
            value={draft.rewardLabelAr}
            dir="rtl"
            onChange={(event) =>
              setDraft({ ...draft, rewardLabelAr: event.target.value })
            }
          />

          <Input
            label={t("tasks.form.rewardLabelEn")}
            value={draft.rewardLabelEn}
            onChange={(event) =>
              setDraft({ ...draft, rewardLabelEn: event.target.value })
            }
          />
          <Input
            type="date"
            label={t("tasks.form.dueDate")}
            value={draft.dueDate}
            error={errors.dueDate}
            onChange={(event) =>
              setDraft({ ...draft, dueDate: event.target.value })
            }
          />
        </div>
      </section>

      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">
          {t("tasks.form.targets")}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {t("tasks.form.targetsDescription")}
        </p>
        <div className="mt-4">
          <ReinforcementTaskTargetSelector
            academicYearId={draft.context.academicYearId}
            termId={draft.context.termId}
            defaultScope="student"
            value={draft.targets}
            onChange={(targets) => setDraft({ ...draft, targets })}
          />
        </div>
        {errors.targets ? (
          <p className="mt-3 text-sm text-red-600">{errors.targets}</p>
        ) : null}
      </section>

      <ReinforcementTaskStagesEditor
        stages={draft.stages}
        errors={stageErrors}
        onChange={(stages) => setDraft({ ...draft, stages })}
      />
      {errors.stages ? (
        <p className="text-sm text-red-600">{errors.stages}</p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          {t("actions.cancel")}
        </Button>
        <Button type="button" loading={saving} onClick={handleSubmit}>
          {t("tasks.form.create")}
        </Button>
      </div>
    </div>
  );
}
