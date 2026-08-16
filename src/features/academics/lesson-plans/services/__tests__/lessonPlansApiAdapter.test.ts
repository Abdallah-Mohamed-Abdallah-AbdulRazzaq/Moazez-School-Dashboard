import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { lessonPlansApiAdapter } from "../lessonPlansApiAdapter";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

describe("lesson plans API adapter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses allocation-scoped list and workflow routes", async () => {
    vi.mocked(apiGet)
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({
        termId: "term-1",
        academicYearId: "year-1",
        weeks: [],
      });
    await lessonPlansApiAdapter.listLessonPlans({
      termId: "term-1",
      teacherSubjectAllocationId: "allocation-1",
    });
    await lessonPlansApiAdapter.listWeeks({
      termId: "term-1",
      teacherSubjectAllocationId: "allocation-1",
    });
    expect(apiGet).toHaveBeenNthCalledWith(
      1,
      "/academics/lesson-plans?termId=term-1&teacherSubjectAllocationId=allocation-1",
    );
    expect(apiGet).toHaveBeenNthCalledWith(
      2,
      "/academics/lesson-plans/weeks?termId=term-1&teacherSubjectAllocationId=allocation-1",
    );
  });

  it("uses every supported item mutation route", async () => {
    vi.mocked(apiPatch).mockResolvedValue({});
    vi.mocked(apiPost).mockResolvedValue({});
    vi.mocked(apiDelete).mockResolvedValue({ ok: true });
    await lessonPlansApiAdapter.moveLessonPlanItem("item-1", {
      weekIndex: 3,
      plannedDate: "2026-09-16",
      timetableEntryId: "entry-1",
      sortOrder: 0,
    });
    await lessonPlansApiAdapter.createLessonPlanItem({
      lessonPlanId: "plan-1",
      payload: { unitId: "unit-1", lessonId: "lesson-1" },
    });
    await lessonPlansApiAdapter.updateLessonPlanItem({
      lessonPlanId: "plan-1",
      itemId: "item-1",
      payload: { notes: "Updated" },
    });
    await lessonPlansApiAdapter.reorderLessonPlanItem({
      lessonPlanId: "plan-1",
      itemId: "item-1",
      payload: { sortOrder: 2 },
    });
    await lessonPlansApiAdapter.skipLessonPlanItem({
      lessonPlanId: "plan-1",
      itemId: "item-1",
      payload: { note: "Holiday" },
    });
    await lessonPlansApiAdapter.cancelLessonPlanItem({
      lessonPlanId: "plan-1",
      itemId: "item-1",
      payload: { note: "Changed schedule" },
    });
    await lessonPlansApiAdapter.startLessonPlanItem({
      lessonPlanId: "plan-1",
      itemId: "item-1",
    });
    await lessonPlansApiAdapter.completeLessonPlanItem({
      lessonPlanId: "plan-1",
      itemId: "item-1",
    });
    await lessonPlansApiAdapter.deleteLessonPlanItem({
      lessonPlanId: "plan-1",
      itemId: "item-1",
    });
    expect(apiPatch).toHaveBeenNthCalledWith(
      1,
      "/academics/lesson-plans/items/item-1/move",
      {
        weekIndex: 3,
        plannedDate: "2026-09-16",
        timetableEntryId: "entry-1",
        sortOrder: 0,
      },
    );
    expect(apiPatch).toHaveBeenNthCalledWith(
      2,
      "/academics/lesson-plans/plan-1/items/item-1",
      { notes: "Updated" },
    );
    expect(apiPatch).toHaveBeenNthCalledWith(
      3,
      "/academics/lesson-plans/plan-1/items/item-1/reorder",
      { sortOrder: 2 },
    );
    expect(apiPost).toHaveBeenCalledWith(
      "/academics/lesson-plans/plan-1/items",
      { unitId: "unit-1", lessonId: "lesson-1" },
    );
    expect(apiPost).toHaveBeenCalledWith(
      "/academics/lesson-plans/plan-1/items/item-1/skip",
      { note: "Holiday" },
    );
    expect(apiPost).toHaveBeenCalledWith(
      "/academics/lesson-plans/plan-1/items/item-1/cancel",
      { note: "Changed schedule" },
    );
    expect(apiPost).toHaveBeenCalledWith(
      "/academics/lesson-plans/plan-1/items/item-1/start",
      undefined,
    );
    expect(apiPost).toHaveBeenCalledWith(
      "/academics/lesson-plans/plan-1/items/item-1/complete",
      undefined,
    );
    expect(apiDelete).toHaveBeenCalledWith(
      "/academics/lesson-plans/plan-1/items/item-1",
    );
  });

  it("uses auto-plan, validation, and plan lifecycle routes", async () => {
    const planResponse = {
      id: "plan-1",
      lessonPlanId: "plan-1",
      academicYearId: "year-1",
      termId: "term-1",
      teacherSubjectAllocationId: "allocation-1",
      teacherUserId: "teacher-1",
      classroomId: "class-1",
      subjectId: "subject-1",
      curriculumId: "curriculum-1",
      title: "Plan",
      description: null,
      status: "draft",
      weekStartDate: "2026-09-01",
      weekEndDate: "2026-09-07",
      updatedAt: "2026-09-01",
      items: [],
    };
    vi.mocked(apiPatch).mockResolvedValue(planResponse);
    vi.mocked(apiPost).mockResolvedValue(planResponse);
    vi.mocked(apiGet).mockResolvedValue({
      termId: "term-1",
      academicYearId: "year-1",
      summary: {},
      issues: [],
    });
    vi.mocked(apiDelete).mockResolvedValue({ ok: true });
    const updated = await lessonPlansApiAdapter.updateLessonPlan("plan-1", {
      title: "Updated",
    });
    await lessonPlansApiAdapter.activateLessonPlan("plan-1");
    await lessonPlansApiAdapter.archiveLessonPlan("plan-1");
    await lessonPlansApiAdapter.deleteLessonPlan("plan-1");
    await lessonPlansApiAdapter.getValidation({
      termId: "term-1",
      teacherSubjectAllocationId: "allocation-1",
    });
    await lessonPlansApiAdapter.autoPlan({
      termId: "term-1",
      teacherSubjectAllocationId: "allocation-1",
      dryRun: true,
    });
    await lessonPlansApiAdapter.autoPlan({
      termId: "term-1",
      teacherSubjectAllocationId: "allocation-1",
      dryRun: false,
    });
    expect(updated.items).toEqual([]);
    expect(apiPatch).toHaveBeenCalledWith("/academics/lesson-plans/plan-1", {
      title: "Updated",
    });
    expect(apiPost).toHaveBeenCalledWith(
      "/academics/lesson-plans/plan-1/activate",
    );
    expect(apiPost).toHaveBeenCalledWith(
      "/academics/lesson-plans/plan-1/archive",
    );
    expect(apiDelete).toHaveBeenCalledWith("/academics/lesson-plans/plan-1");
    expect(apiGet).toHaveBeenCalledWith(
      "/academics/lesson-plans/validation?termId=term-1&teacherSubjectAllocationId=allocation-1",
    );
    expect(apiPost).toHaveBeenCalledWith("/academics/lesson-plans/auto-plan", {
      termId: "term-1",
      teacherSubjectAllocationId: "allocation-1",
      dryRun: true,
    });
    expect(apiPost).toHaveBeenCalledWith("/academics/lesson-plans/auto-plan", {
      termId: "term-1",
      teacherSubjectAllocationId: "allocation-1",
      dryRun: false,
    });
  });
});
