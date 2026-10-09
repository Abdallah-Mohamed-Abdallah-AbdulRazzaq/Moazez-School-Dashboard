import type { AcademicTargetOptions } from "../academicContentSelectors";
import type {
  AcademicContentTargetDraft,
  AcademicContentTargetScope,
} from "../../types/contracts";

export const referenceTargetOptions: AcademicTargetOptions = {
  structure: {
    stages: [1, 2].map((index) => ({
      id: `stage-${index}`,
      name: `Stage ${index}`,
      nameAr: `مرحلة ${index}`,
      nameEn: `Stage ${index}`,
      order: index,
    })),
    grades: [1, 2, 3].map((index) => ({
      id: `grade-${index}`,
      stageId: index === 3 ? "stage-2" : "stage-1",
      name: `Grade ${index}`,
      nameAr: `صف ${index}`,
      nameEn: `Grade ${index}`,
      order: index,
      capacity: 20,
    })),
    sections: [1, 2, 3].map((index) => ({
      id: `section-${index}`,
      gradeId: `grade-${index}`,
      name: `Section ${index}`,
      nameAr: `شعبة ${index}`,
      nameEn: `Section ${index}`,
      order: index,
      capacity: 20,
    })),
    classrooms: [1, 2, 3].map((index) => ({
      id: `class-${index}`,
      sectionId: `section-${index}`,
      name: `Class ${index}`,
      nameAr: `فصل ${index}`,
      nameEn: `Class ${index}`,
      order: index,
      capacity: 20,
    })),
  },
  subjects: [],
  subjectAllocations: [],
  teacherAllocations: [],
};

export function referenceTarget(
  scopeType: AcademicContentTargetScope,
  anchor: string | null,
  subjectId: string | null = "subject-1",
): Required<AcademicContentTargetDraft> {
  return {
    scopeType,
    subjectId,
    stageId: scopeType === "STAGE" ? anchor : null,
    gradeId: scopeType === "GRADE" ? anchor : null,
    sectionId: scopeType === "SECTION" ? anchor : null,
    classroomId: scopeType === "CLASSROOM" ? anchor : null,
    teacherSubjectAllocationId: null,
  };
}
