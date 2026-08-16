/**
 * Auto-distribute points algorithm for assignment questions
 * 
 * Distributes maxScore across questions while preserving relative weights
 * and ensuring the sum equals maxScore exactly.
 */

export interface QuestionWithPoints {
  id: string;
  points: number;
  order: number;
}

export interface DistributedPoints {
  id: string;
  points: number;
}

/**
 * Distributes points across questions to match maxScore
 * 
 * Algorithm:
 * 1. If all questions have 0 points: distribute evenly
 * 2. If questions have points: scale proportionally
 * 3. Use floor + remainder distribution to ensure exact sum
 * 
 * @param maxScore - Target total score
 * @param questions - Array of questions with current points
 * @returns Array of question IDs with new points
 */
export function distributePoints(
  maxScore: number,
  questions: QuestionWithPoints[]
): DistributedPoints[] {
  // Edge cases
  if (questions.length === 0) {
    return [];
  }

  if (maxScore < 0) {
    maxScore = 0;
  }

  // If maxScore is 0, set all points to 0
  if (maxScore === 0) {
    return questions.map(q => ({ id: q.id, points: 0 }));
  }

  const currentSum = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  // Case 1: All questions have 0 points - distribute evenly
  if (currentSum === 0) {
    return distributeEvenly(maxScore, questions);
  }

  // Case 2: Questions have points - scale proportionally
  return distributeProportionally(maxScore, questions, currentSum);
}

/**
 * Distributes points evenly when all questions start with 0
 */
function distributeEvenly(
  maxScore: number,
  questions: QuestionWithPoints[]
): DistributedPoints[] {
  const n = questions.length;
  const base = Math.floor(maxScore / n);
  const remainder = maxScore % n;

  // Sort by order for stable distribution
  const sorted = [...questions].sort((a, b) => a.order - b.order);

  return sorted.map((q, index) => ({
    id: q.id,
    points: base + (index < remainder ? 1 : 0),
  }));
}

/**
 * Distributes points proportionally based on current weights
 */
function distributeProportionally(
  maxScore: number,
  questions: QuestionWithPoints[],
  currentSum: number
): DistributedPoints[] {
  // Calculate proportional floats
  const floats = questions.map(q => ({
    id: q.id,
    order: q.order,
    floatValue: (q.points / currentSum) * maxScore,
  }));

  // Floor all values
  const floored = floats.map(f => ({
    ...f,
    floorValue: Math.floor(f.floatValue),
    fractional: f.floatValue - Math.floor(f.floatValue),
  }));

  // Calculate remainder to distribute
  const floorSum = floored.reduce((sum, f) => sum + f.floorValue, 0);
  const remainder = maxScore - floorSum;

  // Sort by fractional part (descending), then by order for stable tie-breaking
  const sorted = [...floored].sort((a, b) => {
    if (Math.abs(a.fractional - b.fractional) > 0.0001) {
      return b.fractional - a.fractional;
    }
    return a.order - b.order;
  });

  // Distribute remainder by giving +1 to questions with largest fractional parts
  const result: DistributedPoints[] = [];
  
  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    const bonus = i < remainder ? 1 : 0;
    result.push({
      id: item.id,
      points: item.floorValue + bonus,
    });
  }

  return result;
}

/**
 * Validates that distributed points sum to maxScore
 * Useful for testing
 */
export function validateDistribution(
  maxScore: number,
  distributed: DistributedPoints[]
): boolean {
  const sum = distributed.reduce((total, d) => total + d.points, 0);
  return sum === maxScore && distributed.every(d => d.points >= 0);
}
