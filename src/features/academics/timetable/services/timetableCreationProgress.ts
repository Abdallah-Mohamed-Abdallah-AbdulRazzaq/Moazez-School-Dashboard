import type { PublicationResponse } from "@/features/academics/timetable/services/timetableApiTypes";
import type { TimetableValidationSummary } from "@/features/academics/timetable/services/timetableValidationSummary";
import type { ResolvedTimetableConfig } from "@/features/academics/timetable/types/timetableConfig";
import type {
  TimetableConflict,
  TimetableEntry,
} from "@/features/academics/timetable/types/timetable";

export type TimetableCreationAction =
  | "scope"
  | "configuration"
  | "periods"
  | "schedule"
  | "validation"
  | "publish";

export type TimetableCreationStepStatus =
  | "complete"
  | "current"
  | "blocked"
  | "published";

export interface TimetableCreationStep {
  id: TimetableCreationAction;
  status: TimetableCreationStepStatus;
  actionable: boolean;
  prerequisiteKey?: TimetableCreationPrerequisite;
  prerequisiteMessage?: string;
}

export interface TimetableCreationProgress {
  state: "checking" | "ready";
  steps: TimetableCreationStep[];
}

export type TimetableCreationPrerequisite =
  | "configureTimetable"
  | "addInstructionalPeriod"
  | "saveSchedule"
  | "resolveReviewIssues"
  | "publicationNotReady";

export interface TimetableCreationProgressInput {
  isLoading: boolean;
  resolvedConfig: ResolvedTimetableConfig | null;
  entries: TimetableEntry[];
  isDirty: boolean;
  validationSummary: TimetableValidationSummary | null;
  conflicts: TimetableConflict[];
  publication: PublicationResponse | null;
  isReadOnly: boolean;
}

export function resolveTimetableCreationProgress({
  isLoading,
  resolvedConfig,
  entries,
  isDirty,
  validationSummary,
  conflicts,
  publication,
  isReadOnly,
}: TimetableCreationProgressInput): TimetableCreationProgress {
  if (isLoading) {
    return { state: "checking", steps: [] };
  }

  const hasConfiguration = hasActiveDays(resolvedConfig);
  const hasPeriods = hasInstructionalPeriod(resolvedConfig);
  const hasSchedule = hasSavedEntries(entries);
  const canBuildSchedule = hasConfiguration && hasPeriods;
  const canReview = canBuildSchedule && hasSchedule && !isDirty;
  const reviewComplete = canReview && !hasBlockingReviewIssue(validationSummary, conflicts);
  const published = isPublished(publication);
  const schedulePrerequisite = hasConfiguration
    ? "addInstructionalPeriod"
    : "configureTimetable";
  const reviewPrerequisite = reviewPrerequisiteKey({
    hasConfiguration,
    hasPeriods,
    canReview,
  });

  return {
    state: "ready",
    steps: [
      creationStep("scope", "complete", isReadOnly),
      creationStep(
        "configuration",
        hasConfiguration ? "complete" : "current",
        isReadOnly,
      ),
      creationStep(
        "periods",
        stepStatus(hasConfiguration, hasPeriods),
        isReadOnly,
        "configureTimetable",
      ),
      creationStep(
        "schedule",
        stepStatus(canBuildSchedule, hasSchedule && !isDirty),
        isReadOnly,
        schedulePrerequisite,
      ),
      creationStep(
        "validation",
        stepStatus(canReview, reviewComplete),
        isReadOnly,
        reviewPrerequisite,
      ),
      publicationStep({
        reviewComplete,
        published,
        publication,
        isReadOnly,
        reviewPrerequisite,
      }),
    ],
  };
}

function creationStep(
  id: TimetableCreationAction,
  status: TimetableCreationStepStatus,
  isReadOnly: boolean,
  prerequisiteKey?: TimetableCreationPrerequisite,
): TimetableCreationStep {
  return {
    id,
    status,
    actionable: canActOnStep(id, status, isReadOnly),
    prerequisiteKey: status === "blocked" ? prerequisiteKey : undefined,
  };
}

function publicationStep({
  reviewComplete,
  published,
  publication,
  isReadOnly,
  reviewPrerequisite,
}: {
  reviewComplete: boolean;
  published: boolean;
  publication: PublicationResponse | null;
  isReadOnly: boolean;
  reviewPrerequisite: TimetableCreationPrerequisite;
}): TimetableCreationStep {
  if (published) {
    return creationStep("publish", "published", isReadOnly);
  }

  if (!reviewComplete) {
    return creationStep("publish", "blocked", isReadOnly, reviewPrerequisite);
  }

  if (publication?.canPublish !== true) {
    return {
      ...creationStep(
        "publish",
        "blocked",
        isReadOnly,
        "publicationNotReady",
      ),
      prerequisiteMessage: publication?.blockingReasons[0]?.message,
    };
  }

  return creationStep("publish", "current", isReadOnly);
}

function reviewPrerequisiteKey({
  hasConfiguration,
  hasPeriods,
  canReview,
}: {
  hasConfiguration: boolean;
  hasPeriods: boolean;
  canReview: boolean;
}): TimetableCreationPrerequisite {
  if (!hasConfiguration) return "configureTimetable";
  if (!hasPeriods) return "addInstructionalPeriod";
  return canReview ? "resolveReviewIssues" : "saveSchedule";
}

function canActOnStep(
  id: TimetableCreationAction,
  status: TimetableCreationStepStatus,
  isReadOnly: boolean,
): boolean {
  if (id === "scope") {
    return true;
  }

  return !isReadOnly && status !== "blocked" && status !== "published";
}

function stepStatus(
  prerequisiteComplete: boolean,
  stepComplete: boolean,
): TimetableCreationStepStatus {
  if (!prerequisiteComplete) {
    return "blocked";
  }

  return stepComplete ? "complete" : "current";
}

function hasActiveDays(config: ResolvedTimetableConfig | null): boolean {
  return Boolean(config?.days.some((day) => day.isActive));
}

function hasInstructionalPeriod(config: ResolvedTimetableConfig | null): boolean {
  return Boolean(
    config?.periods.some((period) => period.isInstructional !== false),
  );
}

function hasSavedEntries(entries: TimetableEntry[]): boolean {
  return entries.some(
    (entry) => Boolean(entry.subjectId) && !entry.id.startsWith("temp-"),
  );
}

function hasBlockingReviewIssue(
  validationSummary: TimetableValidationSummary | null,
  conflicts: TimetableConflict[],
): boolean {
  return (
    !validationSummary?.canPublish ||
    validationSummary.blockingReasons.length > 0 ||
    conflicts.length > 0
  );
}

function isPublished(publication: PublicationResponse | null): boolean {
  return (
    publication?.isPublished === true ||
    publication?.status.toLowerCase() === "published"
  );
}
