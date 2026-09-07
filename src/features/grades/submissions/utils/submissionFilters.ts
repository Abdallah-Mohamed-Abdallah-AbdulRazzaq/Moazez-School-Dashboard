import type { ScopeEntityOption } from "../../shared/types";
import type { SubmissionListFilters, SubmissionScopeSelection, SubmissionStatus } from "../types";

export const EMPTY_SUBMISSION_SCOPE: SubmissionScopeSelection = {
  gradeId: "",
  sectionId: "",
  classroomId: "",
};

export function getSubmissionSections(sections: ScopeEntityOption[], gradeId: string): ScopeEntityOption[] {
  return gradeId ? sections.filter((section) => section.parentId === gradeId) : [];
}

export function getSubmissionClassrooms(classrooms: ScopeEntityOption[], sectionId: string): ScopeEntityOption[] {
  return sectionId ? classrooms.filter((classroom) => classroom.parentId === sectionId) : [];
}

export function changeSubmissionGrade(_current: SubmissionScopeSelection, gradeId: string): SubmissionScopeSelection {
  return { gradeId, sectionId: "", classroomId: "" };
}

export function changeSubmissionSection(current: SubmissionScopeSelection, sectionId: string): SubmissionScopeSelection {
  return { ...current, sectionId, classroomId: "" };
}

export function toSubmissionListFilters(
  selection: SubmissionScopeSelection,
  status: SubmissionStatus | "",
  search: string,
): SubmissionListFilters {
  const trimmedSearch = search.trim();
  return {
    ...(selection.gradeId ? { gradeId: selection.gradeId } : {}),
    ...(selection.sectionId ? { sectionId: selection.sectionId } : {}),
    ...(selection.classroomId ? { classroomId: selection.classroomId } : {}),
    ...(status ? { status } : {}),
    ...(trimmedSearch ? { search: trimmedSearch } : {}),
  };
}
