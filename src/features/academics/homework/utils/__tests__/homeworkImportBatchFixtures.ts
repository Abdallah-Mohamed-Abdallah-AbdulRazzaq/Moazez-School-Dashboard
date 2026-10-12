import type { HomeworkBatchContext } from "../homeworkImportBatch.types";
import type { HomeworkImportMetadata } from "@/features/academics/shared/excel-import/types";

const uuid = (suffix: number) => `10000000-0000-4000-8000-${String(suffix).padStart(12, "0")}`;
export const batchIds = {
  year: uuid(1), term: uuid(2), subject: uuid(3), otherSubject: uuid(4),
  stageA: uuid(10), stageB: uuid(11), gradeA: uuid(20), gradeB: uuid(21), gradeC: uuid(22),
  sectionA: uuid(30), sectionB: uuid(31), sectionC: uuid(32), sectionD: uuid(33),
  classA: uuid(40), classB: uuid(41), classC: uuid(42), classD: uuid(43),
  allocationA: uuid(50), allocationB: uuid(51), teacherA: uuid(60), teacherB: uuid(61),
};
const fixtureName = (name: string) => ({ name, nameEn: name, nameAr: `ع ${name}` });
export const batchMetadata: HomeworkImportMetadata = {
  title: "Practice", dueAt: "2099-01-02T12:00:00Z", mode: "homework", isGraded: true, totalMarks: 2,
};

export function batchContext(): HomeworkBatchContext {
  const ids = batchIds;
  const classrooms = [ids.classA, ids.classB, ids.classC, ids.classD];
  const sections = [ids.sectionA, ids.sectionB, ids.sectionC, ids.sectionD];
  return {
    structure: {
      stages: [ids.stageA, ids.stageB].map((id, index) => ({ id, ...fixtureName(`Stage ${index + 1}`), order: index + 1 })),
      grades: [ids.gradeA, ids.gradeB, ids.gradeC].map((id, index) => ({ id, ...fixtureName(`Grade ${index + 1}`), stageId: index < 2 ? ids.stageA : ids.stageB, capacity: 100, order: index + 1 })),
      sections: sections.map((id, index) => ({ id, ...fixtureName(`Section ${index + 1}`), gradeId: index < 2 ? ids.gradeA : index === 2 ? ids.gradeB : ids.gradeC, capacity: 100, order: index + 1 })),
      classrooms: classrooms.map((id, index) => ({ id, ...fixtureName(`Room ${index + 1}`), sectionId: sections[index], capacity: 30, order: index + 1 })),
    },
    subjects: [{ id: ids.subject, ...fixtureName("Math"), code: null, color: null, isActive: true }],
    allocations: classrooms.map((classroomId, index) => ({ id: uuid(50 + index), termId: ids.term, classroomId, sectionId: sections[index], subjectId: ids.subject, teacherId: uuid(60 + index), teacherName: `Teacher ${index + 1}` })),
    enrollments: classrooms.map((classroomId, index) => ({ id: uuid(80 + index), enrollmentId: uuid(80 + index), studentId: uuid(70 + index), academicYearId: ids.year, academicYear: "2099", grade: "Grade", section: "Section", classroomId, enrollmentDate: "2099-01-01", status: "active" })),
  };
}

export function batchHttpResponse(path: string, context: HomeworkBatchContext) {
  if (path === "/academics/subjects") return context.subjects;
  if (path === "/academics/allocations") return { items: context.allocations.map(allocation => ({ id: allocation.id, term: { id: allocation.termId }, classroom: { id: allocation.classroomId, sectionId: allocation.sectionId }, subject: { id: allocation.subjectId }, teacher: allocation.teacherId ? { id: allocation.teacherId, fullName: allocation.teacherName } : null })) };
  if (path.startsWith("/students-guardians/enrollments")) return context.enrollments;
  if (path.startsWith("/students-guardians/students")) return { items: context.enrollments.map(enrollment => ({ id: enrollment.studentId, full_name_en: "Student", student_id: "S1" })) };
  if (path.startsWith("/settings/roles")) return { items: [], pagination: { page: 1, limit: 100, total: 0 } };
  if (path.endsWith("/all")) return { academicYearId: batchIds.year, termId: batchIds.term, publishedAt: null, isPublished: false, items: [] };
  throw new Error(`Unexpected GET ${path}`);
}
