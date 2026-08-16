import { afterEach, describe, expect, it, vi } from "vitest";
import type { LessonPlansAdapter } from "../lessonPlansAdapter";
import {
  autoPlanLessons,
  getLessonPlanValidation,
  resetLessonPlansAdapter,
  setLessonPlansAdapter,
} from "../lessonPlansService";

afterEach(resetLessonPlansAdapter);
describe("lesson plans service", () => {
  it("delegates workflow calls without section-scoped arguments", async () => {
    const autoPlan = vi.fn().mockResolvedValue({ dryRun: true });
    const getValidation = vi.fn().mockResolvedValue({ issues: [] });
    setLessonPlansAdapter({
      autoPlan,
      getValidation,
    } as unknown as LessonPlansAdapter);
    const preview = {
      termId: "term-1",
      teacherSubjectAllocationId: "allocation-1",
      dryRun: true,
    };
    const validation = {
      termId: "term-1",
      teacherSubjectAllocationId: "allocation-1",
    };
    await autoPlanLessons(preview);
    await getLessonPlanValidation(validation);
    expect(autoPlan).toHaveBeenCalledWith(preview);
    expect(getValidation).toHaveBeenCalledWith(validation);
  });
});
