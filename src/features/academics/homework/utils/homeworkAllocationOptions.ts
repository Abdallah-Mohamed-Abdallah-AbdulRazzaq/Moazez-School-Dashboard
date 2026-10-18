import type { StructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import type { Subject } from "@/features/academics/subjects/services/subjectsService";
import type { Teacher, TeacherAllocation } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import type { HomeworkAllocationOption as AllocationSelectOption } from "./homeworkAllocationPicker";

function localizedName(
  locale: string,
  item?: { nameAr?: string; nameEn?: string; name?: string } | null,
) {
  if (!item) return "";
  return locale === "ar"
    ? item.nameAr || item.nameEn || item.name || ""
    : item.nameEn || item.nameAr || item.name || "";
}

function teacherNameForLocale(locale: string, teacher?: Teacher) {
  return locale === "ar"
    ? teacher?.nameAr || teacher?.nameEn || ""
    : teacher?.nameEn || teacher?.nameAr || "";
}

function allocationOptionSearchText(input: {
  allocation: TeacherAllocation;
  teacher?: Teacher;
  subject?: Subject;
  classroom?: StructureTree["classrooms"][number];
  section?: StructureTree["sections"][number];
  grade?: StructureTree["grades"][number];
}) {
  return [
    input.teacher?.nameAr,
    input.teacher?.nameEn,
    input.allocation.teacherName,
    input.subject?.nameAr,
    input.subject?.nameEn,
    input.classroom?.nameAr,
    input.classroom?.nameEn,
    input.section?.nameAr,
    input.section?.nameEn,
    input.grade?.nameAr,
    input.grade?.nameEn,
    input.allocation.id,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildAllocationOptions(input: {
  allocations: TeacherAllocation[];
  teachers: Teacher[];
  subjects: Subject[];
  structure: StructureTree;
  locale: string;
}): AllocationSelectOption[] {
  return input.allocations
    .filter((allocation) => Boolean(allocation.teacherId))
    .map((allocation) => {
      const teacher = input.teachers.find(
        (item) => item.id === allocation.teacherId,
      );
      const subject = input.subjects.find(
        (item) => item.id === allocation.subjectId,
      );
      const classroom = input.structure.classrooms.find(
        (item) => item.id === allocation.classroomId,
      );
      const section = input.structure.sections.find(
        (item) => item.id === allocation.sectionId,
      );
      const grade = input.structure.grades.find(
        (item) => item.id === section?.gradeId,
      );
      const teacherLabel = teacherNameForLocale(input.locale, teacher) || allocation.teacherName || "";
      const labelParts = [
        teacherLabel,
        localizedName(input.locale, subject),
        localizedName(input.locale, classroom) ||
          localizedName(input.locale, section),
      ].filter(Boolean);
      const subjectLabel = localizedName(input.locale, subject);
      const classroomLabel =
        localizedName(input.locale, classroom) ||
        localizedName(input.locale, section);

      return {
        value: allocation.id,
        label: labelParts.length > 0 ? labelParts.join(" - ") : allocation.id,
        searchText: allocationOptionSearchText({
          allocation,
          teacher,
          subject,
          classroom,
          section,
          grade,
        }),
        allocation,
        teacherLabel,
        subjectLabel,
        classroomLabel,
        stageId: grade?.stageId ?? "",
        gradeId: grade?.id ?? "",
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label, input.locale));
}
