import type { EnrollmentPlacementDto } from "../api/enrollmentDtos";

export interface PlacementOption {
  id: string;
  name: string;
  parentId?: string;
}

export interface PlacementAcademicContextOption {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
}

interface EnrollmentPlacementInput {
  studentId: string;
  academicYear: PlacementAcademicContextOption;
  termId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
  enrollmentDate: string;
  grades: PlacementOption[];
  sections: PlacementOption[];
  classrooms: PlacementOption[];
}

export function buildEnrollmentPlacementPayload({
  studentId,
  academicYear,
  termId,
  gradeId,
  sectionId,
  classroomId,
  enrollmentDate,
  grades,
  sections,
  classrooms,
}: EnrollmentPlacementInput): EnrollmentPlacementDto {
  return {
    studentId,
    academicYearId: academicYear.id,
    academicYear: academicYear.name,
    termId,
    gradeId,
    grade: grades.find((grade) => grade.id === gradeId)?.name,
    sectionId,
    section: sections.find((section) => section.id === sectionId)?.name,
    classroomId,
    classroom: classrooms.find((classroom) => classroom.id === classroomId)?.name,
    enrollmentDate,
    status: "active",
  };
}
