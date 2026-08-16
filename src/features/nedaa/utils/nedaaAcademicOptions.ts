import type { SelectOption } from "@/components/ui/input/Select";
import type {
  StructureTree,
  Stage,
  Grade,
  Section,
  Classroom,
} from "@/features/academics/academic-structure-tree/services/structureService";

export interface NedaaAcademicSelection {
  stageId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
}

export interface NedaaAcademicOptions {
  stages: SelectOption[];
  grades: SelectOption[];
  sections: SelectOption[];
  classrooms: SelectOption[];
}

type AcademicNode = Stage | Grade | Section | Classroom;

function nodeLabel(node: AcademicNode, locale: string) {
  return locale === "ar"
    ? node.nameAr || node.nameEn || node.name
    : node.nameEn || node.nameAr || node.name;
}

function toOptions(nodes: AcademicNode[], locale: string): SelectOption[] {
  return [...nodes]
    .sort((left, right) => left.order - right.order)
    .map((node) => ({ value: node.id, label: nodeLabel(node, locale) }));
}

export function getNedaaAcademicOptions(
  tree: StructureTree,
  selection: NedaaAcademicSelection,
  locale: string,
): NedaaAcademicOptions {
  const grades = selection.stageId
    ? tree.grades.filter((grade) => grade.stageId === selection.stageId)
    : tree.grades;
  const sections = selection.gradeId
    ? tree.sections.filter((section) => section.gradeId === selection.gradeId)
    : tree.sections;
  const classrooms = selection.sectionId
    ? tree.classrooms.filter(
        (classroom) => classroom.sectionId === selection.sectionId,
      )
    : tree.classrooms;

  return {
    stages: toOptions(tree.stages, locale),
    grades: toOptions(grades, locale),
    sections: toOptions(sections, locale),
    classrooms: toOptions(classrooms, locale),
  };
}

export function reconcileNedaaAcademicSelection(
  tree: StructureTree,
  selection: NedaaAcademicSelection,
): NedaaAcademicSelection {
  const grade = tree.grades.find((node) => node.id === selection.gradeId);
  const gradeId =
    grade && (!selection.stageId || grade.stageId === selection.stageId)
      ? grade.id
      : "";
  const section = tree.sections.find((node) => node.id === selection.sectionId);
  const sectionId =
    section && (!selection.gradeId || (gradeId && section.gradeId === gradeId))
      ? section.id
      : "";
  const classroom = tree.classrooms.find(
    (node) => node.id === selection.classroomId,
  );
  const classroomId =
    classroom &&
    (!selection.sectionId || (sectionId && classroom.sectionId === sectionId))
      ? classroom.id
      : "";

  return {
    stageId: selection.stageId,
    gradeId,
    sectionId,
    classroomId,
  };
}
