"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import Select from "@/components/ui/input/Select";
import DatePicker from "@/components/ui/input/DatePicker";
import Button from "@/components/ui/button/Button";
import type {
  CreateReinforcementStagePayload,
  CreateReinforcementTaskPayload,
  ReinforcementAssignmentScope,
  ReinforcementRewardType,
  ReinforcementScopeOption,
  ReinforcementProofType,
} from "../../types/reinforcement";

interface ReinforcementTaskModalProps {
  isOpen: boolean;
  scopeTargets: Record<ReinforcementAssignmentScope, ReinforcementScopeOption[]>;
  onClose: () => void;
  onSave: (payload: CreateReinforcementTaskPayload) => Promise<void>;
}

const createEmptyStage = (): CreateReinforcementStagePayload => ({
  titleAr: "",
  titleEn: "",
  descriptionAr: "",
  descriptionEn: "",
  proofType: "none",
});

const initialDraft: CreateReinforcementTaskPayload = {
  titleAr: "",
  titleEn: "",
  descriptionAr: "",
  descriptionEn: "",
  targets: [],
  stages: [createEmptyStage()],
  source: "teacher",
  rewardType: "moral",
  rewardValue: "",
  dueDate: undefined,
  assignedById: undefined,
  assignedByName: undefined,
};

export default function ReinforcementTaskModal({
  isOpen,
  scopeTargets,
  onClose,
  onSave,
}: ReinforcementTaskModalProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement.modal.task");
  const tRoot = useTranslations("reinforcement");
  const tCommon = useTranslations("common");
  const [draft, setDraft] = useState<CreateReinforcementTaskPayload>(initialDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [assignmentScope, setAssignmentScope] =
    useState<ReinforcementAssignmentScope>("student");
  const [targetId, setTargetId] = useState("");

  const currentOptions = useMemo(
    () => scopeTargets[assignmentScope] || [],
    [assignmentScope, scopeTargets],
  );

  const selectedTargetLabels = useMemo(
    () =>
      draft.targets
        .map((target) => {
          const match = currentOptions.find((option) => option.value === target.scopeId);
          return {
            id: `${target.scopeType}:${target.scopeId}`,
            label:
              (locale === "ar" ? match?.nameAr : match?.nameEn) || target.scopeId,
          };
        })
        .filter((item) => Boolean(item.label)),
    [currentOptions, draft.targets, locale],
  );

  useEffect(() => {
    if (!isOpen) return;
    void Promise.resolve().then(() => setDraft(initialDraft));
    void Promise.resolve().then(() => setAssignmentScope("student"));
    void Promise.resolve().then(() => setTargetId(""));
    void Promise.resolve().then(() => setIsSaving(false));
  }, [isOpen]);

  const handleAddTarget = () => {
    if (!targetId) return;
    if (draft.targets.some((target) => target.scopeId === targetId)) return;

    setDraft({
      ...draft,
      targets: [...draft.targets, { scopeType: assignmentScope, scopeId: targetId }],
    });
    setTargetId("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("createTitle")}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={isSaving}
            disabled={
              !draft.titleAr ||
              !draft.titleEn ||
              draft.targets.length === 0 ||
              draft.stages.length === 0 ||
              draft.stages.some((stage) => !stage.titleAr || !stage.titleEn)
            }
          >
            {t("create")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label={t("titleAr")}
            value={draft.titleAr}
            onChange={(event) => setDraft({ ...draft, titleAr: event.target.value })}
          />
          <Input
            label={t("titleEn")}
            value={draft.titleEn}
            onChange={(event) => setDraft({ ...draft, titleEn: event.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextArea
            label={t("descriptionAr")}
            value={draft.descriptionAr}
            onChange={(event) => setDraft({ ...draft, descriptionAr: event.target.value })}
          />
          <TextArea
            label={t("descriptionEn")}
            value={draft.descriptionEn}
            onChange={(event) => setDraft({ ...draft, descriptionEn: event.target.value })}
          />
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select
              label={t("assignmentLevel")}
              value={assignmentScope}
              onChange={(value) => {
                setAssignmentScope(value as ReinforcementAssignmentScope);
                setTargetId("");
                setDraft((current) => ({ ...current, targets: [] }));
              }}
              options={[
                { value: "school", label: tRoot("assignmentScope.school") },
                { value: "stage", label: tRoot("assignmentScope.stage") },
                { value: "grade", label: tRoot("assignmentScope.grade") },
                { value: "section", label: tRoot("assignmentScope.section") },
                { value: "classroom", label: tRoot("assignmentScope.classroom") },
                { value: "student", label: tRoot("assignmentScope.student") },
              ]}
            />
            <Select
              label={t("target")}
              value={targetId}
              onChange={setTargetId}
              options={currentOptions.map((option) => ({
                value: option.value,
                label: `${locale === "ar" ? option.nameAr : option.nameEn} (${option.audienceCount})`,
                searchText: `${option.nameEn} ${option.nameAr}`,
              }))}
              searchable
            />
            <div className="flex items-end">
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleAddTarget}
                disabled={!targetId}
              >
                {t("addTarget")}
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-sm font-medium text-gray-700">
              {t("selectedTargets")}
            </div>
            {selectedTargetLabels.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedTargetLabels.map((target) => (
                  <button
                    key={target.id}
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        targets: draft.targets.filter(
                          (item) => `${item.scopeType}:${item.scopeId}` !== target.id,
                        ),
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm ring-1 ring-gray-200"
                  >
                    <span>{target.label}</span>
                    <X className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-white px-4 py-3 text-sm text-gray-500 ring-1 ring-gray-200">
                {t("noTargets")}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select
            label={t("rewardType")}
            value={draft.rewardType}
            onChange={(value) =>
              setDraft({ ...draft, rewardType: value as ReinforcementRewardType })
            }
            options={[
              { value: "moral", label: t("rewardTypeOptions.moral") },
              { value: "financial", label: t("rewardTypeOptions.financial") },
              { value: "xp", label: t("rewardTypeOptions.xp") },
              { value: "badge", label: t("rewardTypeOptions.badge") },
            ]}
          />
          <Input
            label={t("rewardValue")}
            value={draft.rewardValue}
            onChange={(event) => setDraft({ ...draft, rewardValue: event.target.value })}
          />
          <DatePicker
            label={t("dueDate")}
            value={draft.dueDate ? new Date(draft.dueDate) : null}
            onChange={(value) =>
              setDraft({
                ...draft,
                dueDate: value ? value.toISOString().split("T")[0] : undefined,
              })
            }
          />
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">{t("stages")}</h3>
              <p className="text-sm text-gray-500">{t("stagesDescription")}</p>
            </div>
            <Button
              variant="secondary"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  stages: [...current.stages, createEmptyStage()],
                }))
              }
            >
              {t("addStage")}
            </Button>
          </div>

          <div className="space-y-4">
            {draft.stages.map((stage, index) => (
              <div key={`stage-${index}`} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-gray-900">
                    {t("stageLabel", { number: index + 1 })}
                  </div>
                  {draft.stages.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          stages: current.stages.filter((_, stageIndex) => stageIndex !== index),
                        }))
                      }
                      className="text-sm font-medium text-rose-600 hover:text-rose-700"
                    >
                      {t("removeStage")}
                    </button>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    label={t("stageTitleAr")}
                    value={stage.titleAr}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        stages: current.stages.map((item, stageIndex) =>
                          stageIndex === index
                            ? { ...item, titleAr: event.target.value }
                            : item,
                        ),
                      }))
                    }
                  />
                  <Input
                    label={t("stageTitleEn")}
                    value={stage.titleEn}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        stages: current.stages.map((item, stageIndex) =>
                          stageIndex === index
                            ? { ...item, titleEn: event.target.value }
                            : item,
                        ),
                      }))
                    }
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextArea
                    label={t("stageDescriptionAr")}
                    value={stage.descriptionAr}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        stages: current.stages.map((item, stageIndex) =>
                          stageIndex === index
                            ? { ...item, descriptionAr: event.target.value }
                            : item,
                        ),
                      }))
                    }
                  />
                  <TextArea
                    label={t("stageDescriptionEn")}
                    value={stage.descriptionEn}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        stages: current.stages.map((item, stageIndex) =>
                          stageIndex === index
                            ? { ...item, descriptionEn: event.target.value }
                            : item,
                        ),
                      }))
                    }
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Select
                    label={t("proofType")}
                    value={stage.proofType}
                    onChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        stages: current.stages.map((item, stageIndex) =>
                          stageIndex === index
                            ? { ...item, proofType: value as ReinforcementProofType }
                            : item,
                        ),
                      }))
                    }
                    options={[
                      { value: "none", label: tRoot("proofType.none") },
                      { value: "image", label: tRoot("proofType.image") },
                      { value: "video", label: tRoot("proofType.video") },
                      { value: "document", label: tRoot("proofType.document") },
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
