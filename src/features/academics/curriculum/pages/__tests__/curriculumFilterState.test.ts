import { describe, expect, it } from "vitest";
import {
  canSyncCurriculumFilters,
  curriculumOptionsContextKey,
  curriculumPageVisibility,
} from "../curriculumFilterState";

describe("curriculum filter URL restoration", () => {
  it("does not synchronize URL filters before options load", () => {
    expect(canSyncCurriculumFilters(null, "year-1", "term-1")).toBe(false);
  });

  it("synchronizes only after options for the current context load", () => {
    const loadedContext = curriculumOptionsContextKey("year-1", "term-1");

    expect(canSyncCurriculumFilters(loadedContext, "year-1", "term-1")).toBe(true);
    expect(canSyncCurriculumFilters(loadedContext, "year-2", "term-1")).toBe(false);
  });
});

describe("curriculum page visibility", () => {
  it("hides create until the scoped curriculum request completes", () => {
    expect(
      curriculumPageVisibility({
        isInitializing: false,
        isOptionsLoading: false,
        isCurriculumLoading: true,
        hasScope: true,
        hasCheckedCurriculum: false,
        hasCurriculum: false,
        hasCurriculumError: false,
      }).canShowCreateCurriculum,
    ).toBe(false);
  });

  it("keeps a scoped page loading before the curriculum request starts", () => {
    expect(
      curriculumPageVisibility({
        isInitializing: false,
        isOptionsLoading: false,
        isCurriculumLoading: false,
        hasScope: true,
        hasCheckedCurriculum: false,
        hasCurriculum: false,
        hasCurriculumError: false,
      }).isPageLoading,
    ).toBe(true);
  });

  it("shows create only after the backend confirms the scope is empty", () => {
    expect(
      curriculumPageVisibility({
        isInitializing: false,
        isOptionsLoading: false,
        isCurriculumLoading: false,
        hasScope: true,
        hasCheckedCurriculum: true,
        hasCurriculum: false,
        hasCurriculumError: false,
      }).canShowCreateCurriculum,
    ).toBe(true);
  });
});
