import { listHomeworkAssignments } from "@/features/academics/homework/services/homeworkService";
import type { HomeworkAssignmentUiModel } from "@/features/academics/homework/services/homeworkApi.types";
import { fetchAssessments } from "@/features/grades/overview/services/gradesOverviewService";
import { fetchSubjects } from "@/features/academics/subjects/services/subjectsService";
import type { AcademicContentDetail } from "../types/contracts";
import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import {
  academicReferenceMatcher,
  assessmentReferenceScope,
} from "./academicContentReferenceScope";
import {
  academicContentUiError,
  type AcademicContentUiError,
} from "./academicContentErrors";
import {
  withAssessmentReferenceNames,
  type AcademicContentAssessmentReference,
} from "./academicContentAssessmentReference";

export interface WeeklyPlanDetailOptions {
  homeworkAssignments: HomeworkAssignmentUiModel[];
  assessments: AcademicContentAssessmentReference[];
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
  const [targetResponse, homeworkResponse, assessmentResponse, subjectResponse] =
    await Promise.allSettled([
      fetchStructureTree(content.academicYearId, content.termId),
      listHomeworkAssignments({
        academicYearId: content.academicYearId,
        termId: content.termId,
        page: 1,
        limit: 100,
      }),
      fetchAssessments(content.academicYearId, content.termId, {
        includeDrafts: true,
      }),
      fetchSubjects(),
    ]);

  if (targetResponse.status === "rejected") {
    const scopeError = academicContentUiError(targetResponse.reason);
    return {
      homeworkAssignments: [],
      assessments: [],
      errors: { homeworkAssignments: scopeError, assessments: scopeError },
    };
  }
  const matchesTarget = academicReferenceMatcher(
    content.targets,
    targetResponse.value,
  );
  const assessmentContext = {
    structure: targetResponse.value,
    subjects: subjectResponse.status === "fulfilled" ? subjectResponse.value : [],
  };

  return {
    homeworkAssignments:
      homeworkResponse.status === "fulfilled"
        ? homeworkResponse.value.items.filter((homework) =>
            matchesTarget({
              scopeType: "CLASSROOM",
              classroomId: homework.classroomId,
              subjectId: homework.subjectId,
            }),
          )
        : [],
    assessments:
      assessmentResponse.status === "fulfilled"
        ? assessmentResponse.value
            .filter((assessment) => matchesTarget(assessmentReferenceScope(assessment)))
            .map((assessment) => withAssessmentReferenceNames(assessment, assessmentContext))
        : [],
    errors: {
      homeworkAssignments:
        homeworkResponse.status === "rejected"
          ? academicContentUiError(homeworkResponse.reason)
          : null,
      assessments:
        assessmentResponse.status === "rejected"
          ? academicContentUiError(assessmentResponse.reason)
          : subjectResponse.status === "rejected"
            ? academicContentUiError(subjectResponse.reason)
            : null,
    },
  };
}
