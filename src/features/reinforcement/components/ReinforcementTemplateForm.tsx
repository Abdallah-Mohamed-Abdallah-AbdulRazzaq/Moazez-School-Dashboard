"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import type {
  CreateReinforcementTemplatePayload,
  ReinforcementProofType,
  ReinforcementRewardType,
  ReinforcementSource,
  ReinforcementStagePayload,
} from "../types";

interface ReinforcementTemplateFormProps {
  onSubmit: (payload: CreateReinforcementTemplatePayload) => Promise<void>;
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

interface DraftStage {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  proofType: ReinforcementProofType;
  requiresApproval: boolean;
}

interface TemplateDraft {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  source: ReinforcementSource;
  rewardType: ReinforcementRewardType;
  rewardValue: string;
  rewardLabelEn: string;
  rewardLabelAr: string;
  stages: DraftStage[];
}

type FormErrors = Partial<Record<string, string>>;

const createEmptyStage = (): DraftStage => ({
  titleEn: "",
  titleAr: "",
  descriptionEn: "",
  descriptionAr: "",
  proofType: "none",
  requiresApproval: true,
});

const createInitialDraft = (): TemplateDraft => ({
  nameEn: "",
  nameAr: "",
  descriptionEn: "",
  descriptionAr: "",
  source: "teacher",
  rewardType: "xp",
  rewardValue: "",
  rewardLabelEn: "",
  rewardLabelAr: "",
  stages: [createEmptyStage()],
});

const optionalString = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed || undefined;
};

const isStageDirty = (stage: DraftStage): boolean =>
  stage.titleEn.trim().length > 0 ||
  stage.titleAr.trim().length > 0 ||
  stage.descriptionEn.trim().length > 0 ||
  stage.descriptionAr.trim().length > 0 ||
  stage.proofType !== "none" ||
  stage.requiresApproval;

export function isReinforcementTemplateDraftDirty(
  draft: TemplateDraft,
): boolean {
  return (
    draft.nameEn.trim().length > 0 ||
    draft.nameAr.trim().length > 0 ||
    draft.descriptionEn.trim().length > 0 ||
    draft.descriptionAr.trim().length > 0 ||
    draft.source !== "teacher" ||
    draft.rewardType !== "xp" ||
    draft.rewardValue.trim().length > 0 ||
    draft.rewardLabelEn.trim().length > 0 ||
    draft.rewardLabelAr.trim().length > 0 ||
    draft.stages.length !== 1 ||
    draft.stages.some(isStageDirty)
  );
}

export function buildReinforcementTemplatePayload(
  draft: TemplateDraft,
): CreateReinforcementTemplatePayload {
  const fallbackName = draft.nameEn.trim() || draft.nameAr.trim();
  const descriptionEn = optionalString(draft.descriptionEn);
  const descriptionAr = optionalString(draft.descriptionAr);
  const rewardValue = optionalString(draft.rewardValue);
  const rewardLabelEn = optionalString(draft.rewardLabelEn);
  const rewardLabelAr = optionalString(draft.rewardLabelAr);

  return {
    nameEn: draft.nameEn.trim() || fallbackName,
    nameAr: draft.nameAr.trim() || fallbackName,
    ...(descriptionEn ? { descriptionEn } : {}),
    ...(descriptionAr ? { descriptionAr } : {}),
    source: draft.source,
    reward: {
      type: draft.rewardType,
      ...(rewardValue ? { value: rewardValue } : {}),
      ...(rewardLabelEn ? { labelEn: rewardLabelEn } : {}),
      ...(rewardLabelAr ? { labelAr: rewardLabelAr } : {}),
    },
    stages: draft.stages.map<ReinforcementStagePayload>((stage, index) => {
      const fallbackTitle = stage.titleEn.trim() || stage.titleAr.trim();
      const stageDescriptionEn = optionalString(stage.descriptionEn);
      const stageDescriptionAr = optionalString(stage.descriptionAr);

      return {
        sortOrder: index + 1,
        titleEn: stage.titleEn.trim() || fallbackTitle,
        titleAr: stage.titleAr.trim() || fallbackTitle,
        ...(stageDescriptionEn ? { descriptionEn: stageDescriptionEn } : {}),
        ...(stageDescriptionAr ? { descriptionAr: stageDescriptionAr } : {}),
        proofType: stage.proofType,
        requiresApproval: stage.requiresApproval,
      };
    }),
  };
}

export default function ReinforcementTemplateForm({
  onSubmit,
  onCancel,
  onDirtyChange,
}: ReinforcementTemplateFormProps) {
  const t = useTranslations("reinforcement");
  const [draft, setDraft] = useState<TemplateDraft>(createInitialDraft);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      setDraft(createInitialDraft());
      setErrors({});
      setIsSaving(false);
      onDirtyChange?.(false);
    });
  }, [onDirtyChange]);

  useEffect(() => {
    onDirtyChange?.(isReinforcementTemplateDraftDirty(draft));
  }, [draft, onDirtyChange]);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!draft.nameEn.trim() && !draft.nameAr.trim()) {
      nextErrors.name = t("validation.titleRequired");
    }
    if (draft.stages.length === 0) {
      nextErrors.stages = t("validation.stageRequired");
    }
    draft.stages.forEach((stage, index) => {
      if (!stage.titleEn.trim() && !stage.titleAr.trim()) {
        nextErrors[`stage-${index}`] = t("validation.titleRequired");
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateStage = (index: number, patch: Partial<DraftStage>) => {
    setDraft((current) => ({
      ...current,
      stages: current.stages.map((stage, stageIndex) =>
        stageIndex === index ? { ...stage, ...patch } : stage,
      ),
    }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await onSubmit(buildReinforcementTemplatePayload(draft));
      onDirtyChange?.(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-4">
      {errors.name ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.name}
        </div>
      ) : null}

      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {t("templates.form.identity")}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t("templates.form.identityDescription")}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={t("templates.form.nameAr")}
            value={draft.nameAr}
            error={errors.name}
            dir="rtl"
            onChange={(event) =>
              setDraft({ ...draft, nameAr: event.target.value })
            }
          />

          <Input
            label={t("templates.form.nameEn")}
            value={draft.nameEn}
            error={errors.name}
            onChange={(event) =>
              setDraft({ ...draft, nameEn: event.target.value })
            }
          />

          <TextArea
            label={t("templates.form.descriptionAr")}
            value={draft.descriptionAr}
            dir="rtl"
            onChange={(event) =>
              setDraft({ ...draft, descriptionAr: event.target.value })
            }
          />

          <TextArea
            label={t("templates.form.descriptionEn")}
            value={draft.descriptionEn}
            onChange={(event) =>
              setDraft({ ...draft, descriptionEn: event.target.value })
            }
          />
        </div>
      </section>

      <section className="rounded-lg border border-gray-100 bg-gray-50 p-4">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900">
            {t("templates.form.reward")}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t("templates.form.rewardDescription")}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Select
            label={t("templates.form.source")}
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
            label={t("templates.form.rewardType")}
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
            label={t("templates.form.rewardValue")}
            type="number"
            value={draft.rewardValue}
            onChange={(event) =>
              setDraft({ ...draft, rewardValue: event.target.value })
            }
          />

          <Input
            label={t("templates.form.rewardLabelAr")}
            value={draft.rewardLabelAr}
            dir="rtl"
            onChange={(event) =>
              setDraft({ ...draft, rewardLabelAr: event.target.value })
            }
          />

          <Input
            label={t("templates.form.rewardLabelEn")}
            value={draft.rewardLabelEn}
            onChange={(event) =>
              setDraft({ ...draft, rewardLabelEn: event.target.value })
            }
          />
        </div>
      </section>

      <section className="rounded-lg border border-gray-100 bg-white p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {t("templates.form.stages")}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t("templates.form.stagesDescription")}
            </p>
            {errors.stages ? (
              <p className="mt-1 text-sm text-red-600">{errors.stages}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="secondary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() =>
              setDraft((current) => ({
                ...current,
                stages: [...current.stages, createEmptyStage()],
              }))
            }
          >
            {t("templates.form.addStage")}
          </Button>
        </div>

        <div className="space-y-4">
          {draft.stages.map((stage, index) => (
            <article
              key={`template-stage-${index}`}
              className="rounded-lg border border-gray-100 bg-gray-50 p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-gray-900">
                  {t("templates.form.stageLabel", { number: index + 1 })}
                </h4>
                {draft.stages.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        stages: current.stages.filter(
                          (_, stageIndex) => stageIndex !== index,
                        ),
                      }))
                    }
                    className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("templates.form.removeStage")}
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label={t("templates.form.stageTitleAr")}
                  value={stage.titleAr}
                  error={errors[`stage-${index}`]}
                  dir="rtl"
                  onChange={(event) =>
                    updateStage(index, { titleAr: event.target.value })
                  }
                />

                <Input
                  label={t("templates.form.stageTitleEn")}
                  value={stage.titleEn}
                  error={errors[`stage-${index}`]}
                  onChange={(event) =>
                    updateStage(index, { titleEn: event.target.value })
                  }
                />

                <TextArea
                  label={t("templates.form.stageDescriptionAr")}
                  value={stage.descriptionAr}
                  dir="rtl"
                  onChange={(event) =>
                    updateStage(index, { descriptionAr: event.target.value })
                  }
                />

                <TextArea
                  label={t("templates.form.stageDescriptionEn")}
                  value={stage.descriptionEn}
                  onChange={(event) =>
                    updateStage(index, { descriptionEn: event.target.value })
                  }
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Select
                  label={t("templates.form.proofType")}
                  value={stage.proofType}
                  onChange={(value) =>
                    updateStage(index, {
                      proofType: value as ReinforcementProofType,
                    })
                  }
                  options={[
                    { value: "none", label: t("proofType.none") },
                    { value: "image", label: t("proofType.image") },
                    { value: "video", label: t("proofType.video") },
                    { value: "document", label: t("proofType.document") },
                  ]}
                />
                <label className="flex min-h-[70px] items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={stage.requiresApproval}
                    onChange={(event) =>
                      updateStage(index, {
                        requiresApproval: event.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>{t("templates.form.requiresApproval")}</span>
                </label>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t("actions.cancel")}
        </Button>
        <Button
          type="button"
          variant="primary"
          loading={isSaving}
          onClick={handleSubmit}
        >
          {t("templates.form.create")}
        </Button>
      </div>
    </div>
  );
}
