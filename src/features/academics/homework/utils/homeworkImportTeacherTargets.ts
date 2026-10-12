import type { HomeworkBatchContext } from "./homeworkImportBatch.types";

export function teacherClassroomIds(context: HomeworkBatchContext, termId: string, subjectId: string, teacherUserId: string): string[] {
  return [...new Set(context.allocations.filter(allocation => allocation.termId === termId
    && allocation.subjectId === subjectId && allocation.teacherId === teacherUserId && allocation.classroomId)
    .map(allocation => allocation.classroomId!))];
}

export function teacherTargetOptions(context: HomeworkBatchContext, termId: string) {
  return [...new Map(context.allocations.filter(allocation => allocation.termId === termId && allocation.teacherId)
    .map(allocation => [allocation.teacherId!, { value: allocation.teacherId!, label: allocation.teacherName || allocation.teacherId! }])).values()];
}

export function teacherSubjectIds(context: HomeworkBatchContext, termId: string, teacherUserId: string): string[] {
  return [...new Set(context.allocations.filter(allocation => allocation.termId === termId && allocation.teacherId === teacherUserId)
    .map(allocation => allocation.subjectId))];
}
