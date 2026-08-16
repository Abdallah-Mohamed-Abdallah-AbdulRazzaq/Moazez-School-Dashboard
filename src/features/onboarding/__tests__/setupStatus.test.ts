import { describe, expect, it } from "vitest";
import type { SetupSnapshot } from "../types";
import { evaluateSetup, isSetupSnapshotLoading } from "../utils/setupStatus";

const organization = {
  schoolName: "Moazez School",
  shortName: "MS",
  timezone: "Africa/Cairo",
  addressLine: "",
  formattedAddress: "",
  city: "Cairo",
  country: "Egypt",
  footerSignature: "",
  logoUrl: "",
  latitude: null,
  longitude: null,
  mapPlaceLabel: "",
};

const year = {
  id: "year-1",
  name: "2026-2027",
  startDate: "2026-09-01",
  endDate: "2027-06-30",
  isActive: true,
};

const term = {
  id: "term-1",
  name: "Term 1",
  yearId: year.id,
  status: "open" as const,
  startDate: "2026-09-01",
  endDate: "2027-01-15",
};

const stage = {
  id: "stage-1",
  name: "Primary",
  nameAr: "ابتدائي",
  nameEn: "Primary",
  order: 1,
};

const grade = {
  id: "grade-1",
  name: "Grade 1",
  nameAr: "الأول",
  nameEn: "Grade 1",
  stageId: stage.id,
  capacity: 30,
  order: 1,
};

const section = {
  id: "section-1",
  name: "A",
  nameAr: "أ",
  nameEn: "A",
  gradeId: grade.id,
  capacity: 30,
  order: 1,
};

const classroom = {
  id: "classroom-1",
  name: "Room 101",
  nameAr: "غرفة 101",
  nameEn: "Room 101",
  sectionId: section.id,
  capacity: 30,
  order: 1,
};

const subject = {
  id: "subject-1",
  termId: term.id,
  name: "Mathematics",
  nameAr: "رياضيات",
  nameEn: "Mathematics",
  isActive: true,
};

const room = {
  id: "room-1",
  schoolId: "school-1",
  name: "Room 101",
  nameAr: "غرفة 101",
  nameEn: "Room 101",
  capacity: 30,
  isActive: true,
};

const completeSnapshot: SetupSnapshot = {
  organization: { status: "success", data: organization },
  academicContext: {
    status: "success",
    data: { years: [year], termsByYear: { [year.id]: [term] } },
  },
  structure: {
    status: "success",
    data: { stages: [stage], grades: [grade], sections: [section], classrooms: [classroom] },
  },
  subjects: {
    status: "success",
    data: {
      subjects: [subject],
      allocations: [{ subjectId: subject.id, gradeId: grade.id, weeklyHours: 4 }],
    },
  },
  rooms: { status: "success", data: [room] },
};

const emptySnapshot: SetupSnapshot = {
  organization: { status: "success", data: { ...organization, schoolName: " " } },
  academicContext: { status: "success", data: { years: [], termsByYear: {} } },
  structure: { status: "success", data: { stages: [], grades: [], sections: [], classrooms: [] } },
  subjects: { status: "success", data: { subjects: [], allocations: [] } },
  rooms: { status: "success", data: [] },
};

describe("evaluateSetup", () => {
  it.each([
    {
      name: "one resource is loading",
      snapshot: {
        ...emptySnapshot,
        rooms: { status: "loading", data: [] },
      } as SetupSnapshot,
      expected: true,
    },
    { name: "all resources are settled", snapshot: emptySnapshot, expected: false },
  ])("reports $expected when $name", ({ snapshot, expected }) => {
    expect(isSetupSnapshotLoading(snapshot)).toBe(expected);
  });

  it("marks all steps complete when the minimum real setup chain exists", () => {
    const evaluation = evaluateSetup(completeSnapshot);

    expect(evaluation.completedCount).toBe(5);
    expect(evaluation.totalCount).toBe(5);
    expect(evaluation.progressPercent).toBe(100);
    expect(evaluation.isComplete).toBe(true);
    expect(evaluation.steps.rooms.status).toBe("complete");
  });

  it("locks downstream steps when prerequisites are incomplete", () => {
    const evaluation = evaluateSetup(emptySnapshot);

    expect(evaluation.completedCount).toBe(0);
    expect(evaluation.steps.organization.status).toBe("available");
    expect(evaluation.steps.academicContext.status).toBe("locked");
    expect(evaluation.steps.academicContext.lockedBy).toEqual(["organization"]);
    expect(evaluation.progressPercent).toBe(0);
  });

  it("rejects orphaned academic structure relationships", () => {
    const evaluation = evaluateSetup({
      ...completeSnapshot,
      structure: {
        status: "success",
        data: {
          stages: [stage],
          grades: [{ ...grade, stageId: "missing-stage" }],
          sections: [section],
          classrooms: [],
        },
      },
    });

    expect(evaluation.steps.structure.status).toBe("available");
    expect(evaluation.steps.subjects.status).toBe("locked");
    expect(evaluation.steps.subjects.lockedBy).toEqual(["structure"]);
  });

  it("rejects subject allocations that do not reference an existing subject and grade", () => {
    const evaluation = evaluateSetup({
      ...completeSnapshot,
      subjects: {
        status: "success",
        data: {
          subjects: [subject],
          allocations: [{ subjectId: "missing-subject", gradeId: grade.id, weeklyHours: 4 }],
        },
      },
    });

    expect(evaluation.steps.subjects.status).toBe("available");
    expect(evaluation.steps.rooms.status).toBe("locked");
  });

  it("surfaces resource errors without completing the failed step", () => {
    const evaluation = evaluateSetup({
      ...completeSnapshot,
      rooms: { status: "error", error: "No school selected" },
    });

    expect(evaluation.completedCount).toBe(4);
    expect(evaluation.progressPercent).toBe(80);
    expect(evaluation.steps.rooms.status).toBe("error");
    expect(evaluation.steps.rooms.error).toBe("No school selected");
  });
});
