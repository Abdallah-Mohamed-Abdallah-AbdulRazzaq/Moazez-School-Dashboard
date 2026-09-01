import { describe, expect, it } from "vitest";
import {
  MAX_SELECTED_CREDENTIAL_STUDENTS,
  buildCredentialAudience,
  getCredentialAudienceKey,
} from "../credentialAudience";

const ids = {
  registration: "00000000-0000-4000-8000-000000000001",
  student: "00000000-0000-4000-8000-000000000002",
  year: "00000000-0000-4000-8000-000000000003",
  stage: "00000000-0000-4000-8000-000000000004",
  grade: "00000000-0000-4000-8000-000000000005",
  section: "00000000-0000-4000-8000-000000000006",
  classroom: "00000000-0000-4000-8000-000000000007",
};

describe("credentialAudience", () => {
  it.each([
    ["import_batch", { audienceMode: "import_batch", sourceRegistrationBatchId: ids.registration }],
    ["selected_students", { audienceMode: "selected_students", studentIds: [ids.student] }],
    ["academic_year", { audienceMode: "academic_year", academicYearId: ids.year }],
    ["stage", { audienceMode: "stage", academicYearId: ids.year, stageId: ids.stage }],
    ["grade", { audienceMode: "grade", academicYearId: ids.year, gradeId: ids.grade }],
    ["section", { audienceMode: "section", academicYearId: ids.year, sectionId: ids.section }],
    ["classroom", { audienceMode: "classroom", academicYearId: ids.year, classroomId: ids.classroom }],
    ["missing_password", { audienceMode: "missing_password" }],
  ] as const)("builds the exact %s payload", (_mode, expected) => {
    expect(
      buildCredentialAudience({
        ...ids,
        sourceRegistrationBatchId: ids.registration,
        studentIds: [ids.student],
        academicYearId: ids.year,
        stageId: ids.stage,
        gradeId: ids.grade,
        sectionId: ids.section,
        classroomId: ids.classroom,
        audienceMode: expected.audienceMode,
      }),
    ).toEqual(expected);
  });

  it("deduplicates selected students while preserving their order", () => {
    expect(
      buildCredentialAudience({
        audienceMode: "selected_students",
        studentIds: [ids.student, ids.registration, ids.student],
      }),
    ).toEqual({
      audienceMode: "selected_students",
      studentIds: [ids.student, ids.registration],
    });
  });

  it("rejects missing, malformed, and oversized selectors", () => {
    expect(buildCredentialAudience({ audienceMode: "import_batch" })).toBeNull();
    expect(
      buildCredentialAudience({
        audienceMode: "selected_students",
        studentIds: [],
      }),
    ).toBeNull();
    expect(
      buildCredentialAudience({
        audienceMode: "selected_students",
        studentIds: Array.from(
          { length: MAX_SELECTED_CREDENTIAL_STUDENTS + 1 },
          (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
        ),
      }),
    ).toBeNull();
    expect(
      buildCredentialAudience({
        audienceMode: "academic_year",
        academicYearId: "not-a-uuid",
      }),
    ).toBeNull();
  });

  it("creates a stable key from the exact payload", () => {
    const audience = {
      audienceMode: "selected_students" as const,
      studentIds: [ids.student, ids.registration],
    };

    expect(getCredentialAudienceKey(audience)).toBe(
      getCredentialAudienceKey({ ...audience, studentIds: [...audience.studentIds] }),
    );
    expect(getCredentialAudienceKey(audience)).not.toBe(
      getCredentialAudienceKey({ ...audience, studentIds: [ids.registration] }),
    );
  });
});
