import { apiGet } from "@/lib/api";
import type { GradesScopeFilters } from "../../shared/types";
import type { GradesAnalyticsReport, GradesDistributionBucket } from "../types";

interface BackendGradesAnalyticsSummaryResponse {
  studentCount: number;
  assessmentCount: number;
  enteredItemCount: number;
  missingItemCount: number;
  absentItemCount: number;
  averagePercent: number | null;
  highestPercent: number | null;
  lowestPercent: number | null;
  passingCount: number;
  failingCount: number;
  incompleteCount: number;
  passRate: number | null;
  completedWeightAverage: number | null;
}

interface BackendGradesDistributionResponse {
  buckets: Array<{
    from: number;
    to: number;
    count: number;
  }>;
  incompleteCount: number;
  totalStudents: number;
}

function buildGradesAnalyticsParams(
  academicYearId: string,
  termId: string,
  filters: GradesScopeFilters,
) {
  return {
    academicYearId,
    termId,
    scopeType: filters.scopeType,
    scopeId: filters.scopeId || undefined,
    subjectId: filters.subjectId,
  };
}

function mapDistributionBuckets(
  response: BackendGradesDistributionResponse,
): GradesDistributionBucket[] {
  return response.buckets.map((bucket) => ({
    label: `${bucket.from}-${bucket.to}`,
    count: bucket.count,
  }));
}

export async function fetchGradesAnalytics(
  academicYearId: string,
  termId: string,
  filters: GradesScopeFilters,
): Promise<GradesAnalyticsReport> {
  const params = buildGradesAnalyticsParams(academicYearId, termId, filters);
  const [summary, distribution] = await Promise.all([
    apiGet<BackendGradesAnalyticsSummaryResponse>("/grades/analytics/summary", {
      params,
    }),
    apiGet<BackendGradesDistributionResponse>("/grades/analytics/distribution", {
      params,
    }),
  ]);

  return {
    kpis: {
      classAverage: summary.averagePercent ?? 0,
      passRate: summary.passRate ?? 0,
      completionRate: summary.completedWeightAverage ?? 0,
      failingStudents: summary.failingCount,
    },
    distribution: mapDistributionBuckets(distribution),
    assessmentPerformance: [],
    topStudents: [],
    lowestStudents: [],
  };
}
