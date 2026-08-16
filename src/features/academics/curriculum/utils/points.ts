import { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import { PointsSummary } from "../types/types";

export function calculatePointsSummary(
  maxScore: number,
  questions: AssignmentQuestion[]
): PointsSummary {
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
  const difference = maxScore - totalPoints;

  return {
    maxScore,
    totalPoints,
    difference,
    isMatch: difference === 0,
  };
}

export function distributePointsEvenly(
  maxScore: number,
  questionCount: number
): number[] {
  if (questionCount === 0) return [];

  const pointsPerQuestion = Math.floor(maxScore / questionCount);
  const remainder = maxScore % questionCount;

  return Array.from({ length: questionCount }, (_, index) =>
    index < remainder ? pointsPerQuestion + 1 : pointsPerQuestion
  );
}
