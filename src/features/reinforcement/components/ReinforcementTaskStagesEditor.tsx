"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import type {
  ReinforcementProofType,
  ReinforcementStagePayload,
} from "../types";

export type ReinforcementTaskStageDraft = Omit<
  ReinforcementStagePayload,
  "sortOrder"
>;

interface ReinforcementTaskStagesEditorProps {
  stages: ReinforcementTaskStageDraft[];
  onChange: (stages: ReinforcementTaskStageDraft[]) => void;
  errors?: Record<number, string>;
  disabled?: boolean;
}

export const createEmptyTaskStage = (): ReinforcementTaskStageDraft => ({
  titleEn: "",
  titleAr: "",
  descriptionEn: "",
  descriptionAr: "",
  proofType: "none",
  requiresApproval: false,
});

export const mapTaskStagesToPayload = (
  stages: ReinforcementTaskStageDraft[],
): ReinforcementStagePayload[] =>
  stages.map((stage, index) => {
    const fallbackTitle = stage.titleEn.trim() || stage.titleAr.trim();
    return {
      sortOrder: index + 1,
      titleEn: stage.titleEn.trim() || fallbackTitle,
      titleAr: stage.titleAr.trim() || fallbackTitle,
      descriptionEn: stage.descriptionEn?.trim() || undefined,
      descriptionAr: stage.descriptionAr?.trim() || undefined,
      proofType: stage.proofType,
      requiresApproval: Boolean(stage.requiresApproval),
    };
  });

export default function ReinforcementTaskStagesEditor({
  stages,
  onChange,
  errors = {},
  disabled = false,
}: ReinforcementTaskStagesEditorProps) {
  const t = useTranslations("reinforcement");

  const updateStage = (
    index: number,
    patch: Partial<ReinforcementTaskStageDraft>,
  ) => {
    onChange(
      stages.map((stage, stageIndex) =>
        stageIndex === index ? { ...stage, ...patch } : stage,
      ),
    );
  };

  return (
    <section className="rounded-lg border border-gray-100 bg-white p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {t("tasks.form.stages")}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t("tasks.form.stagesDescription")}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          leftIcon={<Plus className="h-4 w-4" />}
          disabled={disabled}
          onClick={() => onChange([...stages, createEmptyTaskStage()])}
        >
          {t("tasks.form.addStage")}
        </Button>
      </div>

      <div className="space-y-4">
        {stages.map((stage, index) => (
          <article
            key={`task-stage-${index}`}
            className="rounded-lg border border-gray-100 bg-gray-50 p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-gray-900">
                {t("tasks.form.stageLabel", { number: index + 1 })}
              </h4>
              {stages.length > 1 ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    onChange(
                      stages.filter((_, stageIndex) => stageIndex !== index),
                    )
                  }
                  className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("tasks.form.removeStage")}
                </button>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label={t("tasks.form.stageTitleAr")}
                value={stage.titleAr}
                error={errors[index]}
                disabled={disabled}
                dir="rtl"
                onChange={(event) =>
                  updateStage(index, { titleAr: event.target.value })
                }
              />

              <Input
                label={t("tasks.form.stageTitleEn")}
                value={stage.titleEn}
                error={errors[index]}
                disabled={disabled}
                onChange={(event) =>
                  updateStage(index, { titleEn: event.target.value })
                }
              />

              <TextArea
                label={t("tasks.form.stageDescriptionAr")}
                value={stage.descriptionAr}
                disabled={disabled}
                dir="rtl"
                onChange={(event) =>
                  updateStage(index, { descriptionAr: event.target.value })
                }
              />

              <TextArea
                label={t("tasks.form.stageDescriptionEn")}
                value={stage.descriptionEn}
                disabled={disabled}
                onChange={(event) =>
                  updateStage(index, { descriptionEn: event.target.value })
                }
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Select
                label={t("tasks.form.proofType")}
                value={stage.proofType}
                disabled={disabled}
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
                  checked={Boolean(stage.requiresApproval)}
                  disabled={disabled}
                  onChange={(event) =>
                    updateStage(index, {
                      requiresApproval: event.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>{t("tasks.form.requiresApproval")}</span>
              </label>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
