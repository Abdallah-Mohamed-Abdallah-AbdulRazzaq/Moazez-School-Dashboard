export function distributeQuestionPoints(
  maxScore: number,
  questionIds: string[],
): Array<{ questionId: string; points: number }> {
  const precision = 100;
  const totalUnits = Math.round(maxScore * precision);
  const baseUnits = Math.floor(totalUnits / questionIds.length);
  const remainderUnits = totalUnits % questionIds.length;

  return questionIds.map((questionId, index) => ({
    questionId,
    points: (baseUnits + (index < remainderUnits ? 1 : 0)) / precision,
  }));
}
