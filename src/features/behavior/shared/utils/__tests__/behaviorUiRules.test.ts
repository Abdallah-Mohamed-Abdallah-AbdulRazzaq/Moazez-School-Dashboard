import { describe, expect, it } from "vitest";
import {
  canApproveOrRejectBehaviorRecord,
  canCancelBehaviorRecord,
  canEditBehaviorRecord,
  canSubmitStudentBehaviorRecord,
  canSubmitBehaviorRecord,
  getBehaviorCategoryPointsPreview,
  getBehaviorReviewCategoryLabel,
  getBehaviorReviewStudentLabel,
  normalizeBehaviorPointsForType,
  normalizeCategoryCode,
  validateCategoryCode,
  validateCategoryName,
  validateCategoryPoints,
  validateRecordContent,
  validateRecordPoints,
  validateRecordCategory,
  validateRecordTermDate,
  validatePointsOverride,
  shouldCreatePointLedger,
  validateDateRange,
} from "../behaviorUiRules";
import type { BehaviorCategory, BehaviorRecord, BehaviorReviewQueueItem } from "../../../types";

const baseRecord: BehaviorRecord = {
  id: "record-1",
  termId: null,
  studentId: "student-1",
  enrollmentId: null,
  categoryId: "category-1",
  category: null,
  term: null,
  enrollment: null,
  status: "draft",
  points: 0,
  occurredAt: "2026-06-25T08:00:00.000Z",
};

const categories: BehaviorCategory[] = [
  {
    id: "positive-category",
    code: "POS",
    descriptionEn: null,
    descriptionAr: null,
    nameEn: "Helping",
    nameAr: "مساعدة",
    type: "positive",
    defaultSeverity: "low",
    defaultPoints: 5,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "negative-category",
    code: "NEG",
    descriptionEn: null,
    descriptionAr: null,
    nameEn: "Late",
    nameAr: "تأخير",
    type: "negative",
    defaultSeverity: "medium",
    defaultPoints: -3,
    isActive: true,
    sortOrder: 2,
  },
];

describe("behavior UI rules", () => {
  it("renders review queue labels from backend summaries with localized fallbacks", () => {
    const item = {
      id: "review-1",
      studentId: "student-1",
      categoryId: "category-1",
      type: "positive",
      severity: "low",
      status: "submitted",
      points: 5,
      occurredAt: "2026-06-25T08:00:00.000Z",
      submittedAt: "2026-06-25T09:00:00.000Z",
      summaries: {
        student: { id: "student-1", displayName: "Mona Ali" },
        category: {
          id: "category-1",
          nameEn: "Helping others",
          nameAr: "مساعدة الآخرين",
        },
      },
    } satisfies BehaviorReviewQueueItem;

    expect(getBehaviorReviewStudentLabel(item)).toBe("Mona Ali");
    expect(getBehaviorReviewCategoryLabel(item, "en")).toBe("Helping others");
    expect(getBehaviorReviewCategoryLabel(item, "ar")).toBe("مساعدة الآخرين");
  });

  it("falls back to review queue IDs when backend summaries are unavailable", () => {
    const item = {
      id: "review-1",
      studentId: "student-1",
      categoryId: null,
      type: "negative",
      severity: "medium",
      status: "submitted",
      points: -3,
      occurredAt: "2026-06-25T08:00:00.000Z",
      submittedAt: null,
      summaries: { student: null, category: null },
    } satisfies BehaviorReviewQueueItem;

    expect(getBehaviorReviewStudentLabel(item)).toBe("student-1");
    expect(getBehaviorReviewCategoryLabel(item, "en")).toBe("—");
  });

  it("allows edit only while a record is draft", () => {
    expect(canEditBehaviorRecord({ ...baseRecord, status: "draft" })).toBe(true);
    expect(canEditBehaviorRecord({ ...baseRecord, status: "submitted" })).toBe(false);
    expect(canEditBehaviorRecord({ ...baseRecord, status: "approved" })).toBe(false);
  });

  it("allows cancel only while a record is draft or submitted", () => {
    expect(canCancelBehaviorRecord({ ...baseRecord, status: "draft" })).toBe(true);
    expect(canCancelBehaviorRecord({ ...baseRecord, status: "submitted" })).toBe(true);
    expect(canCancelBehaviorRecord({ ...baseRecord, status: "approved" })).toBe(false);
    expect(canCancelBehaviorRecord({ ...baseRecord, status: "rejected" })).toBe(false);
  });

  it("allows approve or reject only while a record is submitted", () => {
    expect(canApproveOrRejectBehaviorRecord({ ...baseRecord, status: "submitted" })).toBe(true);
    expect(canApproveOrRejectBehaviorRecord({ ...baseRecord, status: "draft" })).toBe(false);
    expect(canApproveOrRejectBehaviorRecord({ ...baseRecord, status: "approved" })).toBe(false);
  });

  it("requires at least one title or note field before submit", () => {
    expect(canSubmitBehaviorRecord({ ...baseRecord, status: "draft" })).toBe(false);
    expect(canSubmitBehaviorRecord({ ...baseRecord, status: "draft", titleEn: "Helpful" })).toBe(true);
    expect(canSubmitBehaviorRecord({ ...baseRecord, status: "draft", noteAr: "ملاحظة" })).toBe(true);
    expect(canSubmitBehaviorRecord({ ...baseRecord, status: "submitted", titleEn: "Helpful" })).toBe(false);
  });

  it("returns the selected category default points as the record preview", () => {
    expect(getBehaviorCategoryPointsPreview(categories, "positive-category")).toEqual({
      points: 5,
      type: "positive",
    });
    expect(getBehaviorCategoryPointsPreview(categories, "missing")).toBeNull();
  });

  it("prevents point signs that conflict with behavior type", () => {
    expect(normalizeBehaviorPointsForType("positive", -5)).toBe(5);
    expect(normalizeBehaviorPointsForType("positive", 5)).toBe(5);
    expect(normalizeBehaviorPointsForType("negative", 5)).toBe(-5);
    expect(normalizeBehaviorPointsForType("negative", -5)).toBe(-5);
    expect(normalizeBehaviorPointsForType("positive", 0)).toBe(0);
  });

  describe("normalizeCategoryCode", () => {
    it("converts input to uppercase, replaces non-alphanumeric with _, collapses underscores, and trims underscores", () => {
      expect(normalizeCategoryCode("abc")).toBe("ABC");
      expect(normalizeCategoryCode("abc-def")).toBe("ABC_DEF");
      expect(normalizeCategoryCode("abc/def")).toBe("ABC_DEF");
      expect(normalizeCategoryCode("abc..def")).toBe("ABC_DEF");
      expect(normalizeCategoryCode("abc!!!def")).toBe("ABC_DEF");
      expect(normalizeCategoryCode("abc  def")).toBe("ABC_DEF");
      expect(normalizeCategoryCode("abc__def")).toBe("ABC_DEF");
      expect(normalizeCategoryCode("_abc_")).toBe("ABC");
      expect(normalizeCategoryCode("__abc__def__")).toBe("ABC_DEF");
      expect(normalizeCategoryCode("late/arrival!!!")).toBe("LATE_ARRIVAL");
      expect(normalizeCategoryCode("bad.code name")).toBe("BAD_CODE_NAME");
      expect(normalizeCategoryCode("")).toBe("");
      expect(normalizeCategoryCode("!!!")).toBe("");
    });
  });

  describe("validateCategoryCode", () => {
    it("ensures code is required, matches regex, and is <= 100 characters", () => {
      expect(validateCategoryCode("ABC")).toBe(true);
      expect(validateCategoryCode("ABC_DEF")).toBe(true);
      expect(validateCategoryCode("A1_B2")).toBe(true);
      expect(validateCategoryCode("123")).toBe(true);
      expect(validateCategoryCode("A_B_C_D")).toBe(true);

      expect(validateCategoryCode("")).toBe(false);
      expect(validateCategoryCode("abc")).toBe(false);
      expect(validateCategoryCode("_ABC")).toBe(false);
      expect(validateCategoryCode("ABC_")).toBe(false);
      expect(validateCategoryCode("ABC__DEF")).toBe(false);
      expect(validateCategoryCode("ABC-DEF")).toBe(false);
      expect(validateCategoryCode("ABC.DEF")).toBe(false);
      expect(validateCategoryCode("ABC/DEF")).toBe(false);
      expect(validateCategoryCode("ABC DEF")).toBe(false);

      expect(validateCategoryCode("A".repeat(100))).toBe(true);
      expect(validateCategoryCode("A".repeat(101))).toBe(false);
    });
  });

  describe("validateCategoryName", () => {
    it("checks that at least one of nameEn or nameAr is present and non-whitespace", () => {
      expect(validateCategoryName("English Name", undefined)).toBe(true);
      expect(validateCategoryName(undefined, "اسم عربي")).toBe(true);
      expect(validateCategoryName("English Name", "اسم عربي")).toBe(true);
      expect(validateCategoryName("", "")).toBe(false);
      expect(validateCategoryName("   ", undefined)).toBe(false);
      expect(validateCategoryName(undefined, "   ")).toBe(false);
      expect(validateCategoryName(undefined, undefined)).toBe(false);
    });
  });

  describe("validateCategoryPoints", () => {
    it("validates points are integer and sign-compatible with behavior type", () => {
      expect(validateCategoryPoints("positive", 5)).toBe(true);
      expect(validateCategoryPoints("positive", "5")).toBe(true);
      expect(validateCategoryPoints("positive", " 5 ")).toBe(true);
      expect(validateCategoryPoints("positive", 0)).toBe(true);
      expect(validateCategoryPoints("positive", "0")).toBe(true);
      expect(validateCategoryPoints("negative", -3)).toBe(true);
      expect(validateCategoryPoints("negative", "-3")).toBe(true);
      expect(validateCategoryPoints("negative", " -3 ")).toBe(true);
      expect(validateCategoryPoints("negative", 0)).toBe(true);
      expect(validateCategoryPoints("negative", "0")).toBe(true);

      expect(validateCategoryPoints("positive", -5)).toBe(false);
      expect(validateCategoryPoints("positive", "-5")).toBe(false);
      expect(validateCategoryPoints("negative", 3)).toBe(false);
      expect(validateCategoryPoints("negative", "3")).toBe(false);
      expect(validateCategoryPoints("positive", 5.5)).toBe(false);
      expect(validateCategoryPoints("positive", "5.5")).toBe(false);
      expect(validateCategoryPoints("positive", "abc")).toBe(false);
      expect(validateCategoryPoints("positive", "")).toBe(false);
      expect(validateCategoryPoints("positive", "   ")).toBe(false);
      expect(validateCategoryPoints("positive", NaN)).toBe(false);
      expect(validateCategoryPoints("positive", Infinity)).toBe(false);
    });
  });

  describe("validateRecordContent", () => {
    it("ensures at least one of titleEn, titleAr, noteEn, or noteAr is non-whitespace", () => {
      expect(validateRecordContent({ titleEn: "Hello" })).toBe(true);
      expect(validateRecordContent({ titleAr: "مرحبا" })).toBe(true);
      expect(validateRecordContent({ noteEn: "Note" })).toBe(true);
      expect(validateRecordContent({ noteAr: "ملاحظة" })).toBe(true);
      expect(validateRecordContent({ titleEn: "  ", noteEn: "  " })).toBe(false);
      expect(validateRecordContent({})).toBe(false);
    });
  });

  describe("validateRecordPoints", () => {
    it("validates record points are integer and sign-compatible with behavior type", () => {
      expect(validateRecordPoints("positive", 10)).toBe(true);
      expect(validateRecordPoints("positive", "10")).toBe(true);
      expect(validateRecordPoints("positive", -10)).toBe(false);
      expect(validateRecordPoints("negative", -10)).toBe(true);
      expect(validateRecordPoints("negative", 10)).toBe(false);
      expect(validateRecordPoints("positive", "")).toBe(false);
      expect(validateRecordPoints("positive", 5.2)).toBe(false);
    });
  });

  describe("validateRecordCategory", () => {
    it("ensures category is active and has compatible type", () => {
      expect(validateRecordCategory({ isActive: true, type: "positive" }, "positive")).toBe(true);
      expect(validateRecordCategory({ isActive: true, type: "negative" }, "negative")).toBe(true);
      expect(validateRecordCategory({ isActive: false, type: "positive" }, "positive")).toBe(false);
      expect(validateRecordCategory({ isActive: true, type: "positive" }, "negative")).toBe(false);
      expect(validateRecordCategory({ isActive: true, type: "negative" }, "positive")).toBe(false);
    });
  });

  describe("validateRecordTermDate", () => {
    it("checks if occurredAt date is within the term date range (inclusive)", () => {
      expect(validateRecordTermDate("2026-06-25", { startDate: "2026-06-01", endDate: "2026-06-30" })).toBe(true);
      expect(validateRecordTermDate("2026-06-01", { startDate: "2026-06-01", endDate: "2026-06-30" })).toBe(true);
      expect(validateRecordTermDate("2026-06-30", { startDate: "2026-06-01", endDate: "2026-06-30" })).toBe(true);
      expect(validateRecordTermDate("2026-06-30T23:59:59.999Z", { startDate: "2026-06-01", endDate: "2026-06-30" })).toBe(true);
      expect(validateRecordTermDate("2026-05-31", { startDate: "2026-06-01", endDate: "2026-06-30" })).toBe(false);
      expect(validateRecordTermDate("2026-07-01", { startDate: "2026-06-01", endDate: "2026-06-30" })).toBe(false);
      expect(validateRecordTermDate(new Date("2026-06-15"), { startDate: "2026-06-01", endDate: "2026-06-30" })).toBe(true);
      expect(validateRecordTermDate("invalid-date", { startDate: "2026-06-01", endDate: "2026-06-30" })).toBe(false);
      expect(validateRecordTermDate("2026-06-15", { startDate: "invalid", endDate: "2026-06-30" })).toBe(false);
      expect(validateRecordTermDate("2026-06-15", { startDate: "2026-06-01", endDate: "invalid" })).toBe(false);
      expect(validateRecordTermDate("2026-06-15", undefined)).toBe(true);
      expect(validateRecordTermDate("2026-06-15")).toBe(true);
    });
  });

  describe("canSubmitStudentBehaviorRecord", () => {
    it("requires an academic year and category while idle", () => {
      expect(canSubmitStudentBehaviorRecord("year-1", "category-1", false)).toBe(true);
      expect(canSubmitStudentBehaviorRecord(null, "category-1", false)).toBe(false);
      expect(canSubmitStudentBehaviorRecord("year-1", "", false)).toBe(false);
      expect(canSubmitStudentBehaviorRecord("year-1", "category-1", true)).toBe(false);
    });
  });

  describe("validatePointsOverride", () => {
    it("validates overridden points are integer and sign-compatible with behavior type", () => {
      expect(validatePointsOverride("positive", 5)).toBe(true);
      expect(validatePointsOverride("positive", "5")).toBe(true);
      expect(validatePointsOverride("negative", -5)).toBe(true);
      expect(validatePointsOverride("negative", 5)).toBe(false);
      expect(validatePointsOverride("positive", -5)).toBe(false);
      expect(validatePointsOverride("positive", "")).toBe(false);
      expect(validatePointsOverride("positive", 5.5)).toBe(false);
    });
  });

  describe("shouldCreatePointLedger", () => {
    it("returns true only for approved status", () => {
      expect(shouldCreatePointLedger("approved")).toBe(true);
      expect(shouldCreatePointLedger("rejected")).toBe(false);
      expect(shouldCreatePointLedger("draft")).toBe(false);
      expect(shouldCreatePointLedger("submitted")).toBe(false);
      expect(shouldCreatePointLedger("cancelled")).toBe(false);
    });
  });

  describe("validateDateRange", () => {
    it("ensures From date is not after To date", () => {
      expect(validateDateRange("2026-06-01", "2026-06-30")).toBe(true);
      expect(validateDateRange("2026-06-01", "2026-06-01")).toBe(true);
      expect(validateDateRange("2026-06-30", "2026-06-01")).toBe(false);
      expect(validateDateRange(null, "2026-06-30")).toBe(true);
      expect(validateDateRange("2026-06-01", null)).toBe(true);
      expect(validateDateRange(null, null)).toBe(true);
      expect(validateDateRange(undefined, undefined)).toBe(true);
      expect(validateDateRange("invalid", "2026-06-30")).toBe(false);
      expect(validateDateRange("2026-06-01", "invalid")).toBe(false);
    });
  });
});
