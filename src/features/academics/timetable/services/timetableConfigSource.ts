import type { StructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import type { TimetableConfigScope } from "@/features/academics/timetable/types/timetableConfig";

export function getTimetableConfigSourceName(
  source: { scope: TimetableConfigScope; id?: string },
  academicTree: StructureTree,
  locale: string,
): string | null {
  if (!source.id || source.scope === "TERM") return null;

  const sourceNodes =
    source.scope === "GRADE"
      ? academicTree.grades
      : source.scope === "SECTION"
        ? academicTree.sections
        : academicTree.classrooms;
  const sourceNode = sourceNodes.find((node) => node.id === source.id);

  if (!sourceNode) return null;

  return locale === "ar"
    ? sourceNode.nameAr || sourceNode.nameEn || sourceNode.name
    : sourceNode.nameEn || sourceNode.nameAr || sourceNode.name;
}
