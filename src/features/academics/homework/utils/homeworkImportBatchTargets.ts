import type { Classroom, StructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import type { HomeworkDraftMetadata } from "./homeworkQuestionDraft.types";
import type { CreateHomeworkAssignmentRequest } from "../services/homeworkApi.types";
import type { HomeworkBatchContext, HomeworkBatchEligibleRow, HomeworkBatchPlan, HomeworkBatchRow, HomeworkBatchSelection } from "./homeworkImportBatch.types";

interface BatchPlanRequest {
  academicYearId: string;
  termId: string;
  subjectId: string;
  selection: HomeworkBatchSelection;
  context: HomeworkBatchContext;
  locale: string;
}
function structureName(record: { name: string; nameAr: string; nameEn: string }, locale: string): string {
  return (locale === "ar" ? record.nameAr || record.nameEn : record.nameEn || record.nameAr) || record.name;
}
function classroomParents(classroom: Classroom, structure: StructureTree) {
  const section = structure.sections.find(candidate => candidate.id === classroom.sectionId);
  const grade = structure.grades.find(candidate => candidate.id === section?.gradeId);
  const stage = structure.stages.find(candidate => candidate.id === grade?.stageId);
  return { section, grade, stage };
}
function groupClassroomIds(selection: Exclude<HomeworkBatchSelection, { type: "classes" | "teacher" }>, structure: StructureTree): string[] {
  if (selection.type === "school") return structure.classrooms.map(classroom => classroom.id);
  const groups = { section: structure.sections, grade: structure.grades, stage: structure.stages };
  if (!groups[selection.type].some(group => group.id === selection.id)) return [];
  return structure.classrooms.filter(classroom => {
    const parents = classroomParents(classroom, structure);
    return selection.type === "section" ? classroom.sectionId === selection.id
      : selection.type === "grade" ? parents.section?.gradeId === selection.id : parents.grade?.stageId === selection.id;
  }).map(classroom => classroom.id);
}
function activeStudentCount(classroomId: string, request: BatchPlanRequest): number {
  return new Set(request.context.enrollments.filter(enrollment => enrollment.academicYearId === request.academicYearId
    && enrollment.status === "active" && enrollment.classroomId === classroomId).map(enrollment => enrollment.studentId)).size;
}
function classroomAllocations(classroomId: string, request: BatchPlanRequest) {
  return [...new Map(request.context.allocations.filter(allocation => allocation.termId === request.termId
    && allocation.subjectId === request.subjectId && allocation.classroomId === classroomId)
    .map(allocation => [allocation.id, allocation])).values()];
}
function classroomPlanRow(classroomId: string, request: BatchPlanRequest): HomeworkBatchRow {
  const classroom = request.context.structure.classrooms.find(candidate => candidate.id === classroomId);
  const base = { classroomId, classroomName: classroom ? structureName(classroom, request.locale) : "", hierarchy: "", studentCount: activeStudentCount(classroomId, request) };
  if (!classroom) return { ...base, eligible: false, skipReason: "missingClass" };
  const parents = classroomParents(classroom, request.context.structure);
  if (!parents.section || !parents.grade || !parents.stage) return { ...base, eligible: false, skipReason: "invalidStructure" };
  base.hierarchy = [parents.stage, parents.grade, parents.section].map(parent => structureName(parent, request.locale)).join(" / ");
  const allocations = classroomAllocations(classroomId, request);
  if (!allocations.length) return { ...base, eligible: false, skipReason: "missingAllocation" };
  if (allocations.length > 1) return { ...base, eligible: false, skipReason: "ambiguousAllocation" };
  const allocation = allocations[0];
  if (!allocation.teacherId) return { ...base, eligible: false, skipReason: "missingTeacher" };
  if (request.selection.type === "teacher" && allocation.teacherId !== request.selection.teacherUserId)
    return { ...base, eligible: false, skipReason: "missingAllocation" };
  if (!base.studentCount) return { ...base, eligible: false, skipReason: "noStudents", teacherName: allocation.teacherName };
  return { ...base, eligible: true, allocationId: allocation.id, teacherUserId: allocation.teacherId, teacherName: allocation.teacherName ?? "" };
}
function planSignature(plan: Omit<HomeworkBatchPlan, "signature">): string {
  const rows = [...plan.rows].sort((left, right) => left.classroomId.localeCompare(right.classroomId));
  return JSON.stringify([plan.academicYearId, plan.termId, plan.subjectId, rows.map(row => [row.classroomId, row.studentCount,
    row.eligible ? [row.allocationId, row.teacherUserId] : row.skipReason])]);
}
export function homeworkBatchPlan(request: BatchPlanRequest): HomeworkBatchPlan {
  const validContext = Boolean(request.academicYearId && request.termId && request.context.subjects.some(subject => subject.id === request.subjectId));
  const selection = request.selection;
  const ids = selection.type === "teacher" ? selection.classroomIds.filter(id => !selection.excludedClassroomIds.includes(id))
    : selection.type === "classes" ? selection.classroomIds : groupClassroomIds(selection, request.context.structure);
  const rows = validContext ? [...new Set(ids)].map(classroomId => classroomPlanRow(classroomId, request)) : [];
  rows.sort((left, right) => `${left.hierarchy} ${left.classroomName}`.localeCompare(`${right.hierarchy} ${right.classroomName}`, request.locale));
  const plan = { academicYearId: request.academicYearId, termId: request.termId, subjectId: request.subjectId, rows };
  return { ...plan, signature: planSignature(plan) };
}
export function homeworkBatchPayload(request: {
  plan: HomeworkBatchPlan;
  target: HomeworkBatchEligibleRow;
  metadata: HomeworkDraftMetadata;
  publishAt?: string | null;
}): CreateHomeworkAssignmentRequest {
  const { plan, target, metadata, publishAt } = request;
  return {
    academicYearId: plan.academicYearId, termId: plan.termId, teacherSubjectAllocationId: target.allocationId,
    targetMode: "classroom", title: metadata.title.trim(), dueAt: metadata.dueAt,
    description: metadata.description?.trim() || undefined, mode: metadata.mode, publishAt,
    estimatedMinutes: metadata.estimatedMinutes, totalMarks: metadata.totalMarks, isGraded: metadata.isGraded,
  };
}
