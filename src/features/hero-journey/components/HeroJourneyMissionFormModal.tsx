"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button, ConfirmDialog, Input, Modal, Select } from "@/components/ui";
import WizardStepper from "@/features/academics/timetable/components/WizardStepper";
import type { SelectOption } from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import type { HeroJourneyBadge, HeroJourneyMission } from "../types";
import { HERO_MISSION_OBJECTIVE_TYPES } from "../services/heroJourneyMissionContract";
import type {
  HeroMissionEditableField,
  HeroMissionFormCandidate,
  HeroMissionObjectiveCandidate,
} from "../services/heroJourneyMissionContract";

type RelatedSelectOption = SelectOption & {
  stageId?: string;
  gradeId?: string;
  gradeIds?: string[];
  subjectId?: string;
  scopeType?: string;
  scopeId?: string;
};

type HeroJourneyMissionFormPayload = Omit<
  HeroMissionFormCandidate,
  "academicYearId" | "yearId" | "termId"
>;

interface HeroJourneyMissionFormModalProps {
  isOpen: boolean;
  mission: HeroJourneyMission | null;
  badges: HeroJourneyBadge[];
  academicYearLabel: string;
  termLabel: string;
  stageOptions: RelatedSelectOption[];
  gradeOptions: RelatedSelectOption[];
  subjectOptions: RelatedSelectOption[];
  assessmentOptions: RelatedSelectOption[];
  optionsLoading?: boolean;
  optionsError?: string | null;
  onLoadLessons: (
    gradeId: string,
    subjectId: string,
  ) => Promise<RelatedSelectOption[]>;
  onRefreshOptions?: () => void;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (
    payload: HeroJourneyMissionFormPayload,
    dirtyFields: ReadonlySet<HeroMissionEditableField>,
  ) => Promise<void> | void;
}

const blankObjective = (): HeroMissionObjectiveCandidate => ({
  type: "manual",
  titleEn: "",
  titleAr: "",
  subtitleEn: "",
  subtitleAr: "",
  linkedLessonRef: "",
  linkedAssessmentId: null,
  isRequired: true,
});

const missionObjectivesForForm = (
  mission: HeroJourneyMission | null,
): HeroMissionObjectiveCandidate[] => {
  const objectives = mission?.objectives || [];
  if (objectives.length === 0) {
    return [blankObjective()];
  }

  return objectives.map((objective) => ({
    type: objective.type || "manual",
    titleEn: objective.titleEn || "",
    titleAr: objective.titleAr || "",
    subtitleEn: objective.subtitleEn,
    subtitleAr: objective.subtitleAr,
    linkedAssessmentId: objective.linkedAssessmentId,
    linkedLessonRef: objective.linkedLessonRef,
    sortOrder: objective.sortOrder,
    isRequired: objective.isRequired ?? true,
    metadata: objective.metadata,
  }));
};

const withSelectedOption = (
  options: RelatedSelectOption[],
  value: string,
  label: string,
): RelatedSelectOption[] => {
  if (!value || options.some((option) => option.value === value)) {
    return options;
  }

  return [{ value, label }, ...options];
};

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ReviewItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
        {value || "—"}
      </div>
    </div>
  );
}

export default function HeroJourneyMissionFormModal({
  isOpen,
  mission,
  badges,
  academicYearLabel,
  termLabel,
  stageOptions,
  gradeOptions,
  subjectOptions,
  assessmentOptions,
  optionsLoading = false,
  optionsError,
  onLoadLessons,
  onRefreshOptions,
  loading = false,
  onClose,
  onSubmit,
}: HeroJourneyMissionFormModalProps) {
  const tCommon = useTranslations("common");
  const t = useTranslations("heroJourney.missionForm");
  const locale = useLocale();
  const missionMetadata = mission?.metadata as
    | {
        academicScope?: {
          gradeId?: string;
          gradeLabel?: string;
        };
      }
    | undefined;
  const [stageId, setStageId] = useState(mission?.stageId || "");
  const [gradeId, setGradeId] = useState(
    mission?.gradeId || missionMetadata?.academicScope?.gradeId || "",
  );
  const [subjectId, setSubjectId] = useState(mission?.subjectId || "");
  const [linkedAssessmentId, setLinkedAssessmentId] = useState(
    mission?.linkedAssessmentId || mission?.linkedQuizId || "",
  );
  const [linkedLessonRef, setLinkedLessonRef] = useState(
    mission?.linkedLessonRef || mission?.linkedLessonId || "",
  );
  const [titleEn, setTitleEn] = useState(mission?.titleEn || "");
  const [titleAr, setTitleAr] = useState(mission?.titleAr || "");
  const [briefEn, setBriefEn] = useState(mission?.briefEn || "");
  const [briefAr, setBriefAr] = useState(mission?.briefAr || "");
  const [requiredLevel, setRequiredLevel] = useState(
    typeof mission?.requiredLevel === "number"
      ? String(mission.requiredLevel)
      : "",
  );
  const [rewardXp, setRewardXp] = useState(
    typeof mission?.rewardXp === "number" ? String(mission.rewardXp) : "",
  );
  const [badgeRewardId, setBadgeRewardId] = useState(
    mission?.badgeRewardId || "",
  );
  const [sortOrder, setSortOrder] = useState(
    typeof mission?.sortOrder === "number" ? String(mission.sortOrder) : "",
  );
  const [positionX, setPositionX] = useState(
    typeof mission?.positionX === "number" ? String(mission.positionX) : "",
  );
  const [positionY, setPositionY] = useState(
    typeof mission?.positionY === "number" ? String(mission.positionY) : "",
  );
  const [objectives, setObjectives] = useState<
    HeroMissionObjectiveCandidate[]
  >(missionObjectivesForForm(mission));
  const [dirtyFields, setDirtyFields] = useState<
    Set<HeroMissionEditableField>
  >(new Set());
  const [activeStep, setActiveStep] = useState(0);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lessonOptions, setLessonOptions] = useState<RelatedSelectOption[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonsError, setLessonsError] = useState<string | null>(null);
  const [isResolvingLinkedLessonScope, setIsResolvingLinkedLessonScope] =
    useState(false);
  const [hasResolvedLinkedLessonScope, setHasResolvedLinkedLessonScope] =
    useState(false);
  const selectedStage = stageOptions.find((option) => option.value === stageId);
  const selectedStageTokens = [
    stageId,
    selectedStage?.label,
    selectedStage?.searchText,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  const relatedGradeOptions = gradeOptions.filter(
    (option) => !stageId || option.stageId === stageId,
  );
  const visibleGradeOptions = withSelectedOption(
    relatedGradeOptions,
    gradeId,
    missionMetadata?.academicScope?.gradeLabel || t("placeholders.selectedGrade"),
  );
  const relatedSubjectOptions = subjectOptions.filter(
    (option) => {
      const gradeIds = option.gradeIds || [];
      const matchesGrade =
        !gradeId || gradeIds.length === 0 || gradeIds.includes(gradeId);
      const matchesStage =
        !stageId ||
        !option.stageId ||
        selectedStageTokens.some((token) =>
          String(option.stageId).toLowerCase().includes(token),
        ) ||
        selectedStageTokens.some((token) =>
          token.includes(String(option.stageId).toLowerCase()),
        );

      return matchesGrade && matchesStage;
    },
  );
  const relatedLessonOptions = lessonOptions.filter(
    (option) => !subjectId || option.subjectId === subjectId,
  );
  const visibleLessonOptions = withSelectedOption(
    relatedLessonOptions,
    linkedLessonRef,
    mission?.linkedLessonTitleEn || t("placeholders.selectedLesson"),
  );
  const relatedAssessmentOptions = assessmentOptions.filter((option) => {
    if (!subjectId || option.subjectId !== subjectId) return false;
    const optionScopeType = option.scopeType?.toLowerCase();
    if (!optionScopeType || !option.scopeId || optionScopeType === "school") {
      return true;
    }

    const selectedScopes = [
      { type: "stage", id: stageId },
      { type: "grade", id: gradeId },
    ];

    return selectedScopes.some(
      (scope) =>
        scope.id && optionScopeType === scope.type && option.scopeId === scope.id,
    );
  });
  const selectedAssessment = assessmentOptions.find(
    (option) => option.value === linkedAssessmentId,
  );
  const visibleAssessmentOptions = withSelectedOption(
    relatedAssessmentOptions,
    linkedAssessmentId,
    selectedAssessment?.label ||
      mission?.linkedQuizTitleEn ||
      t("placeholders.selectedAssessment"),
  );
  const visibleBadgeOptions = withSelectedOption(
    badges.map((badge) => ({
      value: badge.id,
      label: badge.nameEn || badge.slug,
    })),
    badgeRewardId,
    mission?.badgeRewardNameEn ||
      mission?.badgeRewardSlug ||
    t("placeholders.selectedBadge"),
  );
  const objectiveTypeOptions = HERO_MISSION_OBJECTIVE_TYPES.map((type) => ({
    value: type,
    label: t(`objectiveTypes.${type}`),
  }));
  const objectiveAssessmentOptions = (assessmentId?: string | null) => [
    { value: "__none__", label: t("options.noAssessment") },
    ...withSelectedOption(
      relatedAssessmentOptions,
      assessmentId || "",
      t("placeholders.selectedAssessment"),
    ),
  ];
  const objectiveLessonOptions = (lessonRef?: string | null) => [
    { value: "__none__", label: t("placeholders.noLesson") },
    ...withSelectedOption(
      visibleLessonOptions,
      lessonRef || "",
      t("placeholders.selectedLesson"),
    ),
  ];
  const isEditing = Boolean(mission);
  const isPublished = mission?.status === "published";
  const protectedEditFieldsDisabled = Boolean(isPublished);

  const markDirty = (...fields: HeroMissionEditableField[]) => {
    setDirtyFields((current) => {
      const next = new Set(current);
      fields.forEach((field) => next.add(field));
      return next;
    });
  };

  const handleStageChange = (nextStageId: string) => {
    setStageId(nextStageId);
    setGradeId("");
    setSubjectId("");
    setLinkedLessonRef("");
    setLinkedAssessmentId("");
    setLessonOptions([]);
    setLessonsError(null);
    setHasResolvedLinkedLessonScope(false);
    markDirty("stageId", "subjectId", "linkedLessonRef", "linkedAssessmentId");
  };

  const handleGradeChange = (nextGradeId: string) => {
    setGradeId(nextGradeId);
    setSubjectId("");
    setLinkedLessonRef("");
    setLinkedAssessmentId("");
    setLessonOptions([]);
    setLessonsError(null);
    setHasResolvedLinkedLessonScope(false);
    markDirty("subjectId", "linkedLessonRef", "linkedAssessmentId");
  };

  const handleSubjectChange = (nextSubjectId: string) => {
    setSubjectId(nextSubjectId);
    setLinkedLessonRef("");
    setLinkedAssessmentId("");
    setLessonOptions([]);
    setLessonsError(null);
    setHasResolvedLinkedLessonScope(false);
    markDirty("subjectId", "linkedLessonRef", "linkedAssessmentId");
  };

  useEffect(() => {
    if (!gradeId || !subjectId) {
      return;
    }

    let cancelled = false;

    void Promise.resolve()
      .then(() => {
        if (!cancelled) {
          setLessonsLoading(true);
          setLessonsError(null);
        }
        return onLoadLessons(gradeId, subjectId);
      })
      .then((options) => {
        if (!cancelled) {
          setLessonOptions(options);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLessonOptions([]);
          setLessonsError(t("errors.loadLessonsFailed"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLessonsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [gradeId, onLoadLessons, subjectId, t]);

  useEffect(() => {
    if (
      gradeId ||
      !subjectId ||
      !linkedLessonRef ||
      gradeOptions.length === 0 ||
      hasResolvedLinkedLessonScope
    ) {
      return;
    }

    let cancelled = false;

    const subjectGradeIds =
      subjectOptions.find((option) => option.value === subjectId)?.gradeIds || [];
    const candidateGrades = gradeOptions.filter((option) => {
      if (stageId && option.stageId && option.stageId !== stageId) {
        return false;
      }

      return subjectGradeIds.length === 0 || subjectGradeIds.includes(option.value);
    });

    void Promise.resolve()
      .then(async () => {
        if (!cancelled) {
          setIsResolvingLinkedLessonScope(true);
        }

        for (const gradeOption of candidateGrades) {
          const options = await onLoadLessons(gradeOption.value, subjectId);
          if (cancelled) return;

          if (options.some((option) => option.value === linkedLessonRef)) {
            setGradeId(gradeOption.value);
            setLessonOptions(options);
            setHasResolvedLinkedLessonScope(true);
            return;
          }
        }

        setHasResolvedLinkedLessonScope(true);
      })
      .catch(() => {
        if (!cancelled) {
          setLessonsError(t("errors.loadLessonsFailed"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsResolvingLinkedLessonScope(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    gradeId,
    gradeOptions,
    hasResolvedLinkedLessonScope,
    linkedLessonRef,
    onLoadLessons,
    stageId,
    subjectId,
    subjectOptions,
    t,
  ]);

  const updateObjective = (
    index: number,
    patch: Partial<HeroMissionObjectiveCandidate>,
  ) => {
    setObjectives((current) =>
      current.map((objective, currentIndex) =>
        currentIndex === index ? { ...objective, ...patch } : objective,
      ),
    );
    markDirty("objectives");
  };

  const removeObjective = (index: number) => {
    setObjectives((current) => {
      if (!mission && current.length === 1) {
        return current;
      }

      return current.filter(
        (_objective, currentIndex) => currentIndex !== index,
      );
    });
    markDirty("objectives");
  };

  const validateNumericMissionFields = (): boolean => {
    const numericFields = [
      requiredLevel,
      rewardXp,
      sortOrder,
      positionX,
      positionY,
    ];
    if (
      numericFields.some(
        (value) => value.trim().length > 0 && !Number.isInteger(Number(value)),
      )
    ) {
      setError(t("errors.integerField"));
      return false;
    }

    if (requiredLevel.trim() && Number(requiredLevel) < 1) {
      setError(t("errors.requiredLevelInvalid"));
      return false;
    }

    if (rewardXp.trim() && Number(rewardXp) < 0) {
      setError(t("errors.rewardXpInvalid"));
      return false;
    }

    return true;
  };

  const validateObjectiveOrders = (): boolean => {
    if (
      objectives.some(
        (objective) =>
          objective.sortOrder !== undefined &&
          objective.sortOrder !== null &&
          (!Number.isInteger(Number(objective.sortOrder)) ||
            Number(objective.sortOrder) < 1),
      )
    ) {
      setError(t("errors.objectiveOrderInvalid"));
      return false;
    }

    return true;
  };

  const validateStep = (step: number): boolean => {
    if (step === 0) {
      if (!stageId.trim()) {
        setError(t("errors.stageRequired"));
        return false;
      }

      if (!titleEn.trim() && !titleAr.trim()) {
        setError(t("errors.titleRequired"));
        return false;
      }
    }

    if (step === 1 && !validateNumericMissionFields()) return false;

    if (step === 2 && !validateObjectiveOrders()) return false;

    setError(null);
    return true;
  };

  const handleNext = () => {
    if (!validateStep(activeStep)) return;
    setActiveStep((current) => Math.min(current + 1, 3));
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((current) => Math.max(current - 1, 0));
  };

  const handleClose = () => {
    if (dirtyFields.size > 0) {
      setShowUnsavedDialog(true);
      return;
    }

    onClose();
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    setDirtyFields(new Set());
    onClose();
  };

  const handleSubmit = () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      return;
    }

    if (!stageId.trim()) {
      setError(t("errors.stageRequired"));
      return;
    }

    if (!titleEn.trim() && !titleAr.trim()) {
      setError(t("errors.titleRequired"));
      return;
    }

    if (!mission && objectives.length === 0) {
      setError(t("errors.objectiveRequired"));
      return;
    }

    onSubmit({
      stageId: stageId.trim(),
      subjectId: subjectId || null,
      linkedAssessmentId: linkedAssessmentId || null,
      linkedLessonRef: linkedLessonRef || null,
      titleEn: titleEn || null,
      titleAr: titleAr || null,
      briefEn: briefEn || null,
      briefAr: briefAr || null,
      requiredLevel: requiredLevel || undefined,
      rewardXp: rewardXp || undefined,
      badgeRewardId: badgeRewardId || null,
      sortOrder: sortOrder || undefined,
      positionX: positionX || null,
      positionY: positionY || null,
      metadata: {
        ...(mission?.metadata || {}),
        academicScope: {
          ...missionMetadata?.academicScope,
          gradeId: gradeId.trim() || undefined,
        },
      },
      objectives,
    }, dirtyFields);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={mission ? t("editTitle") : t("createTitle")}
        size="xl"
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {onRefreshOptions ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onRefreshOptions}
                  disabled={loading || optionsLoading}
                  loading={optionsLoading}
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                >
                  {tCommon("refresh")}
                </Button>
              ) : null}
              <Button variant="secondary" onClick={handleClose} disabled={loading}>
                {tCommon("cancel")}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {activeStep > 0 ? (
                <Button variant="secondary" onClick={handleBack} disabled={loading}>
                  {t("back")}
                </Button>
              ) : null}
              {activeStep < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={loading || optionsLoading}
                >
                  {t("next")}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={loading || optionsLoading}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  {tCommon("save", { defaultMessage: "Save" })}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          <WizardStepper
            steps={[
              { title: t("steps.basics.title"), subtitle: t("steps.basics.subtitle") },
              { title: t("steps.links.title"), subtitle: t("steps.links.subtitle") },
              { title: t("steps.objectives.title"), subtitle: t("steps.objectives.subtitle") },
              { title: t("steps.review.title"), subtitle: t("steps.review.subtitle") },
            ]}
            activeStep={activeStep}
            locale={locale}
          />

          {activeStep === 0 ? (
          <>
        <FormSection
          title={t("sections.basics.title")}
          description={t("sections.basics.description")}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              label={t("labels.academicYear")}
              value={academicYearLabel}
              disabled
            />
            <Input label={t("labels.term")} value={termLabel} disabled />
            <Select
              label={t("labels.stage")}
              value={stageId}
              options={stageOptions}
              onChange={handleStageChange}
              placeholder={
                optionsLoading
                  ? t("placeholders.loadingStages")
                  : t("placeholders.selectStage")
              }
              searchable
              required
              disabled={optionsLoading || isEditing}
            />
            <Select
              label={t("labels.grade")}
              value={gradeId}
              options={[
                { value: "", label: t("placeholders.noGrade") },
                ...visibleGradeOptions,
              ]}
              onChange={handleGradeChange}
              placeholder={
                optionsLoading
                  ? t("placeholders.loadingGrades")
                  : t("placeholders.selectGrade")
              }
              searchable
              disabled={optionsLoading || !stageId || isEditing}
              noOptionsText={
                stageId
                  ? t("placeholders.noGradeItems")
                  : t("placeholders.selectStageFirst")
              }
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label={t("labels.titleEn")}
              value={titleEn}
              maxLength={255}
              onChange={(event) => {
                setTitleEn(event.target.value);
                markDirty("titleEn");
              }}
            />
            <Input
              label={t("labels.titleAr")}
              value={titleAr}
              maxLength={255}
              onChange={(event) => {
                setTitleAr(event.target.value);
                markDirty("titleAr");
              }}
              dir="rtl"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextArea
              label={t("labels.briefEn")}
              value={briefEn}
              maxLength={2000}
              onChange={(event) => {
                setBriefEn(event.target.value);
                markDirty("briefEn");
              }}
            />
            <TextArea
              label={t("labels.briefAr")}
              value={briefAr}
              maxLength={2000}
              onChange={(event) => {
                setBriefAr(event.target.value);
                markDirty("briefAr");
              }}
              dir="rtl"
            />
          </div>
        </FormSection>

          </>
          ) : null}

          {activeStep === 1 ? (
          <>
        <FormSection
          title={t("sections.links.title")}
          description={t("sections.links.description")}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select
              label={t("labels.subject")}
              value={subjectId}
              options={[
                { value: "", label: t("placeholders.noSubject") },
                ...relatedSubjectOptions,
              ]}
              onChange={handleSubjectChange}
              placeholder={
                optionsLoading
                  ? t("placeholders.loadingSubjects")
                  : t("placeholders.selectSubject")
              }
              searchable
              disabled={optionsLoading || protectedEditFieldsDisabled}
            />
            <Select
              label={t("labels.linkedLesson")}
              value={linkedLessonRef}
              options={[
                { value: "", label: t("placeholders.noLesson") },
                ...visibleLessonOptions,
              ]}
              onChange={(value) => {
                setLinkedLessonRef(value);
                markDirty("linkedLessonRef");
              }}
              placeholder={
                optionsLoading || lessonsLoading || isResolvingLinkedLessonScope
                  ? t("placeholders.loadingLessons")
                  : t("placeholders.selectLesson")
              }
              searchable
              disabled={
                optionsLoading ||
                lessonsLoading ||
                isResolvingLinkedLessonScope ||
                !gradeId ||
                !subjectId ||
                protectedEditFieldsDisabled
              }
              noOptionsText={
                !gradeId
                  ? t("placeholders.selectGradeFirst")
                  : subjectId
                    ? t("placeholders.noLessonItems")
                    : t("placeholders.selectSubjectFirst")
              }
            />
            <Select
              label={t("labels.linkedAssessment")}
              value={linkedAssessmentId}
              options={[
                { value: "", label: t("placeholders.noAssessment") },
                ...visibleAssessmentOptions,
              ]}
              onChange={(value) => {
                setLinkedAssessmentId(value);
                markDirty("linkedAssessmentId");
              }}
              placeholder={
                optionsLoading
                  ? t("placeholders.loadingAssessments")
                  : t("placeholders.selectAssessment")
              }
              searchable
              disabled={
                optionsLoading || !subjectId || protectedEditFieldsDisabled
              }
              noOptionsText={
                subjectId
                  ? t("placeholders.noAssessmentItems")
                  : t("placeholders.selectSubjectFirst")
              }
            />
          </div>
          {lessonsError ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {lessonsError}
            </div>
          ) : null}
        </FormSection>

        <FormSection
          title={t("sections.rewards.title")}
          description={t("sections.rewards.description")}
        >
          <div className="flex flex-wrap gap-4">
            <Input
              label={t("labels.requiredLevel")}
              type="number"
              value={requiredLevel}
              onChange={(event) => {
                setRequiredLevel(event.target.value);
                markDirty("requiredLevel");
              }}
              disabled={protectedEditFieldsDisabled}
            />
            <Input
              label={t("labels.rewardXp")}
              type="number"
              value={rewardXp}
              onChange={(event) => {
                setRewardXp(event.target.value);
                markDirty("rewardXp");
              }}
              disabled={protectedEditFieldsDisabled}
            />
            <Input
              label={t("labels.sortOrder")}
              type="number"
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value);
                markDirty("sortOrder");
              }}
            />
            <Input
              label={t("labels.mapX")}
              type="number"
              value={positionX}
              onChange={(event) => {
                setPositionX(event.target.value);
                markDirty("positionX");
              }}
            />
            <Input
              label={t("labels.mapY")}
              type="number"
              value={positionY}
              onChange={(event) => {
                setPositionY(event.target.value);
                markDirty("positionY");
              }}
            />
            <Select
              label={t("labels.badgeReward")}
              value={badgeRewardId}
              placeholder={t("placeholders.noBadge")}
              options={[
                { value: "", label: t("placeholders.noBadge") },
                ...visibleBadgeOptions,
              ]}
              onChange={(value) => {
                setBadgeRewardId(value);
                markDirty("badgeRewardId");
              }}
              searchable
              disabled={protectedEditFieldsDisabled}
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-gray-500">
            {t("helper.mapCoordinates")}
          </p>
        </FormSection>

        {optionsError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {optionsError}
          </div>
        ) : null}

          </>
          ) : null}

          {activeStep === 2 ? (
          <>
        <FormSection
          title={t("sections.objectives.title")}
          description={t("sections.objectives.description")}
        >
          <div className="mb-3 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setObjectives((current) => [
                  ...current,
                  blankObjective(),
                ]);
                markDirty("objectives");
              }}
              disabled={protectedEditFieldsDisabled}
            >
              {t("actions.addObjective")}
            </Button>
          </div>

          <div className="space-y-3">
            {objectives.map((objective, index) => (
              <div
                key={index}
                data-testid="mission-objective-card"
                className="grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-3 md:grid-cols-2 xl:grid-cols-3"
              >
                <Select
                  label={t("labels.objectiveType")}
                  value={objective.type || "manual"}
                  options={objectiveTypeOptions}
                  onChange={(value) => updateObjective(index, { type: value })}
                  disabled={protectedEditFieldsDisabled}
                />
                <Input
                  label={t("labels.objectiveTitleEn")}
                  value={objective.titleEn || ""}
                  maxLength={255}
                  onChange={(event) =>
                    updateObjective(index, { titleEn: event.target.value })
                  }
                  disabled={protectedEditFieldsDisabled}
                />
                <Input
                  label={t("labels.objectiveTitleAr")}
                  value={objective.titleAr || ""}
                  maxLength={255}
                  onChange={(event) =>
                    updateObjective(index, { titleAr: event.target.value })
                  }
                  dir="rtl"
                  disabled={protectedEditFieldsDisabled}
                />
                <TextArea
                  label={t("labels.objectiveSubtitleEn")}
                  value={objective.subtitleEn || ""}
                  maxLength={500}
                  onChange={(event) =>
                    updateObjective(index, {
                      subtitleEn: event.target.value,
                    })
                  }
                  disabled={protectedEditFieldsDisabled}
                />
                <TextArea
                  label={t("labels.objectiveSubtitleAr")}
                  value={objective.subtitleAr || ""}
                  maxLength={500}
                  onChange={(event) =>
                    updateObjective(index, {
                      subtitleAr: event.target.value,
                    })
                  }
                  dir="rtl"
                  disabled={protectedEditFieldsDisabled}
                />
                <Select
                  label={t("labels.objectiveLessonRef")}
                  value={objective.linkedLessonRef || "__none__"}
                  options={objectiveLessonOptions(objective.linkedLessonRef)}
                  onChange={(value) =>
                    updateObjective(index, {
                      linkedLessonRef: value === "__none__" ? null : value,
                    })
                  }
                  searchable
                  disabled={protectedEditFieldsDisabled}
                />
                <Select
                  label={t("labels.objectiveAssessment")}
                  value={objective.linkedAssessmentId || "__none__"}
                  options={objectiveAssessmentOptions(
                    objective.linkedAssessmentId,
                  )}
                  onChange={(value) =>
                    updateObjective(index, {
                      linkedAssessmentId: value === "__none__" ? null : value,
                    })
                  }
                  searchable
                  disabled={protectedEditFieldsDisabled}
                />
                <Input
                  label={t("labels.objectiveOrder")}
                  type="number"
                  min={1}
                  step={1}
                  value={
                    objective.sortOrder === undefined ||
                    objective.sortOrder === null
                      ? ""
                      : String(objective.sortOrder)
                  }
                  onChange={(event) =>
                    updateObjective(index, {
                      sortOrder:
                        event.target.value === ""
                          ? undefined
                          : event.target.value,
                    })
                  }
                  disabled={protectedEditFieldsDisabled}
                />
                <label
                  htmlFor={`objective-${index}-required`}
                  className="flex min-h-10 items-center gap-2 self-end rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
                >
                  <input
                    id={`objective-${index}-required`}
                    type="checkbox"
                    checked={objective.isRequired !== false}
                    onChange={(event) =>
                      updateObjective(index, {
                        isRequired: event.target.checked,
                      })
                    }
                    disabled={protectedEditFieldsDisabled}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary focus:ring-primary disabled:cursor-not-allowed"
                  />
                  <span>{t("labels.objectiveRequired")}</span>
                </label>
                <button
                  type="button"
                  onClick={() => removeObjective(index)}
                  disabled={
                    protectedEditFieldsDisabled ||
                    (!mission && objectives.length === 1)
                  }
                  className="mt-6 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                  title={t("actions.removeObjective")}
                  aria-label={t("actions.removeObjective")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </FormSection>

          </>
          ) : null}

          {activeStep === 3 ? (
          <>
            <FormSection
              title={t("sections.review.title")}
              description={t("sections.review.description")}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <ReviewItem label={t("labels.academicYear")} value={academicYearLabel} />
                <ReviewItem label={t("labels.term")} value={termLabel} />
                <ReviewItem
                  label={t("labels.stage")}
                  value={selectedStage?.label || stageId}
                />
                <ReviewItem
                  label={t("labels.grade")}
                  value={
                    visibleGradeOptions.find((option) => option.value === gradeId)
                      ?.label || gradeId
                  }
                />
                <ReviewItem label={t("labels.titleEn")} value={titleEn} />
                <ReviewItem label={t("labels.titleAr")} value={titleAr} />
                <ReviewItem label={t("labels.briefEn")} value={briefEn} />
                <ReviewItem label={t("labels.briefAr")} value={briefAr} />
                <ReviewItem
                  label={t("labels.subject")}
                  value={
                    relatedSubjectOptions.find((option) => option.value === subjectId)
                      ?.label || subjectId
                  }
                />
                <ReviewItem
                  label={t("labels.linkedLesson")}
                  value={
                    visibleLessonOptions.find(
                      (option) => option.value === linkedLessonRef,
                    )?.label || linkedLessonRef
                  }
                />
                <ReviewItem
                  label={t("labels.linkedAssessment")}
                  value={
                    visibleAssessmentOptions.find(
                      (option) => option.value === linkedAssessmentId,
                    )?.label || linkedAssessmentId
                  }
                />
                <ReviewItem label={t("labels.requiredLevel")} value={requiredLevel} />
                <ReviewItem label={t("labels.rewardXp")} value={rewardXp} />
                <ReviewItem
                  label={t("labels.badgeReward")}
                  value={
                    visibleBadgeOptions.find((option) => option.value === badgeRewardId)
                      ?.label || badgeRewardId
                  }
                />
                <ReviewItem label={t("labels.mapX")} value={positionX} />
                <ReviewItem label={t("labels.mapY")} value={positionY} />
                <ReviewItem label={t("labels.sortOrder")} value={sortOrder} />
              </div>
            </FormSection>

            <FormSection
              title={t("sections.objectives.title")}
              description={t("sections.objectives.description")}
            >
              <div className="space-y-3">
                {objectives.map((objective, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {t("labels.objectiveTitle", { index: index + 1 })}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {t(`objectiveTypes.${objective.type || "manual"}`)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <ReviewItem
                        label={t("labels.objectiveTitleEn")}
                        value={objective.titleEn || ""}
                      />
                      <ReviewItem
                        label={t("labels.objectiveTitleAr")}
                        value={objective.titleAr || ""}
                      />
                      <ReviewItem
                        label={t("labels.objectiveSubtitleEn")}
                        value={objective.subtitleEn || ""}
                      />
                      <ReviewItem
                        label={t("labels.objectiveSubtitleAr")}
                        value={objective.subtitleAr || ""}
                      />
                      <ReviewItem
                        label={t("labels.objectiveLessonRef")}
                        value={objective.linkedLessonRef || ""}
                      />
                      <ReviewItem
                        label={t("labels.objectiveAssessment")}
                        value={
                          relatedAssessmentOptions.find(
                            (option) =>
                              option.value === objective.linkedAssessmentId,
                          )?.label || objective.linkedAssessmentId || ""
                        }
                      />
                      <ReviewItem
                        label={t("labels.objectiveOrder")}
                        value={
                          objective.sortOrder === undefined ||
                          objective.sortOrder === null
                            ? ""
                            : String(objective.sortOrder)
                        }
                      />
                      <ReviewItem
                        label={t("labels.objectiveRequired")}
                        value={
                          objective.isRequired === false
                            ? t("review.no")
                            : t("review.yes")
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </FormSection>
          </>
          ) : null}

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showUnsavedDialog}
        onClose={() => setShowUnsavedDialog(false)}
        onConfirm={handleDiscardChanges}
        title={t("unsavedChangesTitle")}
        description={t("unsavedChangesDesc")}
        confirmLabel={t("discard")}
        cancelLabel={t("stay")}
        severity="warning"
      />
    </>
  );
}
