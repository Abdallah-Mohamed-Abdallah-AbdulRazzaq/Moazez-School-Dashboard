import { describe, expect, it } from "vitest";
import type { Assessment } from "@/features/grades/shared/types";
import {
  academicReferenceMatcher,
  assessmentReferenceScope,
} from "../academicContentReferenceScope";
import {
  referenceTarget,
  referenceTargetOptions,
} from "./academicContentReferenceScope.fixture";

describe("backend-compatible academic reference matching", () => {
  const targets = [
    referenceTarget("CLASSROOM", "class-1"),
    referenceTarget("STAGE", "stage-2", "subject-2"),
  ];

  it.each([
    [referenceTarget("CLASSROOM", "class-1"), true],
    [referenceTarget("GRADE", "grade-1"), true],
    [referenceTarget("STAGE", "stage-1"), true],
    [referenceTarget("SCHOOL", null), true],
    [referenceTarget("CLASSROOM", "class-3", "subject-2"), true],
    [referenceTarget("CLASSROOM", "class-2"), false],
    [referenceTarget("CLASSROOM", "class-3"), false],
    [referenceTarget("CLASSROOM", "class-1", "subject-2"), false],
    [referenceTarget("CLASSROOM", "unknown-class"), false],
    [referenceTarget("SCHOOL", null, null), false],
  ])(
    "checks subject and resolved hierarchy together: %j → %s",
    (reference, expected) => {
      expect(
        academicReferenceMatcher(
          targets,
          referenceTargetOptions.structure,
        )(reference),
      ).toBe(expected);
    },
  );

  it.each([
    { targets: [] },
    { targets: [referenceTarget("SCHOOL", null, null)] },
  ])(
    "does not expose subject references without subject-qualified targets: %j",
    ({ targets }) => {
      expect(
        academicReferenceMatcher(
          targets,
          referenceTargetOptions.structure,
        )(referenceTarget("CLASSROOM", "class-1")),
      ).toBe(false);
    },
  );

  it.each(["scopeKey", "scopeId"] as const)(
    "resolves assessments using %s when explicit anchor fields are absent",
    (anchorField) => {
      const assessment: Assessment = {
        id: "assessment-1",
        termId: "term-1",
        subjectId: "subject-1",
        scopeType: "grade",
        scopeId: "",
        title: "Quiz",
        titleAr: "اختبار",
        type: "QUIZ",
        deliveryMode: "SCORE_ONLY",
        date: "2026-10-09",
        weight: 1,
        maxScore: 10,
        isLocked: false,
        approvalStatus: "draft",
        [anchorField]: "grade-2",
      };
      expect(
        academicReferenceMatcher(
          [referenceTarget("GRADE", "grade-2")],
          referenceTargetOptions.structure,
        )(assessmentReferenceScope(assessment)),
      ).toBe(true);
      expect(
        academicReferenceMatcher(
          [referenceTarget("GRADE", "grade-1")],
          referenceTargetOptions.structure,
        )(assessmentReferenceScope(assessment)),
      ).toBe(false);
    },
  );
});
