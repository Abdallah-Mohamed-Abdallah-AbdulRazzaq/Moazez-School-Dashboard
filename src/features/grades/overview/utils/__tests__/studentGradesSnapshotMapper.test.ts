import { describe, expect, it } from "vitest";
import { mapBackendStudentGradeSnapshot } from "../studentGradesSnapshotMapper";
import type { BackendStudentGradeSnapshot } from "@/features/grades/shared/types";

describe("studentGradesSnapshotMapper", () => {
  const sampleBackendSnapshot: BackendStudentGradeSnapshot = {
    studentId: "stu-1",
    enrollmentId: "enr-1",
    academicYearId: "year-2026",
    yearId: "year-2026",
    termId: "term-1",
    subjectId: null,
    rule: {
      source: "DEFAULT",
      ruleId: null,
      passMark: 50,
      rounding: "decimal_2",
      gradingScale: "percentage",
    },
    finalPercent: 88.5,
    completedWeight: 100,
    status: "passing",
    subjects: [
      {
        subjectId: "sub-math",
        subjectName: "Mathematics",
        subjectNameAr: "الرياضيات",
        subjectNameEn: "Mathematics",
        finalPercent: 90,
        completedWeight: 100,
        assessmentCount: 2,
        enteredCount: 2,
        missingCount: 0,
        absentCount: 0,
        status: "passing",
      },
      {
        subjectId: "sub-sci",
        subjectName: "Science",
        subjectNameAr: null,
        subjectNameEn: "Science",
        finalPercent: 80,
        completedWeight: 100,
        assessmentCount: 1,
        enteredCount: 1,
        missingCount: 0,
        absentCount: 0,
        status: "passing",
      },
    ],
    assessments: [
      {
        assessmentId: "asm-1",
        subjectId: "sub-math",
        title: "Quiz 1",
        titleEn: "Quiz 1",
        titleAr: null,
        type: "QUIZ",
        date: "2026-01-10",
        weight: 10,
        maxScore: 100,
        itemId: "item-1",
        score: 85,
        percent: 85,
        weightedContribution: 8.5,
        status: "entered",
        comment: null,
        isVirtualMissing: false,
      },
      {
        assessmentId: "asm-2",
        subjectId: "sub-math",
        title: "Midterm",
        titleEn: "Midterm",
        titleAr: null,
        type: "EXAM",
        date: "2026-02-15",
        weight: 40,
        maxScore: 100,
        itemId: "item-2",
        score: 95,
        percent: 95,
        weightedContribution: 38,
        status: "entered",
        comment: null,
        isVirtualMissing: false,
      },
    ],
  };

  it("correctly maps backend snapshot to frontend UI snapshot format", () => {
    const result = mapBackendStudentGradeSnapshot(sampleBackendSnapshot);

    expect(result.studentId).toBe("stu-1");
    expect(result.currentAverage).toBe(88.5);
    expect(result.highestAverage).toBe(90);
    expect(result.lowestAverage).toBe(80);
    expect(result.totalAssessments).toBe(2);
    expect(result.subjectRows).toHaveLength(2);
    expect(result.subjectRows[0].subjectName).toBe("Mathematics");
    expect(result.subjectRows[0].trend).toBe("up");
    expect(result.performanceTrend).toHaveLength(2);
  });

  it("maps rule metadata, subject counts, and assessment items", () => {
    const incompleteBackendSnapshot: BackendStudentGradeSnapshot = {
      studentId: "stu-1",
      enrollmentId: "enr-1",
      academicYearId: "year-2026",
      yearId: "year-2026",
      termId: "term-1",
      subjectId: null,
      rule: {
        source: "GRADE",
        ruleId: "rule-1",
        passMark: 50,
        rounding: "decimal_0",
        gradingScale: "percentage",
      },
      finalPercent: null,
      completedWeight: 0,
      status: "incomplete",
      subjects: [
        {
          subjectId: "sub-math",
          subjectName: "Demo Mathematics",
          subjectNameAr: "Demo Mathematics",
          subjectNameEn: "Demo Mathematics",
          finalPercent: null,
          completedWeight: 0,
          assessmentCount: 2,
          enteredCount: 0,
          missingCount: 2,
          absentCount: 0,
          status: "incomplete",
        },
      ],
      assessments: [
        {
          assessmentId: "asm-1",
          subjectId: "sub-math",
          title: "fvjh",
          titleEn: "fvjh",
          titleAr: "opip';k",
          type: "QUIZ",
          date: "2026-09-01",
          weight: 15,
          maxScore: 20,
          itemId: null,
          score: null,
          percent: null,
          weightedContribution: null,
          status: "missing",
          comment: null,
          isVirtualMissing: true,
        },
        {
          assessmentId: "asm-2",
          subjectId: "sub-math",
          title: null,
          titleEn: null,
          titleAr: null,
          type: "QUIZ",
          date: "2026-09-15",
          weight: 15,
          maxScore: 20,
          itemId: null,
          score: null,
          percent: null,
          weightedContribution: null,
          status: "missing",
          comment: null,
          isVirtualMissing: true,
        },
      ],
    };

    const result = mapBackendStudentGradeSnapshot(incompleteBackendSnapshot);

    expect(result.rule).toBeDefined();
    expect(result.rule?.passMark).toBe(50);
    expect(result.status).toBe("incomplete");
    expect(result.completedWeight).toBe(0);

    expect(result.subjectRows[0].completedWeight).toBe(0);
    expect(result.subjectRows[0].assessmentCount).toBe(2);
    expect(result.subjectRows[0].enteredCount).toBe(0);
    expect(result.subjectRows[0].missingCount).toBe(2);
    expect(result.subjectRows[0].status).toBe("incomplete");

    expect(result.assessments).toHaveLength(2);
    expect(result.assessments[0].title).toBe("fvjh");
    expect(result.assessments[1].title).toBe(null);
    expect(result.assessments[1].isVirtualMissing).toBe(true);
  });
});

