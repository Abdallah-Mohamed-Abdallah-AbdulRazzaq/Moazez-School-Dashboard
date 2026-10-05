import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AcademicContentDetail } from "../../types/contracts";
import { loadWeeklyPlanDetailOptions } from "../weeklyPlanDetailOptions";

const mocks = vi.hoisted(() => ({
  listHomeworkAssignments: vi.fn(),
  fetchAssessments: vi.fn(),
}));

vi.mock("@/features/academics/homework/services/homeworkService", () => ({
  listHomeworkAssignments: mocks.listHomeworkAssignments,
}));
vi.mock("@/features/grades/overview/services/gradesOverviewService", () => ({
  fetchAssessments: mocks.fetchAssessments,
}));

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
  targets: [],
  assets: [],
  links: [],
  tags: [],
  details: null,
} satisfies AcademicContentDetail;

describe("loadWeeklyPlanDetailOptions", () => {
  beforeEach(() => {
    mocks.listHomeworkAssignments.mockReset().mockResolvedValue({
      items: [{ id: "homework-1", title: "Homework" }],
      meta: {},
    });
    mocks.fetchAssessments.mockReset().mockResolvedValue([
      { id: "assessment-1", title: "Assessment" },
    ]);
  });

  it("loads only weekly plan homework and assessment references", async () => {
    const options = await loadWeeklyPlanDetailOptions(content);

    expect(mocks.listHomeworkAssignments).toHaveBeenCalledWith({
      academicYearId: "year-1",
      termId: "term-1",
      page: 1,
      limit: 100,
    });
    expect(mocks.fetchAssessments).toHaveBeenCalledWith("year-1", "term-1", {
      scopeType: "school",
      includeDrafts: true,
    });
    expect(options.homeworkAssignments.map(({ id }) => id)).toEqual(["homework-1"]);
    expect(options.assessments.map(({ id }) => id)).toEqual(["assessment-1"]);
  });

  it("isolates homework failure from assessment options", async () => {
    mocks.listHomeworkAssignments.mockRejectedValue(new Error("Homework unavailable"));

    const options = await loadWeeklyPlanDetailOptions(content);

    expect(options.homeworkAssignments).toEqual([]);
    expect(options.errors.homeworkAssignments?.message).toBe("Homework unavailable");
    expect(options.assessments.map(({ id }) => id)).toEqual(["assessment-1"]);
    expect(options.errors.assessments).toBeNull();
  });
});
