import type {
  Classroom,
  Grade,
  Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type {
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import {
  applyTeacherToGrade as applyTeacherToGradeRequest,
  bulkSaveTeacherAllocations,
  clearSubjectAllocations as clearSubjectAllocationsRequest,
  createTeacherAllocation,
  deleteTeacherAllocation as deleteTeacherAllocationRequest,
  getTeacherAllocationValidation,
  getTeacherLoads,
  listTeacherAllocations,
} from "@/features/academics/teacher-allocation/services/teacherAllocationApiAdapter";
import type {
  ApplyTeacherToGradeRequest,
  ApplyTeacherToGradeResponse,
  BulkTeacherAllocationRequest,
  ClearSubjectAllocationsRequest,
  ClearSubjectAllocationsResponse,
  CreateTeacherAllocationRequest,
  TeacherAllocationValidationResponse,
} from "@/features/academics/teacher-allocation/services/teacherAllocationApi.types";
import {
  fetchTeacherAllocationTeacherDirectory,
  fetchTeacherAllocationTeachers,
} from "@/features/academics/teacher-allocation/services/teacherAllocationTeachersApiService";
import {
  mapAllocationDtoToUi,
  mapTeacherLoadDtoToUi,
  mapTeacherLoadDtoToViewModel,
  mapValidationDtoToUi,
  type TeacherLoadViewModel,
} from "@/features/academics/teacher-allocation/services/teacherAllocationMappers";
export {
  isTeacherAllocationClearConflict,
  isTeacherAllocationDeleteConflict,
  teacherAllocationConflictDetails,
} from "@/features/academics/teacher-allocation/services/teacherAllocationErrors";

interface StructureData {
  grades?: Grade[];
  sections?: Section[];
  classrooms?: Classroom[];
  subjects?: Subject[];
}

export interface Teacher {
  id: string;
  nameAr: string;
  nameEn: string;
  email?: string;
  maxWeeklyLoad?: number;
  subjects?: string[];
  isActive: boolean;
}

export interface TeacherAllocation {
  id: string;
  termId: string;
  sectionId: string;
  classroomId?: string;
  subjectId: string;
  teacherId: string | null;
}

export interface SaveTeacherAllocationChangesInput {
  termId: string;
  localAllocations: TeacherAllocation[];
  originalAllocations: TeacherAllocation[];
}

interface ReplacementTeacherAssignment {
  originalAllocation: TeacherAllocation;
  nextAllocation: TeacherAllocation;
}

export interface TeacherLoad {
  teacherId: string;
  teacherName: string;
  teacherNameAr: string;
  teacherNameEn: string;
  totalWeeklyPeriods: number;
  assignments: {
    sectionId: string;
    sectionName: string;
    sectionNameAr: string;
    sectionNameEn: string;
    classroomId?: string;
    classroomName?: string;
    classroomNameAr?: string;
    classroomNameEn?: string;
    gradeId: string;
    gradeName: string;
    gradeNameAr: string;
    gradeNameEn: string;
    subjectId: string;
    subjectName: string;
    subjectNameAr: string;
    subjectNameEn: string;
    weeklyHours: number;
  }[];
}

export interface ValidationIssue {
  type: "missing" | "overloaded" | "unqualified";
  sectionId: string;
  sectionName: string;
  sectionNameAr: string;
  sectionNameEn: string;
  classroomId?: string;
  classroomName?: string;
  classroomNameAr?: string;
  classroomNameEn?: string;
  gradeId: string;
  gradeName: string;
  gradeNameAr: string;
  gradeNameEn: string;
  subjectId?: string;
  subjectName?: string;
  subjectNameAr?: string;
  subjectNameEn?: string;
  teacherId?: string;
  teacherName?: string;
  teacherNameAr?: string;
  teacherNameEn?: string;
  details: string;
  currentLoad?: number;
  maxLoad?: number;
}

export interface ValidationResult {
  isValid: boolean;
  missingCount: number;
  overloadedCount: number;
  unqualifiedCount: number;
  sectionsWithMissing: number;
  missingAllocations: Array<{
    sectionId: string;
    classroomId?: string;
    subjectId: string;
  }>;
  overloadedTeachers: Array<{
    teacherId: string;
    currentLoad: number;
    maxLoad: number;
  }>;
  issues: ValidationIssue[];
}

interface TeacherAllocationTarget {
  sectionId: string;
  subjectId: string;
  classroomId?: string;
}

export function resolveTeacherAllocationForTarget(
  allocations: TeacherAllocation[],
  target: TeacherAllocationTarget,
): TeacherAllocation | undefined {
  if (target.classroomId) {
    const classroomAllocation = allocations.find(
      (allocation) =>
        allocation.sectionId === target.sectionId &&
        allocation.subjectId === target.subjectId &&
        allocation.classroomId === target.classroomId,
    );
    if (classroomAllocation) {
      return classroomAllocation;
    }
  }

  return allocations.find(
    (allocation) =>
      allocation.sectionId === target.sectionId &&
      allocation.subjectId === target.subjectId &&
      !allocation.classroomId,
  );
}

function buildBulkCreateRequest(
  termId: string,
  allocations: TeacherAllocation[],
): BulkTeacherAllocationRequest {
  return {
    termId,
    items: allocations
      .filter(
        (allocation) => Boolean(allocation.teacherId) && Boolean(allocation.classroomId),
      )
      .map((allocation) => ({
        teacherUserId: allocation.teacherId as string,
        subjectId: allocation.subjectId,
        classroomId: allocation.classroomId as string,
      })),
  };
}

function sameAllocationTarget(
  left: TeacherAllocation,
  right: TeacherAllocation,
): boolean {
  return (
    left.sectionId === right.sectionId &&
    left.subjectId === right.subjectId &&
    left.classroomId === right.classroomId
  );
}

function matchingLocalAllocation(
  originalAllocation: TeacherAllocation,
  localAllocations: TeacherAllocation[],
): TeacherAllocation | undefined {
  return localAllocations.find((localAllocation) =>
    sameAllocationTarget(originalAllocation, localAllocation),
  );
}

function newTeacherAssignments(
  localAllocations: TeacherAllocation[],
): TeacherAllocation[] {
  return localAllocations.filter(
    (allocation) => allocation.id.startsWith("temp-") && Boolean(allocation.teacherId),
  );
}

function removedTeacherAssignments({
  localAllocations,
  originalAllocations,
}: SaveTeacherAllocationChangesInput): TeacherAllocation[] {
  return originalAllocations.filter((originalAllocation) => {
    const nextAllocation = matchingLocalAllocation(originalAllocation, localAllocations);
    return !nextAllocation?.teacherId;
  });
}

function replacementTeacherAssignments({
  localAllocations,
  originalAllocations,
}: SaveTeacherAllocationChangesInput): ReplacementTeacherAssignment[] {
  return originalAllocations.flatMap((originalAllocation) => {
    const nextAllocation = matchingLocalAllocation(originalAllocation, localAllocations);
    if (!nextAllocation?.teacherId) {
      return [];
    }
    if (nextAllocation.teacherId === originalAllocation.teacherId) {
      return [];
    }
    return [{ originalAllocation, nextAllocation }];
  });
}

export async function fetchTeachers(): Promise<Teacher[]> {
  return fetchTeacherAllocationTeachers();
}

export async function fetchTeacherDirectory() {
  return fetchTeacherAllocationTeacherDirectory();
}

export async function fetchTeacherAllocations(
  termId: string,
): Promise<TeacherAllocation[]> {
  const response = await listTeacherAllocations({ termId });
  return response.items.map(mapAllocationDtoToUi);
}

export async function fetchTeacherAllocationsByClassroom(
  termId: string,
  classroomId: string,
): Promise<TeacherAllocation[]> {
  const response = await listTeacherAllocations({ termId, classroomId });
  return response.items.map(mapAllocationDtoToUi);
}

export async function bulkCreateTeacherAllocations(
  termId: string,
  allocations: TeacherAllocation[],
): Promise<void> {
  const payload = buildBulkCreateRequest(termId, allocations);
  if (payload.items.length === 0) {
    return;
  }

  await bulkSaveTeacherAllocations(payload);
}

export async function saveTeacherAllocationChanges(
  input: SaveTeacherAllocationChangesInput,
): Promise<void> {
  const removedAllocations = removedTeacherAssignments(input);
  const replacementAllocations = replacementTeacherAssignments(input);
  const createAllocations = [
    ...newTeacherAssignments(input.localAllocations),
    ...replacementAllocations.map(({ nextAllocation }) => nextAllocation),
  ];

  await Promise.all(
    removedAllocations.map((allocation) =>
      deleteTeacherAllocationRequest(allocation.id),
    ),
  );

  for (const { originalAllocation } of replacementAllocations) {
    await deleteTeacherAllocationRequest(originalAllocation.id);
  }

  await bulkCreateTeacherAllocations(input.termId, createAllocations);
}

export async function replaceTeacherAllocation(
  allocationId: string,
  payload: CreateTeacherAllocationRequest,
): Promise<TeacherAllocation> {
  await deleteTeacherAllocationRequest(allocationId);
  const createdAllocation = await createTeacherAllocation(payload);
  return mapAllocationDtoToUi(createdAllocation);
}

export async function clearSubjectAllocations(
  payload: ClearSubjectAllocationsRequest,
): Promise<ClearSubjectAllocationsResponse> {
  return clearSubjectAllocationsRequest(payload);
}

export async function deleteTeacherAllocation(
  allocationId: string,
): Promise<void> {
  await deleteTeacherAllocationRequest(allocationId);
}

export async function applyTeacherToGrade(
  payload: ApplyTeacherToGradeRequest,
): Promise<ApplyTeacherToGradeResponse> {
  return applyTeacherToGradeRequest(payload);
}

export async function calculateTeacherLoads(
  termId: string,
  ...legacyInputs: [StructureData?, SubjectAllocation[]?, TeacherAllocation[]?]
): Promise<TeacherLoad[]> {
  void legacyInputs;
  const response = await getTeacherLoads({ termId });
  return response.items.map(mapTeacherLoadDtoToUi);
}

export async function fetchTeacherLoads(params: {
  termId: string;
  teacherUserId?: string;
}): Promise<TeacherLoadViewModel[]> {
  const response = await getTeacherLoads(params);
  return response.items.map(mapTeacherLoadDtoToViewModel);
}

export async function fetchTeacherAllocationValidation(params: {
  termId: string;
  gradeId?: string;
  subjectId?: string;
}): Promise<TeacherAllocationValidationResponse> {
  return getTeacherAllocationValidation(params);
}

export async function validateAllocations(
  termId: string,
  ...legacyInputs: [StructureData?, SubjectAllocation[]?]
): Promise<ValidationResult> {
  void legacyInputs;
  const response = await getTeacherAllocationValidation({ termId });
  return mapValidationDtoToUi(response);
}
