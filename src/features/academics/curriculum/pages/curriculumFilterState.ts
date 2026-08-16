export function curriculumOptionsContextKey(yearId: string, termId: string) {
  return `${yearId}:${termId}`;
}

export function canSyncCurriculumFilters(
  loadedContextKey: string | null,
  yearId: string,
  termId: string,
) {
  return loadedContextKey === curriculumOptionsContextKey(yearId, termId);
}

interface CurriculumPageVisibilityInput {
  isInitializing: boolean;
  isOptionsLoading: boolean;
  isCurriculumLoading: boolean;
  hasScope: boolean;
  hasCheckedCurriculum: boolean;
  hasCurriculum: boolean;
  hasCurriculumError: boolean;
}

export function curriculumPageVisibility(input: CurriculumPageVisibilityInput) {
  const isPageLoading =
    input.isInitializing ||
    input.isOptionsLoading ||
    (input.hasScope &&
      (input.isCurriculumLoading || !input.hasCheckedCurriculum));
  const checkedEmptyScope =
    !isPageLoading &&
    input.hasScope &&
    input.hasCheckedCurriculum &&
    !input.hasCurriculum;

  return {
    isPageLoading,
    canShowCreateCurriculum: checkedEmptyScope && !input.hasCurriculumError,
    canShowCurriculumError: checkedEmptyScope && input.hasCurriculumError,
  };
}
