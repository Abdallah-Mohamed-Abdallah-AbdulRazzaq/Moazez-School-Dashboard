export interface TeacherAllocationTeacherDto {
  id: string;
  fullName: string;
  email?: string | null;
}

export interface TeacherAllocationSubjectDto {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  code?: string | null;
}

export interface TeacherAllocationClassroomDto {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  sectionId: string;
  roomId?: string | null;
}

export interface TeacherAllocationTermDto {
  id: string;
  academicYearId: string;
  name: string;
  nameAr: string;
  nameEn: string;
  status: "open" | "closed" | string;
}

export interface TeacherAllocationDto {
  id: string;
  teacher: TeacherAllocationTeacherDto;
  subject: TeacherAllocationSubjectDto;
  classroom: TeacherAllocationClassroomDto;
  term: TeacherAllocationTermDto;
  createdAt: string;
}

export interface ListTeacherAllocationsResponse {
  items: TeacherAllocationDto[];
}

export interface CreateTeacherAllocationRequest {
  teacherUserId: string;
  subjectId: string;
  classroomId: string;
  termId: string;
}

export interface BulkTeacherAllocationRequest {
  termId: string;
  items: Array<{
    teacherUserId: string;
    subjectId: string;
    classroomId: string;
  }>;
}

export interface BulkTeacherAllocationResponse {
  items: TeacherAllocationDto[];
  summary: {
    requestedCount: number;
    createdCount: number;
    existingCount: number;
  };
}

export interface ApplyTeacherToGradeRequest {
  termId: string;
  gradeId: string;
  subjectId: string;
  teacherUserId: string;
  classroomIds?: string[];
}

export interface ApplyTeacherToGradeResponse {
  items: TeacherAllocationDto[];
  summary: {
    requestedClassrooms: number;
    createdCount: number;
    existingCount: number;
  };
}

export interface ClearSubjectAllocationsRequest {
  termId: string;
  subjectId: string;
  gradeId?: string;
  classroomIds?: string[];
}

export interface ClearSubjectAllocationsResponse {
  ok: boolean;
  deletedCount: number;
}

export interface DeleteTeacherAllocationResponse {
  ok: boolean;
}

export interface TeacherAllocationValidationResponse {
  termId: string;
  academicYearId: string;
  summary: {
    gradesChecked: number;
    subjectAllocationRows: number;
    teacherAllocationRows: number;
    missingTeacherAssignments: number;
    missingSubjectAllocationRows: number;
    overAllocatedSubjects: number;
    underAllocatedSubjects: number;
  };
  items: Array<{
    gradeId: string | null;
    grade: {
      id: string;
      nameAr: string;
      nameEn: string;
    } | null;
    subjectId: string | null;
    subject: {
      id: string;
      nameAr: string;
      nameEn: string;
      code?: string | null;
      color?: string | null;
    } | null;
    weeklyHours: number | null;
    classroomCount: number;
    allocatedClassroomCount: number;
    missingClassroomCount: number;
    status: "complete" | "incomplete" | "missing_subject_allocation" | string;
    issues: Array<{
      code: string;
      message: string;
      classroomIds?: string[];
    }>;
  }>;
}

export interface TeacherLoadsResponse {
  termId: string;
  academicYearId: string;
  items: Array<{
    teacherUserId: string;
    teacher: {
      id: string;
      firstName: string;
      lastName: string;
    };
    allocationCount: number;
    totalWeeklyHours: number;
    classroomsCount: number;
    subjectsCount: number;
    loads: Array<{
      allocationId: string;
      subjectId: string;
      subject: {
        id: string;
        nameAr: string;
        nameEn: string;
        code?: string | null;
        color?: string | null;
      };
      classroomId: string;
      classroom: {
        id: string;
        nameAr: string;
        nameEn: string;
      };
      gradeId: string;
      grade: {
        id: string;
        nameAr: string;
        nameEn: string;
      };
      weeklyHours: number | null;
    }>;
    warnings: Array<{
      code: string;
      message: string;
      allocationId?: string;
      subjectId?: string;
      classroomId?: string;
    }>;
  }>;
}
