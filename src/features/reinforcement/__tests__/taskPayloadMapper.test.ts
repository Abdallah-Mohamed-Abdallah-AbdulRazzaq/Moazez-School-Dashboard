import { describe, expect, it } from "vitest";
import { buildReinforcementQueryString } from "@/features/reinforcement/services/reinforcementApiUtils";
import {
  normalizeReinforcementTaskTargets,
  serializeCreateReinforcementTaskPayload,
} from "@/features/reinforcement/services/reinforcementTasksService";
import type { CreateReinforcementTaskPayload } from "@/features/reinforcement/types";

describe("reinforcement task payload contracts", () => {
  it("keeps Sprint 5A task payload fields typed and unmodified", () => {
    const payload: CreateReinforcementTaskPayload = {
      academicYearId: "year-1",
      termId: "term-1",
      subjectId: "subject-1",
      titleEn: "Class helper",
      titleAr: "مساعد الفصل",
      source: "teacher",
      rewardType: "xp",
      rewardValue: 15,
      dueDate: "2026-05-21",
      targets: [{ scopeType: "student", scopeId: "student-1" }],
      stages: [
        {
          sortOrder: 1,
          titleEn: "Upload proof",
          titleAr: "رفع الدليل",
          proofType: "image",
          requiresApproval: true,
        },
      ],
    };

    expect(payload.targets[0]).toEqual({
      scopeType: "student",
      scopeId: "student-1",
    });
    expect(payload.stages[0]).toMatchObject({
      sortOrder: 1,
      proofType: "image",
      requiresApproval: true,
    });
  });

  it("serializes task create payload with targeting only inside targets", () => {
    const payload = {
      academicYearId: "year-1",
      yearId: "legacy-year-1",
      termId: "term-1",
      subjectId: "subject-1",
      classroomId: "classroom-1",
      studentId: "student-1",
      stageId: "stage-1",
      gradeId: "grade-1",
      sectionId: "section-1",
      enrollmentId: "enrollment-1",
      assignedById: "teacher-1",
      assignedByName: "Teacher One",
      titleEn: "Class helper",
      titleAr: "مساعد الفصل",
      descriptionEn: "",
      descriptionAr: undefined,
      source: "teacher",
      rewardType: "xp",
      rewardValue: 15,
      dueDate: "2026-05-21",
      targets: [
        { scope: "CLASSROOM", classroomId: "classroom-1" },
        { scopeType: "student", studentId: "student-1", enrollmentId: "enrollment-1" },
      ],
      stages: [
        {
          sortOrder: 1,
          titleEn: "Upload proof",
          titleAr: "رفع الدليل",
          descriptionEn: undefined,
          proofType: "image",
          requiresApproval: false,
        },
      ],
    } satisfies CreateReinforcementTaskPayload & Record<string, unknown>;

    const serialized = serializeCreateReinforcementTaskPayload(payload);

    expect(serialized).toEqual({
      academicYearId: "year-1",
      termId: "term-1",
      subjectId: "subject-1",
      titleEn: "Class helper",
      titleAr: "مساعد الفصل",
      source: "teacher",
      rewardType: "xp",
      rewardValue: 15,
      dueDate: "2026-05-21",
      targets: [
        { scopeType: "classroom", scopeId: "classroom-1" },
        { scopeType: "student", scopeId: "student-1" },
      ],
      stages: [
        {
          sortOrder: 1,
          titleEn: "Upload proof",
          titleAr: "رفع الدليل",
          proofType: "image",
          requiresApproval: false,
        },
      ],
    });
    expect(JSON.stringify(serialized)).not.toContain("classroomId");
    expect(JSON.stringify(serialized)).not.toContain("studentId");
    expect(JSON.stringify(serialized)).not.toContain("enrollmentId");
    expect(JSON.stringify(serialized)).not.toContain("yearId");
    expect(JSON.stringify(serialized)).not.toContain("assignedById");
  });

  it("normalizes every supported target scope into scopeType and scopeId", () => {
    expect(
      normalizeReinforcementTaskTargets([
        { scope: "school", schoolId: "school-1" },
        { scopeType: "stage", stageId: "stage-1" },
        { scope: "GRADE", gradeId: "grade-1" },
        { scopeType: "section", sectionId: "section-1" },
        { scope: "classroom", classroomId: "classroom-1" },
        { scopeType: "student", studentId: "student-1" },
        { scopeType: "student", scopeId: "" },
        { scopeType: "unsupported", scopeId: "ignored-1" },
        null,
      ]),
    ).toEqual([
      { scopeType: "school", scopeId: "school-1" },
      { scopeType: "stage", scopeId: "stage-1" },
      { scopeType: "grade", scopeId: "grade-1" },
      { scopeType: "section", scopeId: "section-1" },
      { scopeType: "classroom", scopeId: "classroom-1" },
      { scopeType: "student", scopeId: "student-1" },
    ]);
  });

  it.each(["Reading Star", -1])(
    "does not forward invalid reward value %s to the backend",
    (rewardValue) => {
      const payload = {
        termId: "term-1",
        titleEn: "Reading task",
        titleAr: "Reading task",
        source: "teacher",
        rewardType: "badge",
        rewardValue,
        dueDate: "2026-07-21",
        targets: [{ scopeType: "student", scopeId: "student-1" }],
        stages: [
          {
            sortOrder: 1,
            titleEn: "Read",
            titleAr: "Read",
            proofType: "none",
          },
        ],
      } as unknown as CreateReinforcementTaskPayload;

      expect(
        serializeCreateReinforcementTaskPayload(payload),
      ).not.toHaveProperty("rewardValue");
    },
  );

  it("omits empty, nullish, and all query values", () => {
    expect(
      buildReinforcementQueryString({
        academicYearId: "year-1",
        yearId: "legacy-year-1",
        termId: "term-1",
        status: "all",
        search: "",
        includeCancelled: false,
        page: 1,
      }),
    ).toBe("?academicYearId=year-1&termId=term-1&includeCancelled=false&page=1");

    expect(
      buildReinforcementQueryString({
        yearId: "legacy-year-1",
        termId: "term-1",
      }),
    ).toBe("?academicYearId=legacy-year-1&termId=term-1");
  });
});
