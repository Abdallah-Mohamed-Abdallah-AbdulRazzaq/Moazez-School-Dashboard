import { apiGet } from "@/lib/api";
import {
  buildQueryString,
  unwrapArrayResponse,
  unwrapItemResponse,
} from "@/features/students-guardians/services/studentsGuardiansApiUtils";

const ACADEMIC_STRUCTURE_BASE_PATH = "/academics/structure";

export interface AcademicStructureClassroom {
  id: string;
  sectionId: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
}

export interface AcademicStructureSection {
  id: string;
  gradeId: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  classrooms?: AcademicStructureClassroom[];
}

export interface AcademicStructureGrade {
  id: string;
  stageId: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  sections?: AcademicStructureSection[];
}

export interface AcademicStructureStage {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  grades?: AcademicStructureGrade[];
}

export interface AcademicStructureTree {
  yearId?: string;
  termId?: string;
  stages: AcademicStructureStage[];
  grades: AcademicStructureGrade[];
  sections: AcademicStructureSection[];
  classrooms: AcademicStructureClassroom[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalizeTree = (response: unknown): AcademicStructureTree => {
  const tree = unwrapItemResponse<Record<string, unknown>>(
    response,
    "Academic structure tree",
  );
  const stages = Array.isArray(tree.stages)
    ? (tree.stages as AcademicStructureStage[])
    : [];
  const nestedGrades = stages.flatMap((stage) =>
    Array.isArray(stage.grades)
      ? stage.grades.map((grade) => ({ ...grade, stageId: grade.stageId || stage.id }))
      : [],
  );
  const grades = Array.isArray(tree.grades)
    ? (tree.grades as AcademicStructureGrade[])
    : nestedGrades;
  const nestedSections = grades.flatMap((grade) =>
    Array.isArray(grade.sections)
      ? grade.sections.map((section) => ({
          ...section,
          gradeId: section.gradeId || grade.id,
        }))
      : [],
  );
  const sections = Array.isArray(tree.sections)
    ? (tree.sections as AcademicStructureSection[])
    : nestedSections;
  const nestedClassrooms = sections.flatMap((section) =>
    Array.isArray(section.classrooms)
      ? section.classrooms.map((classroom) => ({
          ...classroom,
          sectionId: classroom.sectionId || section.id,
        }))
      : [],
  );
  const classrooms = Array.isArray(tree.classrooms)
    ? (tree.classrooms as AcademicStructureClassroom[])
    : nestedClassrooms;

  return {
    yearId: typeof tree.yearId === "string" ? tree.yearId : undefined,
    termId: typeof tree.termId === "string" ? tree.termId : undefined,
    stages,
    grades,
    sections,
    classrooms,
  };
};

export async function fetchAcademicYears(): Promise<unknown[]> {
  const response = await apiGet<unknown>(`${ACADEMIC_STRUCTURE_BASE_PATH}/years`);
  return unwrapArrayResponse(response, "Academic years");
}

export async function fetchTerms(academicYearId: string): Promise<unknown[]> {
  const response = await apiGet<unknown>(
    `${ACADEMIC_STRUCTURE_BASE_PATH}/terms${buildQueryString({ academicYearId })}`,
  );
  return unwrapArrayResponse(response, "Academic terms");
}

export async function fetchStructureTree(
  yearId: string,
  termId: string,
): Promise<unknown> {
  const response = await apiGet<unknown>(
    `${ACADEMIC_STRUCTURE_BASE_PATH}/tree${buildQueryString({ yearId, termId })}`,
  );
  return unwrapItemResponse(response, "Academic structure tree");
}

export async function fetchAcademicStructureTree({
  yearId,
  termId,
}: {
  yearId: string;
  termId: string;
}): Promise<AcademicStructureTree> {
  const response = await apiGet<unknown>(
    `${ACADEMIC_STRUCTURE_BASE_PATH}/tree${buildQueryString({ yearId, termId })}`,
  );
  if (!isRecord(response)) {
    throw new Error("Academic structure tree response must be an object.");
  }
  return normalizeTree(response);
}
