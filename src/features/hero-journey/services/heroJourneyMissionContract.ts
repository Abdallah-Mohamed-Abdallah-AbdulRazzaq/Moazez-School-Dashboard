import type { HeroJourneyMission, HeroJourneyMissionStatus } from "../types";

export const HERO_MISSION_OBJECTIVE_TYPES = [
  "manual",
  "lesson",
  "quiz",
  "assessment",
  "task",
  "custom",
] as const;

export type HeroMissionObjectiveType =
  (typeof HERO_MISSION_OBJECTIVE_TYPES)[number];

export type NumericFormValue = number | string;

export interface HeroMissionObjectiveCandidate {
  type?: string | null;
  titleEn?: string | null;
  titleAr?: string | null;
  subtitleEn?: string | null;
  subtitleAr?: string | null;
  linkedAssessmentId?: string | null;
  linkedLessonRef?: string | null;
  sortOrder?: NumericFormValue | null;
  isRequired?: unknown;
  metadata?: unknown;
}

export interface HeroMissionFormCandidate {
  academicYearId?: string | null;
  yearId?: string | null;
  termId?: string | null;
  stageId?: string | null;
  subjectId?: string | null;
  linkedAssessmentId?: string | null;
  linkedLessonRef?: string | null;
  titleEn?: string | null;
  titleAr?: string | null;
  briefEn?: string | null;
  briefAr?: string | null;
  requiredLevel?: NumericFormValue | null;
  rewardXp?: NumericFormValue | null;
  badgeRewardId?: string | null;
  positionX?: NumericFormValue | null;
  positionY?: NumericFormValue | null;
  sortOrder?: NumericFormValue | null;
  metadata?: unknown;
  objectives?: HeroMissionObjectiveCandidate[] | null;
}

export type CreateHeroMissionCandidate = HeroMissionFormCandidate;
export type UpdateHeroMissionCandidate = HeroMissionFormCandidate;
export type HeroMissionEditableField = keyof UpdateHeroMissionCandidate;

export interface HeroMissionObjectiveRequest {
  type?: HeroMissionObjectiveType | null;
  titleEn?: string | null;
  titleAr?: string | null;
  subtitleEn?: string | null;
  subtitleAr?: string | null;
  linkedAssessmentId?: string | null;
  linkedLessonRef?: string | null;
  sortOrder?: number | null;
  isRequired?: boolean | null;
  metadata?: Record<string, unknown> | null;
}

export interface CreateHeroMissionRequest {
  academicYearId?: string;
  yearId?: string;
  termId: string;
  stageId: string;
  subjectId?: string | null;
  linkedAssessmentId?: string | null;
  linkedLessonRef?: string | null;
  titleEn?: string | null;
  titleAr?: string | null;
  briefEn?: string | null;
  briefAr?: string | null;
  requiredLevel?: number;
  rewardXp?: number;
  badgeRewardId?: string | null;
  positionX?: number | null;
  positionY?: number | null;
  sortOrder?: number;
  metadata?: Record<string, unknown> | null;
  objectives: HeroMissionObjectiveRequest[];
}

export type UpdateHeroMissionRequest = Partial<
  Omit<CreateHeroMissionRequest, "objectives">
> & { objectives?: HeroMissionObjectiveRequest[] };

export interface HeroMissionUpdateContext {
  status: HeroJourneyMissionStatus;
  original: HeroJourneyMission;
  dirtyFields: ReadonlySet<HeroMissionEditableField>;
}

export type HeroMissionContractErrorCode =
  | "academicYearRequired"
  | "academicYearConflict"
  | "invalidUuid"
  | "termRequired"
  | "stageRequired"
  | "missionTitleRequired"
  | "maxLengthExceeded"
  | "integerRequired"
  | "minimumValue"
  | "objectivesRequired"
  | "invalidObjectiveType"
  | "invalidObjectiveOrder"
  | "duplicateObjectiveOrder"
  | "invalidBoolean"
  | "metadataInvalid"
  | "missionArchived";

export class HeroMissionContractError extends Error {
  constructor(
    public readonly code: HeroMissionContractErrorCode,
    public readonly field?: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "HeroMissionContractError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DASHBOARD_PROTECTED_UPDATE_FIELDS = new Set<HeroMissionEditableField>([
  "academicYearId",
  "yearId",
  "termId",
  "stageId",
]);

const PUBLISHED_PROTECTED_UPDATE_FIELDS = new Set<HeroMissionEditableField>([
  "subjectId",
  "linkedAssessmentId",
  "linkedLessonRef",
  "requiredLevel",
  "rewardXp",
  "badgeRewardId",
  "objectives",
]);

const UUID_FIELDS = new Set<HeroMissionEditableField>([
  "academicYearId",
  "yearId",
  "termId",
  "stageId",
  "subjectId",
  "linkedAssessmentId",
  "badgeRewardId",
]);

const TEXT_LIMITS: Partial<Record<HeroMissionEditableField, number>> = {
  titleEn: 255,
  titleAr: 255,
  briefEn: 2000,
  briefAr: 2000,
  linkedLessonRef: 255,
};

const INTEGER_RULES: Partial<
  Record<HeroMissionEditableField, { minimum?: number; nullable?: boolean }>
> = {
  requiredLevel: { minimum: 1 },
  rewardXp: { minimum: 0 },
  positionX: { nullable: true },
  positionY: { nullable: true },
  sortOrder: {},
};

function own(object: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function assignPresent(
  target: Record<string, unknown>,
  key: string,
  normalizedValue: unknown,
): void {
  if (normalizedValue !== undefined) target[key] = normalizedValue;
}

function normalizeText(
  candidate: string | null | undefined,
  maximum: number,
  field: string,
): string | null | undefined {
  if (candidate === undefined || candidate === null) return candidate;
  const normalized = candidate.trim();
  if (normalized.length > maximum) {
    throw new HeroMissionContractError("maxLengthExceeded", field, {
      max: maximum,
    });
  }
  return normalized || null;
}

function normalizeUuid(
  candidate: string | null | undefined,
  field: string,
): string | null | undefined {
  if (candidate === undefined || candidate === null) return candidate;
  const normalized = candidate.trim();
  if (!normalized) return null;
  if (!UUID_PATTERN.test(normalized)) {
    throw new HeroMissionContractError("invalidUuid", field);
  }
  return normalized;
}

function normalizeInteger(
  candidate: NumericFormValue | null | undefined,
  field: string,
  rules: { minimum?: number; nullable?: boolean } = {},
): number | null | undefined {
  if (candidate === undefined || candidate === null || candidate === "") {
    return rules.nullable && candidate !== undefined ? null : undefined;
  }
  const normalized =
    typeof candidate === "number" ? candidate : Number(candidate.trim());
  if (!Number.isFinite(normalized) || !Number.isInteger(normalized)) {
    throw new HeroMissionContractError("integerRequired", field);
  }
  if (rules.minimum !== undefined && normalized < rules.minimum) {
    throw new HeroMissionContractError("minimumValue", field, {
      minimum: rules.minimum,
    });
  }
  return normalized;
}

function normalizeMetadata(
  candidate: unknown,
  field: string,
): Record<string, unknown> | null | undefined {
  if (candidate === undefined || candidate === null) return candidate;
  if (typeof candidate !== "object" || Array.isArray(candidate)) {
    throw new HeroMissionContractError("metadataInvalid", field);
  }
  return candidate as Record<string, unknown>;
}

function normalizeObjectiveType(
  candidate: string | null | undefined,
  field: string,
): HeroMissionObjectiveType {
  if (candidate == null) return "manual";
  if (!HERO_MISSION_OBJECTIVE_TYPES.includes(candidate as HeroMissionObjectiveType)) {
    throw new HeroMissionContractError("invalidObjectiveType", field);
  }
  return candidate as HeroMissionObjectiveType;
}

function normalizeRequiredFlag(candidate: unknown, field: string): boolean {
  if (candidate == null) return true;
  if (typeof candidate !== "boolean") {
    throw new HeroMissionContractError("invalidBoolean", field);
  }
  return candidate;
}

function assignObjectiveText(
  objective: Record<string, unknown>,
  candidate: HeroMissionObjectiveCandidate,
  path: string,
): void {
  assignPresent(objective, "titleEn", normalizeText(candidate.titleEn, 255, `${path}.titleEn`));
  assignPresent(objective, "titleAr", normalizeText(candidate.titleAr, 255, `${path}.titleAr`));
  assignPresent(objective, "subtitleEn", normalizeText(candidate.subtitleEn, 500, `${path}.subtitleEn`));
  assignPresent(objective, "subtitleAr", normalizeText(candidate.subtitleAr, 500, `${path}.subtitleAr`));
  assignPresent(objective, "linkedLessonRef", normalizeText(candidate.linkedLessonRef, 255, `${path}.linkedLessonRef`));
}

function assignObjectiveReferences(
  objective: Record<string, unknown>,
  candidate: HeroMissionObjectiveCandidate,
  path: string,
): void {
  assignPresent(objective, "linkedAssessmentId", normalizeUuid(candidate.linkedAssessmentId, `${path}.linkedAssessmentId`));
  assignPresent(objective, "metadata", normalizeMetadata(candidate.metadata, `${path}.metadata`));
}

function normalizeObjective(
  candidate: HeroMissionObjectiveCandidate,
  index: number,
): HeroMissionObjectiveRequest {
  const path = `objectives.${index}`;
  const objective: Record<string, unknown> = {
    type: normalizeObjectiveType(candidate.type, `${path}.type`),
    isRequired: normalizeRequiredFlag(
      candidate.isRequired,
      `${path}.isRequired`,
    ),
  };
  assignObjectiveText(objective, candidate, path);
  assignObjectiveReferences(objective, candidate, path);
  const sortOrder = normalizeInteger(candidate.sortOrder, `${path}.sortOrder`);
  if (sortOrder != null && sortOrder < 1) {
    throw new HeroMissionContractError(
      "invalidObjectiveOrder",
      `${path}.sortOrder`,
    );
  }
  assignPresent(objective, "sortOrder", sortOrder);
  return objective as HeroMissionObjectiveRequest;
}

function rejectDuplicateObjectiveOrders(
  objectives: HeroMissionObjectiveRequest[],
): void {
  const suppliedOrders = new Set<number>();
  objectives.forEach((objective, index) => {
    if (objective.sortOrder == null) return;
    if (suppliedOrders.has(objective.sortOrder)) {
      throw new HeroMissionContractError(
        "duplicateObjectiveOrder",
        `objectives.${index}.sortOrder`,
      );
    }
    suppliedOrders.add(objective.sortOrder);
  });
}

function normalizeObjectives(
  candidates: HeroMissionObjectiveCandidate[] | null | undefined,
  requireNonEmpty: boolean,
): HeroMissionObjectiveRequest[] {
  if (!Array.isArray(candidates) || (requireNonEmpty && candidates.length === 0)) {
    throw new HeroMissionContractError("objectivesRequired", "objectives");
  }
  const objectives = candidates.map(normalizeObjective);
  rejectDuplicateObjectiveOrders(objectives);
  return objectives
    .map((objective, index) => ({ objective, index }))
    .sort(
      (left, right) =>
        (left.objective.sortOrder ?? Number.MAX_SAFE_INTEGER) -
          (right.objective.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
        left.index - right.index,
    )
    .map(({ objective }, index) => ({ ...objective, sortOrder: index + 1 }));
}

function requiredUuid(
  candidate: string | null | undefined,
  field: string,
  code: "academicYearRequired" | "termRequired" | "stageRequired",
): string {
  const normalized = normalizeUuid(candidate, field);
  if (!normalized) throw new HeroMissionContractError(code, field);
  return normalized;
}

function assertEffectiveTitles(
  titleEn: string | null | undefined,
  titleAr: string | null | undefined,
): void {
  if (!titleEn && !titleAr) {
    throw new HeroMissionContractError("missionTitleRequired", "titleEn");
  }
}

function canonicalAcademicYear(
  candidate: CreateHeroMissionCandidate,
): string {
  const academicYearId = candidate.academicYearId?.trim() || undefined;
  const yearId = candidate.yearId?.trim() || undefined;
  if (academicYearId && yearId && academicYearId !== yearId) {
    throw new HeroMissionContractError(
      "academicYearConflict",
      "academicYearId",
    );
  }
  return requiredUuid(
    academicYearId ?? yearId,
    academicYearId ? "academicYearId" : yearId ? "yearId" : "academicYearId",
    "academicYearRequired",
  );
}

function createMissionScalars(
  candidate: CreateHeroMissionCandidate,
): Record<string, unknown> {
  const request: Record<string, unknown> = {};
  for (const [field, maximum] of Object.entries(TEXT_LIMITS)) {
    assignPresent(request, field, normalizeText(candidate[field as HeroMissionEditableField] as string | null | undefined, maximum, field));
  }
  for (const field of ["subjectId", "linkedAssessmentId", "badgeRewardId"] as const) {
    assignPresent(request, field, normalizeUuid(candidate[field], field));
  }
  for (const [field, rules] of Object.entries(INTEGER_RULES)) {
    assignPresent(request, field, normalizeInteger(candidate[field as HeroMissionEditableField] as NumericFormValue | null | undefined, field, rules));
  }
  assignPresent(request, "metadata", normalizeMetadata(candidate.metadata, "metadata"));
  return request;
}

export function normalizeCreateHeroMissionRequest(
  candidate: CreateHeroMissionCandidate,
): CreateHeroMissionRequest {
  const titleEn = normalizeText(candidate.titleEn, 255, "titleEn");
  const titleAr = normalizeText(candidate.titleAr, 255, "titleAr");
  assertEffectiveTitles(titleEn, titleAr);
  return {
    academicYearId: canonicalAcademicYear(candidate),
    termId: requiredUuid(candidate.termId, "termId", "termRequired"),
    stageId: requiredUuid(candidate.stageId, "stageId", "stageRequired"),
    ...createMissionScalars(candidate),
    objectives: normalizeObjectives(candidate.objectives, true),
  } as CreateHeroMissionRequest;
}

function isUpdateFieldProtected(
  field: HeroMissionEditableField,
  status: HeroJourneyMissionStatus,
): boolean {
  return (
    DASHBOARD_PROTECTED_UPDATE_FIELDS.has(field) ||
    (status === "published" && PUBLISHED_PROTECTED_UPDATE_FIELDS.has(field))
  );
}

function normalizeEditableField(
  field: HeroMissionEditableField,
  candidate: UpdateHeroMissionCandidate,
): unknown {
  const rawCandidate = candidate[field];
  if (rawCandidate === undefined) return undefined;
  if (field === "objectives") return normalizeObjectives(candidate.objectives, false);
  if (field === "metadata") return normalizeMetadata(rawCandidate, field);
  if (UUID_FIELDS.has(field)) return normalizeUuid(rawCandidate as string | null, field);
  if (TEXT_LIMITS[field]) return normalizeText(rawCandidate as string | null, TEXT_LIMITS[field], field);
  if (INTEGER_RULES[field]) return normalizeInteger(rawCandidate as NumericFormValue | null, field, INTEGER_RULES[field]);
  return undefined;
}

function updateEffectiveTitle(
  request: UpdateHeroMissionRequest,
  field: "titleEn" | "titleAr",
  original: HeroJourneyMission,
): string | null | undefined {
  return own(request, field) ? request[field] : original[field];
}

export function normalizeUpdateHeroMissionRequest(
  candidate: UpdateHeroMissionCandidate,
  context: HeroMissionUpdateContext,
): UpdateHeroMissionRequest {
  if (context.status === "archived") {
    throw new HeroMissionContractError("missionArchived");
  }
  const request: UpdateHeroMissionRequest = {};
  const mutableRequest = request as Record<string, unknown>;
  context.dirtyFields.forEach((field) => {
    if (isUpdateFieldProtected(field, context.status)) return;
    assignPresent(mutableRequest, field, normalizeEditableField(field, candidate));
  });
  assertEffectiveTitles(
    updateEffectiveTitle(request, "titleEn", context.original),
    updateEffectiveTitle(request, "titleAr", context.original),
  );
  return request;
}

export function isHeroMissionEditable(
  status: HeroJourneyMissionStatus,
): boolean {
  return status !== "archived";
}
