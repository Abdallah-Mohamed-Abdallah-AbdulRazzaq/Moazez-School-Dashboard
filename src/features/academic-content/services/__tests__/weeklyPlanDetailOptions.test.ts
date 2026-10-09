import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AcademicContentDetail } from "../../types/contracts";
import { loadWeeklyPlanDetailOptions } from "../weeklyPlanDetailOptions";
import {
  referenceTarget,
  referenceTargetOptions,
} from "./academicContentReferenceScope.fixture";

const mocks = vi.hoisted(() => ({
  listHomeworkAssignments: vi.fn(),
  fetchAssessments: vi.fn(),
  fetchStructureTree: vi.fn(),
}));

vi.mock("@/features/academics/homework/services/homeworkService", () => ({
  listHomeworkAssignments: mocks.listHomeworkAssignments,
}));
vi.mock("@/features/grades/overview/services/gradesOverviewService", () => ({
  fetchAssessments: mocks.fetchAssessments,
}));
vi.mock(
  "@/features/academics/academic-structure-tree/services/structureService",
  () => ({ fetchStructureTree: mocks.fetchStructureTree }),
);

const content = {
  id: "content-1",
  academicYearId: "year-1",
  termId: "term-1",
  type: "WEEKLY_PLAN",
  audience: "STUDENTS",
  title: "Plan",
  description: null,
  status: "DRAFT",
  archivedAt: null,
  createdAt: "2026-10-05T08:00:00.000Z",
  updatedAt: "2026-10-05T08:00:00.000Z",
  latestPublicationId: null,
  publicationStatus: null,
  publishAt: null,
  visibleFrom: null,
  visibleUntil: null,
  targets: [{ id: "target-1", ...referenceTarget("CLASSROOM", "class-1") }],
  assets: [],
  links: [],
  tags: [],
  details: null,
} satisfies AcademicContentDetail;

describe("loadWeeklyPlanDetailOptions", () => {
  beforeEach(() => {
    mocks.fetchStructureTree
      .mockReset()
      .mockResolvedValue(referenceTargetOptions.structure);
    mocks.listHomeworkAssignments.mockReset().mockResolvedValue({
      items: [
        {
          id: "homework-1",
          title: "Homework",
          classroomId: "class-1",
          subjectId: "subject-1",
        },
      ],
      meta: {},
    });
    mocks.fetchAssessments.mockReset().mockResolvedValue([
      {
        id: "assessment-1",
        title: "Assessment",
        scopeType: "classroom",
        classroomId: "class-1",
        subjectId: "subject-1",
      },
    ]);
  });

  it("loads compatible weekly plan homework and assessment references", async () => {
    const options = await loadWeeklyPlanDetailOptions(content);

    expect(mocks.listHomeworkAssignments).toHaveBeenCalledWith({
      academicYearId: "year-1",
      termId: "term-1",
      page: 1,
      limit: 100,
    });
    expect(mocks.fetchAssessments).toHaveBeenCalledWith("year-1", "term-1", {
      includeDrafts: true,
    });
    expect(options.homeworkAssignments.map(({ id }) => id)).toEqual([
      "homework-1",
    ]);
    expect(options.assessments.map(({ id }) => id)).toEqual(["assessment-1"]);
  });

  it("isolates homework failure from assessment options", async () => {
    mocks.listHomeworkAssignments.mockRejectedValue(
      new Error("Homework unavailable"),
    );

    const options = await loadWeeklyPlanDetailOptions(content);

    expect(options.homeworkAssignments).toEqual([]);
    expect(options.errors.homeworkAssignments?.message).toBe(
      "This action could not be completed. Try again; contact support if the problem continues.",
    );
    expect(options.assessments.map(({ id }) => id)).toEqual(["assessment-1"]);
    expect(options.errors.assessments).toBeNull();
  });

  it("combines each scope with its own subject without allowing cross-scope references", async () => {
    const multiScope = {
      ...content,
      targets: [
        ...content.targets,
        { id: "target-2", ...referenceTarget("STAGE", "stage-2", "subject-2") },
      ],
    };
    mocks.listHomeworkAssignments.mockResolvedValue({
      items: [
        { id: "first", classroomId: "class-1", subjectId: "subject-1" },
        { id: "second", classroomId: "class-3", subjectId: "subject-2" },
        { id: "wrong-grade", classroomId: "class-2", subjectId: "subject-1" },
        { id: "cross-scope", classroomId: "class-1", subjectId: "subject-2" },
      ],
    });
    mocks.fetchAssessments.mockResolvedValue([
      {
        id: "first",
        scopeType: "grade",
        scopeKey: "grade-1",
        subjectId: "subject-1",
      },
      {
        id: "second",
        scopeType: "classroom",
        scopeId: "class-3",
        subjectId: "subject-2",
      },
      {
        id: "wrong-grade",
        scopeType: "grade",
        scopeKey: "grade-2",
        subjectId: "subject-1",
      },
      {
        id: "cross-scope",
        scopeType: "grade",
        scopeKey: "grade-1",
        subjectId: "subject-2",
      },
    ]);
    const options = await loadWeeklyPlanDetailOptions(multiScope);
    expect(options.homeworkAssignments.map(({ id }) => id)).toEqual([
      "first",
      "second",
    ]);
    expect(options.assessments.map(({ id }) => id)).toEqual([
      "first",
      "second",
    ]);
  });

  it("reports hierarchy loading failure instead of exposing unfiltered references", async () => {
    mocks.fetchStructureTree.mockRejectedValue(
      new Error("Hierarchy unavailable"),
    );
    const options = await loadWeeklyPlanDetailOptions(content);
    expect(options.homeworkAssignments).toEqual([]);
    expect(options.assessments).toEqual([]);
    expect(options.errors.homeworkAssignments).not.toBeNull();
    expect(options.errors.assessments).not.toBeNull();
  });
});
