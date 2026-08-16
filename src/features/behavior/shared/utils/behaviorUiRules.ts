import type {
  BehaviorCategory,
  BehaviorRecord,
  BehaviorReviewQueueItem,
  BehaviorStatus,
  BehaviorType,
} from "../../types";

export function getBehaviorReviewStudentLabel(reviewItem: BehaviorReviewQueueItem): string {
  return reviewItem.summaries.student?.displayName || reviewItem.studentId;
}

export function getBehaviorReviewCategoryLabel(
  reviewItem: BehaviorReviewQueueItem,
  locale: string,
): string {
  const category = reviewItem.summaries.category;
  if (!category) return reviewItem.categoryId ?? "—";

  const localizedName = locale === "ar" ? category.nameAr : category.nameEn;
  const fallbackName = locale === "ar" ? category.nameEn : category.nameAr;
  return localizedName || fallbackName || reviewItem.categoryId || "—";
}

export function canEditBehaviorRecord(record: BehaviorRecord): boolean {
  return record.status === "draft";
}

export function canCancelBehaviorRecord(record: BehaviorRecord): boolean {
  return record.status === "draft" || record.status === "submitted";
}

export function canApproveOrRejectBehaviorRecord(record: BehaviorRecord): boolean {
  return record.status === "submitted";
}

export function canSubmitBehaviorRecord(record: BehaviorRecord): boolean {
  return (
    record.status === "draft" &&
    [record.titleEn, record.titleAr, record.noteEn, record.noteAr].some((value) =>
      Boolean(value?.trim()),
    )
  );
}

export function getBehaviorCategoryPointsPreview(
  categories: BehaviorCategory[],
  categoryId: string,
): { points: number; type: BehaviorType } | null {
  const category = categories.find((item) => item.id === categoryId);
  if (!category) return null;
  return {
    points: category.defaultPoints,
    type: category.type,
  };
}

export function normalizeBehaviorPointsForType(
  type: BehaviorType,
  points: number,
): number {
  if (points === 0) return 0;
  const absolutePoints = Math.abs(points);
  return type === "positive" ? absolutePoints : -absolutePoints;
}

export function normalizeCategoryCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function validateCategoryCode(code: string): boolean {
  if (!code || code.length > 100) return false;
  return /^[A-Z0-9]+(?:_[A-Z0-9]+)*$/.test(code);
}

export function validateCategoryName(nameEn?: string, nameAr?: string): boolean {
  const hasEn = typeof nameEn === "string" && nameEn.trim().length > 0;
  const hasAr = typeof nameAr === "string" && nameAr.trim().length > 0;
  return hasEn || hasAr;
}

export function validateCategoryPoints(
  type: BehaviorType,
  points: number | string,
): boolean {
  const raw = typeof points === "string" ? points.trim() : points;
  if (raw === "") return false;
  const num = Number(raw);
  if (Number.isNaN(num) || !Number.isInteger(num)) return false;

  if (type === "positive") {
    return num >= 0;
  } else if (type === "negative") {
    return num <= 0;
  }
  return false;
}

export function validateRecordContent(record: {
  titleEn?: string;
  titleAr?: string;
  noteEn?: string;
  noteAr?: string;
}): boolean {
  return [record.titleEn, record.titleAr, record.noteEn, record.noteAr].some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
}

export function validateRecordPoints(
  type: BehaviorType,
  points: number | string,
): boolean {
  return validateCategoryPoints(type, points);
}

export function validateRecordCategory(
  category: { isActive: boolean; type: BehaviorType },
  recordType: BehaviorType,
): boolean {
  return category.isActive && category.type === recordType;
}

export function validateRecordTermDate(
  occurredAt: string | Date,
  termRange?: { startDate: string; endDate: string },
): boolean {
  const date = occurredAt instanceof Date ? occurredAt : new Date(occurredAt);
  if (Number.isNaN(date.getTime())) return false;

  if (!termRange) return true;

  const start = new Date(termRange.startDate);
  const end = new Date(termRange.endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(23, 59, 59, 999);
  return date >= start && date <= end;
}

export function canSubmitStudentBehaviorRecord(
  academicYearId: string | null | undefined,
  categoryId: string | null | undefined,
  isSubmitting: boolean,
): boolean {
  return Boolean(academicYearId && categoryId) && !isSubmitting;
}

export function validatePointsOverride(
  type: BehaviorType,
  points: number | string,
): boolean {
  return validateCategoryPoints(type, points);
}

/**
 * Helper to determine if a behavior record status should create a point ledger entry.
 * Reserved for backend synchronization/ledger check integration.
 */
export function shouldCreatePointLedger(status: BehaviorStatus): boolean {
  return status === "approved";
}

export function validateDateRange(
  from?: string | Date | null,
  to?: string | Date | null,
): boolean {
  let fromDate: Date | null = null;
  let toDate: Date | null = null;

  if (from !== undefined && from !== null) {
    fromDate = from instanceof Date ? from : new Date(from);
    if (Number.isNaN(fromDate.getTime())) return false;
  }

  if (to !== undefined && to !== null) {
    toDate = to instanceof Date ? to : new Date(to);
    if (Number.isNaN(toDate.getTime())) return false;
  }

  if (fromDate && toDate) {
    return fromDate <= toDate;
  }

  return true;
}
