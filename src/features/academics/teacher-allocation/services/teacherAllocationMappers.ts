import type {
  TeacherAllocation,
  TeacherLoad,
  ValidationIssue,
  ValidationResult,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import type {
  TeacherAllocationDto,
  TeacherAllocationValidationResponse,
  TeacherLoadsResponse,
} from "@/features/academics/teacher-allocation/services/teacherAllocationApi.types";

export interface TeacherLoadViewModel {
  teacherId: string;
  teacherName: string;
  totalWeeklyPeriods: number;
  assignmentCount: number;
  classroomsCount: number;
  subjectsCount: number;
  warningsCount: number;
  warnings: Array<{
    code: string;
    message: string;
    allocationId?: string;
    subjectId?: string;
    classroomId?: string;
  }>;
  assignments: Array<{
    allocationId: string;
    gradeId: string;
    gradeNameAr: string;
    gradeNameEn: string;
    classroomId: string;
    classroomNameAr: string;
    classroomNameEn: string;
    subjectId: string;
    subjectNameAr: string;
    subjectNameEn: string;
    weeklyHours: number;
  }>;
}

type TeacherLoadDto = TeacherLoadsResponse["items"][number];
type ValidationItemDto = TeacherAllocationValidationResponse["items"][number];
type TeacherLoadAssignmentViewModel = TeacherLoadViewModel["assignments"][number];

export function mapAllocationDtoToUi(
  dto: TeacherAllocationDto,
): TeacherAllocation {
  return {
    id: dto.id,
    termId: dto.term.id,
    sectionId: dto.classroom.sectionId,
    classroomId: dto.classroom.id,
    subjectId: dto.subject.id,
    teacherId: dto.teacher.id,
  };
}

function getTeacherName(teacher: TeacherLoadDto["teacher"]) {
  return `${teacher.firstName} ${teacher.lastName}`.trim();
}

export function mapTeacherLoadDtoToViewModel(
  dto: TeacherLoadDto,
): TeacherLoadViewModel {
  return {
    teacherId: dto.teacherUserId,
    teacherName: getTeacherName(dto.teacher),
    totalWeeklyPeriods: dto.totalWeeklyHours,
    assignmentCount: dto.allocationCount,
    classroomsCount: dto.classroomsCount,
    subjectsCount: dto.subjectsCount,
    warningsCount: dto.warnings.length,
    warnings: dto.warnings,
    assignments: dto.loads.map((load) => ({
      allocationId: load.allocationId,
      gradeId: load.gradeId,
      gradeNameAr: load.grade.nameAr,
      gradeNameEn: load.grade.nameEn,
      classroomId: load.classroomId,
      classroomNameAr: load.classroom.nameAr,
      classroomNameEn: load.classroom.nameEn,
      subjectId: load.subjectId,
      subjectNameAr: load.subject.nameAr,
      subjectNameEn: load.subject.nameEn,
      weeklyHours: load.weeklyHours || 0,
    })),
  };
}

export function mapTeacherLoadDtoToUi(dto: TeacherLoadDto): TeacherLoad {
  const viewModel = mapTeacherLoadDtoToViewModel(dto);

  return {
    teacherId: viewModel.teacherId,
    teacherName: viewModel.teacherName,
    teacherNameAr: viewModel.teacherName,
    teacherNameEn: viewModel.teacherName,
    totalWeeklyPeriods: viewModel.totalWeeklyPeriods,
    assignments: viewModel.assignments.map(mapLoadAssignmentViewModelToUi),
  };
}

function mapLoadAssignmentViewModelToUi(
  assignment: TeacherLoadAssignmentViewModel,
): TeacherLoad["assignments"][number] {
  return {
    sectionId: assignment.classroomId,
    sectionName: assignment.classroomNameEn || assignment.classroomNameAr,
    sectionNameAr: assignment.classroomNameAr || assignment.classroomNameEn,
    sectionNameEn: assignment.classroomNameEn || assignment.classroomNameAr,
    classroomId: assignment.classroomId,
    classroomName: assignment.classroomNameEn || assignment.classroomNameAr,
    classroomNameAr: assignment.classroomNameAr || assignment.classroomNameEn,
    classroomNameEn: assignment.classroomNameEn || assignment.classroomNameAr,
    gradeId: assignment.gradeId,
    gradeName: assignment.gradeNameEn || assignment.gradeNameAr,
    gradeNameAr: assignment.gradeNameAr || assignment.gradeNameEn,
    gradeNameEn: assignment.gradeNameEn || assignment.gradeNameAr,
    subjectId: assignment.subjectId,
    subjectName: assignment.subjectNameEn || assignment.subjectNameAr,
    subjectNameAr: assignment.subjectNameAr || assignment.subjectNameEn,
    subjectNameEn: assignment.subjectNameEn || assignment.subjectNameAr,
    weeklyHours: assignment.weeklyHours,
  };
}

function mapValidationItemToIssue(
  dto: ValidationItemDto,
): ValidationIssue | null {
  if (!dto.grade || !dto.gradeId || !dto.subject || !dto.subjectId) {
    return null;
  }

  return {
    type: "missing",
    sectionId: "",
    sectionName: "",
    sectionNameAr: "",
    sectionNameEn: "",
    gradeId: dto.gradeId,
    gradeName: dto.grade.nameEn || dto.grade.nameAr,
    gradeNameAr: dto.grade.nameAr || dto.grade.nameEn,
    gradeNameEn: dto.grade.nameEn || dto.grade.nameAr,
    subjectId: dto.subjectId,
    subjectName: dto.subject.nameEn || dto.subject.nameAr,
    subjectNameAr: dto.subject.nameAr || dto.subject.nameEn,
    subjectNameEn: dto.subject.nameEn || dto.subject.nameAr,
    details: dto.issues.map((issue) => issue.message).join(", "),
  };
}

export function mapValidationDtoToUi(
  dto: TeacherAllocationValidationResponse,
): ValidationResult {
  const issues = dto.items
    .filter((validationItem) => validationItem.status !== "complete")
    .map(mapValidationItemToIssue)
    .filter((issue): issue is ValidationIssue => Boolean(issue));

  return {
    isValid: dto.summary.missingTeacherAssignments === 0,
    missingCount: dto.summary.missingTeacherAssignments,
    overloadedCount: 0,
    unqualifiedCount: 0,
    sectionsWithMissing: 0,
    missingAllocations: [],
    overloadedTeachers: [],
    issues,
  };
}
