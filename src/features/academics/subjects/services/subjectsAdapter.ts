import type {
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";

export interface SubjectsAdapter {
  fetchSubjects(): Promise<Subject[]>;
  createSubject(payload: Omit<Subject, "id">): Promise<Subject>;
  updateSubject(
    subjectId: string,
    payload: Partial<Omit<Subject, "id">>
  ): Promise<Subject>;
  deleteSubject(subjectId: string): Promise<void>;
  fetchSubjectAllocations(
    termId: string,
    filters?: { gradeId?: string; subjectId?: string },
  ): Promise<SubjectAllocation[]>;
  bulkUpsertSubjectAllocations(termId: string, items: SubjectAllocation[]): Promise<void>;
}
