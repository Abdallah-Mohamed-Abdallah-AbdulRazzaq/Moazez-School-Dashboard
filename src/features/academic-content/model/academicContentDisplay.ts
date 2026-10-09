import type { TeacherDirectoryListItem } from "@/features/teachers/types";
import type { AcademicTargetOptions } from "../services/academicContentSelectors";
import type { AcademicContentTarget } from "../types/contracts";

interface LocalizedAcademicEntity {
  name?: string;
  nameAr?: string;
  nameEn?: string;
}

type AcademicTargetScope = Pick<
  AcademicContentTarget,
  "scopeType" | "stageId" | "gradeId" | "sectionId" | "classroomId"
>;

export function localizedAcademicName(
  entity: LocalizedAcademicEntity | undefined,
  locale: string,
): string | undefined {
  if (!entity) return undefined;
  return (
    (locale === "ar" ? entity.nameAr : entity.nameEn) ||
    entity.name ||
    entity.nameEn ||
    entity.nameAr
  );
}

export function academicTargetScopeName(
  target: AcademicTargetScope,
  options: AcademicTargetOptions | null,
  locale: string,
): string | undefined {
  if (!options) return undefined;

  const { structure } = options;
  switch (target.scopeType) {
    case "STAGE":
      return localizedAcademicName(
        structure.stages.find((stage) => stage.id === target.stageId),
        locale,
      );
    case "GRADE":
      return localizedAcademicName(
        structure.grades.find((grade) => grade.id === target.gradeId),
        locale,
      );
    case "SECTION":
      return localizedAcademicName(
        structure.sections.find((section) => section.id === target.sectionId),
        locale,
      );
    case "CLASSROOM":
      return localizedAcademicName(
        structure.classrooms.find(
          (classroom) => classroom.id === target.classroomId,
        ),
        locale,
      );
    case "SCHOOL":
      return undefined;
  }
}

export function academicSubjectName(
  subjectId: string | null | undefined,
  options: AcademicTargetOptions | null,
  locale: string,
): string | undefined {
  if (!subjectId || !options) return undefined;
  return localizedAcademicName(
    options.subjects.find((subject) => subject.id === subjectId),
    locale,
  );
}

export function teacherDisplayName(
  userId: string | null | undefined,
  teachers: readonly TeacherDirectoryListItem[],
): string | undefined {
  if (!userId) return undefined;
  return teachers.find((teacher) => teacher.userId === userId)?.displayName
    .fullName;
}
