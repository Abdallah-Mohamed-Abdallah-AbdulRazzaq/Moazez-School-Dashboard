import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchSubjects } from "@/features/academics/subjects/services/subjectsService";
import { fetchTeacherAllocations } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { fetchEnrollments } from "@/features/students-guardians/enrollments/services/enrollmentsApiService";
import type { HomeworkBatchContext } from "../utils/homeworkImportBatch.types";

export async function loadHomeworkBatchContext(request: { academicYearId: string; termId: string }): Promise<HomeworkBatchContext> {
  const [structure, subjects, allocations, enrollments] = await Promise.all([
    fetchStructureTree(request.academicYearId, request.termId),
    fetchSubjects(),
    fetchTeacherAllocations(request.termId),
    fetchEnrollments({ academicYearId: request.academicYearId, status: "active" }),
  ]);
  return { structure, subjects, allocations, enrollments };
}
