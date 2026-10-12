import {
  getCurriculum,
  listCurricula,
  type Curriculum,
} from "@/features/academics/curriculum/services/curriculumService";
import {
  listLessonPlans,
  getLessonPlan,
  type LessonPlan,
} from "@/features/academics/lesson-plans/services/lessonPlansService";
import { listHomeworkAssignments } from "@/features/academics/homework/services/homeworkService";
import type { HomeworkAssignmentUiModel } from "@/features/academics/homework/services/homeworkApi.types";
import { fetchAssessments } from "@/features/grades/overview/services/gradesOverviewService";
import type { Assessment } from "@/features/grades/shared/types";
import { fetchTimetableConfigs } from "@/features/academics/timetable/services/timetableConfigService";
import { listEntries } from "@/features/academics/timetable/services/timetableApiAdapter";
import type { BackendTimetableEntryDto } from "@/features/academics/timetable/services/timetableApiTypes";
import type { AcademicContentDetail } from "../types/contracts";
import {
  loadAcademicTargetOptions,
  targetLineage,
} from "./academicContentSelectors";
import {
  academicReferenceMatcher,
  assessmentReferenceScope,
} from "./academicContentReferenceScope";

export interface AcademicContentDetailOptions {
  curricula: Curriculum[];
  lessonPlans: LessonPlan[];
  homeworkAssignments: HomeworkAssignmentUiModel[];
  assessments: Assessment[];
  timetableEntries: BackendTimetableEntryDto[];
}

export const EMPTY_ACADEMIC_CONTENT_DETAIL_OPTIONS: AcademicContentDetailOptions =
  {
    curricula: [],
    lessonPlans: [],
    homeworkAssignments: [],
    assessments: [],
    timetableEntries: [],
  };

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

export async function loadAcademicContentDetailOptions(
  content: AcademicContentDetail,
): Promise<AcademicContentDetailOptions> {
  const targetOptions = await loadAcademicTargetOptions({
    academicYearId: content.academicYearId,
    termId: content.termId,
  });
  const timetableContexts = content.targets.map((target) => {
    const lineage = targetLineage(targetOptions, target);
    return {
      academicYearId: content.academicYearId,
      termId: content.termId,
      stageId: lineage.stageId || undefined,
      gradeId: lineage.gradeId || undefined,
      sectionId: lineage.sectionId || undefined,
      classroomId: target.classroomId ?? undefined,
    };
  });
  const matchesTarget = academicReferenceMatcher(
    content.targets,
    targetOptions.structure,
  );
  const [
    curriculumSummaries,
    lessonPlanSummaries,
    homeworkResult,
    assessments,
    configs,
  ] = await Promise.all([
    listCurricula({
      academicYearId: content.academicYearId,
      termId: content.termId,
    }),
    listLessonPlans({
      academicYearId: content.academicYearId,
      termId: content.termId,
    }),
    listHomeworkAssignments({
      academicYearId: content.academicYearId,
      termId: content.termId,
      page: 1,
      limit: 100,
    }),
    fetchAssessments(content.academicYearId, content.termId, {
      includeDrafts: true,
    }),
    Promise.all(
      [
        {
          academicYearId: content.academicYearId,
          termId: content.termId,
        },
        ...timetableContexts,
      ].map(fetchTimetableConfigs),
    ).then((configGroups) => uniqueById(configGroups.flat())),
  ]);

  const relevantCurricula = curriculumSummaries.filter((curriculum) =>
    matchesTarget({
      scopeType: "GRADE",
      subjectId: curriculum.subjectId,
      gradeId: curriculum.gradeId,
    }),
  );
  const curricula = await Promise.all(
    relevantCurricula.map((curriculum) => getCurriculum(curriculum.id)),
  );
  const lessonPlans = await Promise.all(
    lessonPlanSummaries
      .filter((plan) =>
        matchesTarget({
          scopeType: "CLASSROOM",
          classroomId: plan.classroomId,
          subjectId: plan.subjectId,
        }),
      )
      .map((lessonPlan) => getLessonPlan(lessonPlan.id)),
  );
  const entryResponses = await Promise.all(
    configs.map((config) => listEntries({ timetableConfigId: config.id })),
  );
  const timetableEntries = uniqueById(
    entryResponses.flatMap((response) =>
      Array.isArray(response) ? response : response.items,
    ),
  );

  return {
    curricula,
    lessonPlans,
    homeworkAssignments: homeworkResult.items.filter((homework) =>
      matchesTarget({
        scopeType: "CLASSROOM",
        classroomId: homework.classroomId,
        subjectId: homework.subjectId,
      }),
    ),
    assessments: assessments.filter((assessment) =>
      matchesTarget(assessmentReferenceScope(assessment)),
    ),
    timetableEntries: timetableEntries.filter((entry) =>
      matchesTarget({
        scopeType: "CLASSROOM",
        classroomId: entry.classroom.id,
        subjectId: entry.subject?.id,
      }),
    ),
  };
}
