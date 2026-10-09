import type { TeacherDirectoryListItem } from "@/features/teachers/types";
import type { AcademicContentDetailOptions } from "../services/academicContentDetailOptions";
import type { AcademicTargetOptions } from "../services/academicContentSelectors";
import type {
  AcademicContentPreparationDetail,
  AcademicContentTarget,
  ReplaceAcademicContentPreparationDetailRequest,
} from "../types/contracts";

export type TeacherPreparationPanel =
  | "overview"
  | "targets"
  | "objectives"
  | "learningOutcomes"
  | "teachingStrategies"
  | "activities"
  | "resources"
  | "assessment"
  | "teacherNotes"
  | "references"
  | "readiness"
  | "publication"
  | "revisions";

export interface TeacherPreparationPanelDefinition {
  id: TeacherPreparationPanel;
  labelKey: string;
}

export const TEACHER_PREPARATION_PANELS: readonly TeacherPreparationPanelDefinition[] = [
  { id: "overview", labelKey: "overview" },
  { id: "targets", labelKey: "targets" },
  { id: "objectives", labelKey: "objectives" },
  { id: "learningOutcomes", labelKey: "learning_outcomes" },
  { id: "teachingStrategies", labelKey: "teaching_strategies" },
  { id: "activities", labelKey: "activities" },
  { id: "resources", labelKey: "resources" },
  { id: "assessment", labelKey: "assessment" },
  { id: "teacherNotes", labelKey: "teacher_notes" },
  { id: "references", labelKey: "references" },
  { id: "readiness", labelKey: "readiness" },
  { id: "publication", labelKey: "publication" },
  { id: "revisions", labelKey: "revisions" },
] as const;

export interface TeacherPreparationTargetDisplay {
  targetId: string;
  scope: string | null;
  subject: string | null;
  assignedTeacher: string | null;
}

export interface TeacherPreparationReferenceDisplay {
  curriculum: string | null;
  curriculumUnit: string | null;
  curriculumLesson: string | null;
  lessonPlan: string | null;
  lessonPlanItem: string | null;
  timetable: {
    classroom: string;
    subject: string | null;
    teacher: string | null;
    period: string;
    time: string;
    dayOfWeek: number;
  } | null;
}

export function emptyTeacherPreparationDetail(): AcademicContentPreparationDetail {
  return {
    topic: null,
    objectives: [],
    learningOutcomes: [],
    teachingStrategies: [],
    activities: [],
    resourceNotes: null,
    assessmentNotes: null,
    teacherNotes: null,
    curriculumId: null,
    curriculumUnitId: null,
    curriculumLessonId: null,
    lessonPlanId: null,
    lessonPlanItemId: null,
    timetableEntryId: null,
  };
}

function normalizedOrderedValues(values: readonly string[]): string[] {
  return values.map((entry) => entry.trim()).filter(Boolean);
}

export function normalizeTeacherPreparationDetail(
  detail: AcademicContentPreparationDetail,
): ReplaceAcademicContentPreparationDetailRequest {
  return {
    topic: detail.topic?.trim() || null,
    objectives: normalizedOrderedValues(detail.objectives),
    learningOutcomes: normalizedOrderedValues(detail.learningOutcomes),
    teachingStrategies: normalizedOrderedValues(detail.teachingStrategies),
    activities: normalizedOrderedValues(detail.activities),
    resourceNotes: detail.resourceNotes?.trim() || null,
    assessmentNotes: detail.assessmentNotes?.trim() || null,
    teacherNotes: detail.teacherNotes?.trim() || null,
    curriculumId: detail.curriculumId || null,
    curriculumUnitId: detail.curriculumUnitId || null,
    curriculumLessonId: detail.curriculumLessonId || null,
    lessonPlanId: detail.lessonPlanId || null,
    lessonPlanItemId: detail.lessonPlanItemId || null,
    timetableEntryId: detail.timetableEntryId || null,
  };
}

function localizedName(
  entity: { name: string; nameAr?: string; nameEn?: string } | undefined,
  locale: string,
): string | null {
  if (!entity) return null;
  return (locale === "ar" ? entity.nameAr : entity.nameEn) || entity.name;
}

function targetScopeName(
  target: AcademicContentTarget,
  options: AcademicTargetOptions,
  locale: string,
): string | null {
  const { structure } = options;
  if (target.scopeType === "SCHOOL") return null;
  if (target.scopeType === "STAGE") {
    return localizedName(structure.stages.find(({ id }) => id === target.stageId), locale);
  }
  if (target.scopeType === "GRADE") {
    return localizedName(structure.grades.find(({ id }) => id === target.gradeId), locale);
  }
  if (target.scopeType === "SECTION") {
    return localizedName(structure.sections.find(({ id }) => id === target.sectionId), locale);
  }
  return localizedName(
    structure.classrooms.find(({ id }) => id === target.classroomId),
    locale,
  );
}

function assignedTeacherName(
  target: AcademicContentTarget,
  options: AcademicTargetOptions,
  teachers: readonly TeacherDirectoryListItem[],
): string | null {
  const allocation = options.teacherAllocations.find(
    ({ id }) => id === target.teacherSubjectAllocationId,
  );
  if (!allocation?.teacherId) return null;
  return teachers.find(({ userId }) => userId === allocation.teacherId)?.displayName.fullName ?? null;
}

export function resolveTeacherPreparationTargets(
  targets: readonly AcademicContentTarget[],
  options: AcademicTargetOptions,
  teachers: readonly TeacherDirectoryListItem[],
  locale: string,
): TeacherPreparationTargetDisplay[] {
  return targets.map((target) => ({
    targetId: target.id,
    scope: targetScopeName(target, options, locale),
    subject: localizedName(
      options.subjects.find(({ id }) => id === target.subjectId),
      locale,
    ),
    assignedTeacher: assignedTeacherName(target, options, teachers),
  }));
}

function referenceTimetable(
  timetableEntryId: string | null,
  options: AcademicContentDetailOptions,
  locale: string,
): TeacherPreparationReferenceDisplay["timetable"] {
  const entry = options.timetableEntries.find(({ id }) => id === timetableEntryId);
  if (!entry) return null;
  return {
    classroom: locale === "ar" ? entry.classroom.nameAr : entry.classroom.nameEn,
    subject: entry.subject ? (locale === "ar" ? entry.subject.nameAr : entry.subject.nameEn) : null,
    teacher: entry.teacher?.fullName ?? null,
    period: entry.period.label,
    time: `${entry.period.startTime}–${entry.period.endTime}`,
    dayOfWeek: entry.dayOfWeek,
  };
}

export function resolveTeacherPreparationReferences(
  detail: AcademicContentPreparationDetail,
  options: AcademicContentDetailOptions,
  locale: string,
): TeacherPreparationReferenceDisplay {
  const curriculum = options.curricula.find(({ id }) => id === detail.curriculumId);
  const curriculumUnit = curriculum?.units.find(({ id }) => id === detail.curriculumUnitId);
  const curriculumLesson = curriculumUnit?.lessons.find(({ id }) => id === detail.curriculumLessonId);
  const lessonPlan = options.lessonPlans.find(({ id }) => id === detail.lessonPlanId);
  const lessonPlanItem = lessonPlan?.items.find(({ id }) => id === detail.lessonPlanItemId);
  return {
    curriculum: curriculum?.title ?? null,
    curriculumUnit: curriculumUnit?.title ?? null,
    curriculumLesson: curriculumLesson?.title ?? null,
    lessonPlan: lessonPlan?.title ?? null,
    lessonPlanItem: lessonPlanItem?.title || lessonPlanItem?.lessonTitle || null,
    timetable: referenceTimetable(detail.timetableEntryId, options, locale),
  };
}
