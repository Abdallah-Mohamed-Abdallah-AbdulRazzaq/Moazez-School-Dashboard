export type MultipleSelectionScoringPolicy = "partial_without_penalty" | "partial_with_penalty";

interface MultipleChoiceScoringInput {
  points: number;
  options: readonly { id: string; isCorrect?: boolean }[];
  selectedOptionIds: readonly string[];
  policy?: MultipleSelectionScoringPolicy;
}

export function multipleChoiceScore({ points, options, selectedOptionIds, policy = "partial_with_penalty" }: MultipleChoiceScoringInput): number | null {
  const optionIds = new Set(options.map(option => option.id));
  const correctIds = new Set(options.filter(option => option.isCorrect).map(option => option.id));
  if (!Number.isFinite(points) || points < 0 || !correctIds.size
    || optionIds.has("") || optionIds.size !== options.length
    || new Set(selectedOptionIds).size !== selectedOptionIds.length
    || selectedOptionIds.some(id => !optionIds.has(id))) return null;

  const correctSelectedCount = selectedOptionIds.filter(id => correctIds.has(id)).length;
  const incorrectSelectedCount = selectedOptionIds.length - correctSelectedCount;
  const netCorrectCount = policy === "partial_without_penalty"
    ? correctSelectedCount : Math.max(0, correctSelectedCount - incorrectSelectedCount);
  return Math.round((points * netCorrectCount / correctIds.size + Number.EPSILON) * 100) / 100;
}
