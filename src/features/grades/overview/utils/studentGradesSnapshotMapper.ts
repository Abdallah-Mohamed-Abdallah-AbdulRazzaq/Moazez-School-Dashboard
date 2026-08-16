import type {
  BackendStudentGradeSnapshot,
  BackendStudentGradeSnapshotAssessment,
  StudentGradesSnapshot,
  StudentSubjectGradeSummary,
} from "@/features/grades/shared/types";

export function mapBackendStudentGradeSnapshot(
  snapshot: BackendStudentGradeSnapshot,
): StudentGradesSnapshot {
  const subjectRows = snapshot.subjects.map((subject) =>
    mapSubjectRow(subject, snapshot.assessments),
  );

  const validFinalPercents = snapshot.subjects
    .map((subject) => subject.finalPercent)
    .filter((value): value is number => value !== null && Number.isFinite(value));

  return {
    studentId: snapshot.studentId,
    academicYearId: snapshot.academicYearId,
    termId: snapshot.termId,
    rule: snapshot.rule,
    status: snapshot.status,
    completedWeight: snapshot.completedWeight,
    subjectRows,
    assessments: snapshot.assessments,
    currentAverage: snapshot.finalPercent ?? (validFinalPercents.length > 0 ? average(validFinalPercents) : null),
    highestAverage: validFinalPercents.length > 0 ? Math.max(...validFinalPercents) : 0,
    lowestAverage: validFinalPercents.length > 0 ? Math.min(...validFinalPercents) : 0,
    totalAssessments: snapshot.assessments.length,
    performanceTrend: buildPerformanceTrend(snapshot.assessments),
  };
}

function mapSubjectRow(
  subject: BackendStudentGradeSnapshot["subjects"][number],
  assessments: BackendStudentGradeSnapshotAssessment[],
): StudentSubjectGradeSummary {
  const scores = assessments
    .filter((assessment) => assessment.subjectId === subject.subjectId)
    .filter((assessment) => assessment.percent !== null)
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((assessment) => assessment.percent as number);

  return {
    subjectId: subject.subjectId,
    subjectName: subject.subjectNameEn || subject.subjectName,
    subjectNameAr: subject.subjectNameAr || subject.subjectName,
    subjectNameEn: subject.subjectNameEn || subject.subjectName,
    average: subject.finalPercent,
    lastAssessmentScore: scores.length > 0 ? scores[scores.length - 1] : null,
    assessmentsCount: subject.assessmentCount,
    assessmentCount: subject.assessmentCount,
    enteredCount: subject.enteredCount,
    missingCount: subject.missingCount,
    absentCount: subject.absentCount,
    completedWeight: subject.completedWeight,
    status: subject.status,
    trend: getTrend(scores),
  };
}

function buildPerformanceTrend(
  assessments: BackendStudentGradeSnapshotAssessment[],
): StudentGradesSnapshot["performanceTrend"] {
  return assessments
    .filter((assessment) => assessment.percent !== null)
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((assessment, index) => ({
      label: assessment.title || assessment.date || `A${index + 1}`,
      average: assessment.percent ?? 0,
    }));
}

function getTrend(scores: number[]): "up" | "down" | "stable" {
  if (scores.length < 2) return "stable";

  const diff = scores[scores.length - 1] - scores[0];

  if (diff > 2) return "up";
  if (diff < -2) return "down";
  return "stable";
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
