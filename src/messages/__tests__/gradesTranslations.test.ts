import { describe, expect, it } from "vitest";
import enMessages from "../en.json";
import arMessages from "../ar.json";

describe("Grades Tab i18n Translations (Task 2)", () => {
  const expectedKeys = [
    "rule_info",
    "pass_mark",
    "grading_scale",
    "rounding",
    "completed_weight",
    "assessments_title",
    "col_subject",
    "col_completed_weight",
    "col_entered",
    "col_missing",
    "col_absent",
    "col_max_score",
    "col_score",
    "col_weight",
    "col_contribution",
    "source",
    "status",
    "col_status",
    "col_title",
    "col_type",
    "col_date",
    "status_incomplete",
    "status_passing",
    "status_failing",
    "status_entered",
    "status_missing",
    "status_absent",
    "pending_tag",
  ];

  it("should have all required keys in en.json under students_guardians.profile.grades", () => {
    const gradesEn = enMessages.students_guardians.profile.grades;
    expect(gradesEn).toBeDefined();

    for (const key of expectedKeys) {
      expect(gradesEn[key]).toBeDefined();
      expect(typeof gradesEn[key]).toBe("string");
    }
  });

  it("should have all required keys in ar.json under students_guardians.profile.grades", () => {
    const gradesAr = arMessages.students_guardians.profile.grades;
    expect(gradesAr).toBeDefined();

    for (const key of expectedKeys) {
      expect(gradesAr[key]).toBeDefined();
      expect(typeof gradesAr[key]).toBe("string");
    }
  });

  it("should match expected values for en.json", () => {
    const gradesEn = enMessages.students_guardians.profile.grades;
    expect(gradesEn.rule_info).toBe("Grading Rule");
    expect(gradesEn.pass_mark).toBe("Pass Mark");
    expect(gradesEn.grading_scale).toBe("Grading Scale");
    expect(gradesEn.rounding).toBe("Rounding");
    expect(gradesEn.completed_weight).toBe("Completed Weight");
    expect(gradesEn.assessments_title).toBe("Assessments Breakdown");
    expect(gradesEn.col_subject).toBe("Subject");
    expect(gradesEn.col_completed_weight).toBe("Completed Weight");
    expect(gradesEn.col_entered).toBe("Graded / Total");
    expect(gradesEn.col_missing).toBe("Missing");
    expect(gradesEn.col_absent).toBe("Absent");
    expect(gradesEn.col_max_score).toBe("Max Score");
    expect(gradesEn.col_score).toBe("Score");
    expect(gradesEn.col_weight).toBe("Weight");
    expect(gradesEn.col_contribution).toBe("Contribution");
    expect(gradesEn.status_incomplete).toBe("Incomplete");
    expect(gradesEn.status_passing).toBe("Passing");
    expect(gradesEn.status_failing).toBe("Failing");
    expect(gradesEn.status_entered).toBe("Graded");
    expect(gradesEn.status_missing).toBe("Missing");
    expect(gradesEn.status_absent).toBe("Absent");
    expect(gradesEn.pending_tag).toBe("Pending");
  });

  it("should match expected values for ar.json", () => {
    const gradesAr = arMessages.students_guardians.profile.grades;
    expect(gradesAr.rule_info).toBe("قاعدة التقييم");
    expect(gradesAr.pass_mark).toBe("درجة النجاح");
    expect(gradesAr.grading_scale).toBe("مقياس الدرجات");
    expect(gradesAr.rounding).toBe("التقريب");
    expect(gradesAr.completed_weight).toBe("الوزن المكتمل");
    expect(gradesAr.assessments_title).toBe("تفاصيل التقييمات");
    expect(gradesAr.col_subject).toBe("المادة");
    expect(gradesAr.col_completed_weight).toBe("الوزن المكتمل");
    expect(gradesAr.col_entered).toBe("المُدخل / الإجمالي");
    expect(gradesAr.col_missing).toBe("مفقود");
    expect(gradesAr.col_absent).toBe("غائب");
    expect(gradesAr.col_max_score).toBe("الدرجة العظمى");
    expect(gradesAr.col_score).toBe("الدرجة");
    expect(gradesAr.col_weight).toBe("الوزن");
    expect(gradesAr.col_contribution).toBe("المساهمة النسبية");
    expect(gradesAr.status_incomplete).toBe("غير مكتمل");
    expect(gradesAr.status_passing).toBe("ناجح");
    expect(gradesAr.status_failing).toBe("راسب");
    expect(gradesAr.status_entered).toBe("مُدخل");
    expect(gradesAr.status_missing).toBe("مفقود");
    expect(gradesAr.status_absent).toBe("غائب");
    expect(gradesAr.pending_tag).toBe("معلق");
  });
});
