import { subjectsApiAdapter } from "@/features/academics/subjects/services/subjectsApiAdapter";

export interface Subject {
  id: string;
  name: string; // Display name (backward compatibility)
  nameAr: string;
  nameEn: string;
  code: string | null;
  color: string | null;
  isActive: boolean;
}

export interface SubjectAllocation {
  id?: string;
  academicYearId?: string;
  termId?: string;
  gradeId: string;
  subjectId: string;
  weeklyHours: number;
  grade?: {
    id: string;
    nameAr: string;
    nameEn: string;
  };
  subject?: {
    id: string;
    nameAr: string;
    nameEn: string;
    code: string | null;
    color: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Direct API Delegation for Subjects
export const fetchSubjects = (): Promise<Subject[]> =>
  subjectsApiAdapter.fetchSubjects();

export const createSubject = (
  payload: Omit<Subject, "id">
): Promise<Subject> => subjectsApiAdapter.createSubject(payload);

export const updateSubject = (
  subjectId: string,
  payload: Partial<Omit<Subject, "id">>
): Promise<Subject> => subjectsApiAdapter.updateSubject(subjectId, payload);

export const deleteSubject = (subjectId: string): Promise<void> =>
  subjectsApiAdapter.deleteSubject(subjectId);

// Direct API Delegation for Allocations
export const fetchSubjectAllocations = (
  termId: string,
  filters?: { gradeId?: string; subjectId?: string },
): Promise<SubjectAllocation[]> =>
  subjectsApiAdapter.fetchSubjectAllocations(termId, filters);
export const bulkUpsertSubjectAllocations = (
  termId: string,
  items: SubjectAllocation[],
): Promise<void> =>
  subjectsApiAdapter.bulkUpsertSubjectAllocations(termId, items);
