import { listHomeworkAssignments } from "@/features/academics/homework/services/homeworkService";
import type { HomeworkAssignmentUiModel } from "@/features/academics/homework/services/homeworkApi.types";
import { fetchAssessments } from "@/features/grades/overview/services/gradesOverviewService";
import type { Assessment } from "@/features/grades/shared/types";
import type { AcademicContentDetail } from "../types/contracts";
import {
  academicContentUiError,
  type AcademicContentUiError,
} from "./academicContentErrors";

export interface WeeklyPlanDetailOptions {
  homeworkAssignments: HomeworkAssignmentUiModel[];
  assessments: Assessment[];
  errors: {
    homeworkAssignments: AcademicContentUiError | null;
    assessments: AcademicContentUiError | null;
  };
}

export const EMPTY_WEEKLY_PLAN_DETAIL_OPTIONS: WeeklyPlanDetailOptions = {
  homeworkAssignments: [],
  assessments: [],
  errors: { homeworkAssignments: null, assessments: null },
};

export async function loadWeeklyPlanDetailOptions(
  content: AcademicContentDetail,
): Promise<WeeklyPlanDetailOptions> {
  const [homeworkResponse, assessmentResponse] = await Promise.allSettled([
    listHomeworkAssignments({
      academicYearId: content.academicYearId,
      termId: content.termId,
      page: 1,
      limit: 100,
    }),
    fetchAssessments(content.academicYearId, content.termId, {
      scopeType: "school",
      includeDrafts: true,
    }),
  ]);

  return {
    homeworkAssignments:
      homeworkResponse.status === "fulfilled"
        ? homeworkResponse.value.items
        : [],
    assessments:
      assessmentResponse.status === "fulfilled" ? assessmentResponse.value : [],
    errors: {
      homeworkAssignments:
        homeworkResponse.status === "rejected"
          ? academicContentUiError(homeworkResponse.reason)
          : null,
      assessments:
        assessmentResponse.status === "rejected"
          ? academicContentUiError(assessmentResponse.reason)
          : null,
    },
  };
}
