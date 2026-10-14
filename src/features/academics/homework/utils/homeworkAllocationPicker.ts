import type { SelectOption } from "@/components/ui/input/Select";
import type { StructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import type { TeacherAllocation } from "@/features/academics/teacher-allocation/services/teacherAllocationService";

export interface HomeworkAllocationOption extends SelectOption {
  allocation: TeacherAllocation;
  teacherLabel: string;
  subjectLabel: string;
  classroomLabel: string;
  stageId: string;
  gradeId: string;
}

export const HOMEWORK_ALLOCATION_LEVELS = ["stage", "grade", "section", "classroom", "subject"] as const;
export type HomeworkAllocationLevel = typeof HOMEWORK_ALLOCATION_LEVELS[number];
export type HomeworkAllocationFilters = Record<HomeworkAllocationLevel, string>;

interface HomeworkAllocationPath {
  option: HomeworkAllocationOption;
  stage: StructureTree["stages"][number];
  grade: StructureTree["grades"][number];
  section: StructureTree["sections"][number];
  classroom: StructureTree["classrooms"][number];
}

export function homeworkAllocationPaths(options: HomeworkAllocationOption[], structure: StructureTree): HomeworkAllocationPath[] {
  return options.flatMap(option => {
    const classroom = structure.classrooms.find(room => room.id === option.allocation.classroomId);
    const section = structure.sections.find(group => group.id === classroom?.sectionId);
    const grade = structure.grades.find(group => group.id === section?.gradeId);
    const stage = structure.stages.find(group => group.id === grade?.stageId);
    return classroom && section && grade && stage ? [{ option, classroom, section, grade, stage }] : [];
  });
}

function pathId(path: HomeworkAllocationPath, level: HomeworkAllocationLevel) {
  return level === "subject" ? path.option.allocation.subjectId : path[level].id;
}

function pathLabel(path: HomeworkAllocationPath, level: HomeworkAllocationLevel, locale: string) {
  if (level === "subject") return path.option.subjectLabel;
  const group = path[level];
  return locale === "ar" ? group.nameAr || group.nameEn || group.name : group.nameEn || group.nameAr || group.name;
}

export function homeworkAllocationFilters(path?: HomeworkAllocationPath): HomeworkAllocationFilters {
  return Object.fromEntries(HOMEWORK_ALLOCATION_LEVELS.map(level => [level, path ? pathId(path, level) : ""])) as HomeworkAllocationFilters;
}

export function nextHomeworkAllocationFilters(filters: HomeworkAllocationFilters, level: HomeworkAllocationLevel, id: string): HomeworkAllocationFilters {
  const index = HOMEWORK_ALLOCATION_LEVELS.indexOf(level);
  const next = { ...filters };
  for (const dependent of HOMEWORK_ALLOCATION_LEVELS.slice(index)) next[dependent] = "";
  next[level] = id;
  return next;
}

export function homeworkAllocationChoices(request: { paths: HomeworkAllocationPath[]; filters: HomeworkAllocationFilters; level: HomeworkAllocationLevel; locale: string }): SelectOption[] {
  const { paths, filters, level, locale } = request;
  const parents = HOMEWORK_ALLOCATION_LEVELS.slice(0, HOMEWORK_ALLOCATION_LEVELS.indexOf(level));
  const matching = paths.filter(path => parents.every(parent => pathId(path, parent) === filters[parent]));
  const choices = new Map(matching.map(path => [pathId(path, level), { value: pathId(path, level), label: pathLabel(path, level, locale) }]));
  return [...choices.values()].sort((left, right) => left.label.localeCompare(right.label, locale));
}

export function homeworkAllocationsMatchingPath(paths: HomeworkAllocationPath[], filters: HomeworkAllocationFilters): HomeworkAllocationOption[] {
  return paths.filter(path => HOMEWORK_ALLOCATION_LEVELS.every(level => pathId(path, level) === filters[level])).map(path => path.option);
}
