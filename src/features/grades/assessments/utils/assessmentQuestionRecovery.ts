export const PARTIAL_QUESTION_CREATION_RECOVERY = "question-save-failed";

interface SearchParamsReader {
  get(name: string): string | null;
}

export interface PartialQuestionCreationFailure {
  failedQuestionNumber: number;
}

export function getPartialQuestionCreationFailure(
  searchParams: SearchParamsReader,
): PartialQuestionCreationFailure | null {
  if (searchParams.get("recovery") !== PARTIAL_QUESTION_CREATION_RECOVERY) {
    return null;
  }

  const failedQuestionNumber = Number(searchParams.get("failedQuestionNumber"));
  return Number.isInteger(failedQuestionNumber) && failedQuestionNumber > 0
    ? { failedQuestionNumber }
    : null;
}
