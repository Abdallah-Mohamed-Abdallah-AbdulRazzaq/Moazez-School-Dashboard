import type {
  AcademicYear,
  Classroom,
  Grade,
  Section,
  Stage,
  StructureTree,
  Term,
} from "@/features/academics/academic-structure-tree/services/structureService";

export interface StructureAdapter {
  fetchAcademicYears(): Promise<AcademicYear[]>;
  fetchTermsByYear(yearId: string): Promise<Term[]>;
  createAcademicYear(payload: Omit<AcademicYear, "id">): Promise<AcademicYear>;
  updateAcademicYear(
    id: string,
    payload: Partial<Omit<AcademicYear, "id">>
  ): Promise<AcademicYear>;
  createTerm(payload: Omit<Term, "id">): Promise<Term>;
  updateTerm(id: string, payload: Partial<Omit<Term, "id">>): Promise<Term>;
  fetchStructureTree(yearId: string, termId: string): Promise<StructureTree>;
  createStage(yearId: string, termId: string, payload: Omit<Stage, "id">): Promise<Stage>;
  updateStage(
    yearId: string,
    termId: string,
    id: string,
    payload: Partial<Omit<Stage, "id">>
  ): Promise<Stage>;
  deleteStage(yearId: string, termId: string, id: string): Promise<void>;
  reorderStages(
    yearId: string,
    termId: string,
    orderedStageIds: string[]
  ): Promise<void>;
  createGrade(yearId: string, termId: string, payload: Omit<Grade, "id">): Promise<Grade>;
  updateGrade(
    yearId: string,
    termId: string,
    id: string,
    payload: Partial<Omit<Grade, "id">>
  ): Promise<Grade>;
  deleteGrade(yearId: string, termId: string, id: string): Promise<void>;
  reorderGrades(
    yearId: string,
    termId: string,
    stageId: string,
    orderedGradeIds: string[]
  ): Promise<void>;
  createSection(
    yearId: string,
    termId: string,
    payload: Omit<Section, "id">
  ): Promise<Section>;
  updateSection(
    yearId: string,
    termId: string,
    id: string,
    payload: Partial<Omit<Section, "id">>
  ): Promise<Section>;
  deleteSection(yearId: string, termId: string, id: string): Promise<void>;
  reorderSections(
    yearId: string,
    termId: string,
    gradeId: string,
    orderedSectionIds: string[]
  ): Promise<void>;
  createClassroom(
    yearId: string,
    termId: string,
    payload: Omit<Classroom, "id">
  ): Promise<Classroom>;
  updateClassroom(
    yearId: string,
    termId: string,
    id: string,
    payload: Partial<Omit<Classroom, "id">>
  ): Promise<Classroom>;
  deleteClassroom(yearId: string, termId: string, id: string): Promise<void>;
  reorderClassrooms(
    yearId: string,
    termId: string,
    sectionId: string,
    orderedClassroomIds: string[]
  ): Promise<void>;
}
