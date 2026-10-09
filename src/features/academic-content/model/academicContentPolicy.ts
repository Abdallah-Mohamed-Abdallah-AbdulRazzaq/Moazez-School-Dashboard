import type {
  AcademicContentAudience,
  AcademicContentStatus,
  AcademicContentTargetDraft,
  AcademicContentTargetScope,
  AcademicContentType,
} from "../types/contracts";

const MUTABLE_STATUSES: ReadonlySet<AcademicContentStatus> = new Set([
  "DRAFT",
  "CHANGES_REQUESTED",
]);

const AUDIENCES_BY_TYPE: Readonly<
  Record<AcademicContentType, readonly AcademicContentAudience[]>
> = {
  TEACHER_PREPARATION: ["INTERNAL_STAFF"],
  WEEKLY_PLAN: ["STUDENTS", "GUARDIANS", "STUDENTS_AND_GUARDIANS"],
  GUARDIAN_WEEKLY_NOTE: ["GUARDIANS"],
  SUBJECT_RESOURCE: ["STUDENTS", "GUARDIANS", "STUDENTS_AND_GUARDIANS"],
  ONLINE_SESSION: ["STUDENTS", "STUDENTS_AND_GUARDIANS"],
  GENERAL_RESOURCE: [
    "INTERNAL_STAFF",
    "STUDENTS",
    "GUARDIANS",
    "STUDENTS_AND_GUARDIANS",
  ],
};

const SUBJECT_REQUIRED_TYPES: ReadonlySet<AcademicContentType> = new Set([
  "TEACHER_PREPARATION",
  "WEEKLY_PLAN",
  "SUBJECT_RESOURCE",
  "ONLINE_SESSION",
]);

const TARGET_ANCHOR_BY_SCOPE: Readonly<
  Record<AcademicContentTargetScope, keyof AcademicContentTargetDraft | null>
> = {
  SCHOOL: null,
  STAGE: "stageId",
  GRADE: "gradeId",
  SECTION: "sectionId",
  CLASSROOM: "classroomId",
};

const TARGET_ANCHORS = ["stageId", "gradeId", "sectionId", "classroomId"] as const;
const BYTE_COUNT_PATTERN = /^(0|[1-9][0-9]*)$/u;
const BYTE_UNIT = BigInt(1024);
const DISPLAY_PRECISION = BigInt(10);

export function allowedAudiences(
  type: AcademicContentType,
): readonly AcademicContentAudience[] {
  return AUDIENCES_BY_TYPE[type];
}

export function isAcademicContentMutableStatus(
  status: AcademicContentStatus,
): status is "DRAFT" | "CHANGES_REQUESTED" {
  return MUTABLE_STATUSES.has(status);
}

export function requiresSubject(type: AcademicContentType): boolean {
  return SUBJECT_REQUIRED_TYPES.has(type);
}

export function validateTargetDraft(
  target: AcademicContentTargetDraft,
  type: AcademicContentType,
): string[] {
  const invalidFields: string[] = [];
  const expectedAnchor = TARGET_ANCHOR_BY_SCOPE[target.scopeType];

  for (const anchor of TARGET_ANCHORS) {
    const shouldBeSet = anchor === expectedAnchor;
    if (Boolean(target[anchor]) !== shouldBeSet) invalidFields.push(anchor);
  }
  if (requiresSubject(type) && !target.subjectId) invalidFields.push("subjectId");
  if (
    target.teacherSubjectAllocationId &&
    (target.scopeType !== "CLASSROOM" || !target.subjectId)
  ) {
    invalidFields.push("teacherSubjectAllocationId");
  }

  return invalidFields;
}

export function parseByteCount(byteCount: string): bigint {
  if (!BYTE_COUNT_PATTERN.test(byteCount)) {
    throw new RangeError("Byte count must be a non-negative decimal string");
  }
  return BigInt(byteCount);
}

export function formatByteCount(byteCount: string): string {
  const bytes = parseByteCount(byteCount);
  const units = [
    [BYTE_UNIT ** BigInt(3), "GiB"],
    [BYTE_UNIT ** BigInt(2), "MiB"],
    [BYTE_UNIT, "KiB"],
  ] as const;

  for (const [divisor, label] of units) {
    if (bytes >= divisor) return `${formatUnit(bytes, divisor)} ${label}`;
  }
  return `${bytes} B`;
}

function formatUnit(bytes: bigint, divisor: bigint): string {
  const tenths = (bytes * DISPLAY_PRECISION) / divisor;
  const whole = tenths / DISPLAY_PRECISION;
  const remainder = tenths % DISPLAY_PRECISION;
  return remainder === BigInt(0) ? `${whole}` : `${whole}.${remainder}`;
}

export function isValidHttpsUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.protocol === "https:" &&
      Boolean(parsedUrl.hostname) &&
      !parsedUrl.username &&
      !parsedUrl.password
    );
  } catch (error) {
    if (error instanceof TypeError) return false;
    throw error;
  }
}

export function isOrderedDateRange(start: string, end: string): boolean {
  return start <= end;
}

export function isWithinLength(text: string, maximumLength: number): boolean {
  return text.trim().length > 0 && text.length <= maximumLength;
}
