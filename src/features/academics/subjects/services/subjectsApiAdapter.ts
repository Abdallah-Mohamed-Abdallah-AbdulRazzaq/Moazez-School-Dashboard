import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import type {
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import type { SubjectsAdapter } from "@/features/academics/subjects/services/subjectsAdapter";

interface SubjectAllocationPayload {
  gradeId: string;
  subjectId: string;
  weeklyHours: number;
}

export const createSubjectsApiAdapter = (
  basePath: string = "/academics/subjects",
  allocationPath: string = "/academics/subject-allocations",
): SubjectsAdapter => ({
  async fetchSubjects() {
    const response = await apiGet<unknown>(basePath);
    if (Array.isArray(response)) return response as Subject[];
    if (isObjectRecord(response) && Array.isArray(response.data)) {
      return response.data as Subject[];
    }
    if (isObjectRecord(response) && Array.isArray(response.items)) {
      return response.items as Subject[];
    }
    if (isObjectRecord(response) && Array.isArray(response.subjects)) {
      return response.subjects as Subject[];
    }
    return [];
  },

  async createSubject(payload) {
    const response = await apiPost<unknown>(basePath, payload);
    return subjectFromResponse(response);
  },

  async updateSubject(subjectId, payload) {
    const response = await apiPatch<unknown>(`${basePath}/${subjectId}`, payload);
    return subjectFromResponse(response);
  },

  async deleteSubject(subjectId) {
    await apiDelete<void>(`${basePath}/${subjectId}`);
  },

  async fetchSubjectAllocations(termId, filters) {
    const response = await apiGet<{ items: SubjectAllocation[] }>(allocationPath, {
      params: {
        termId,
        ...(filters?.gradeId ? { gradeId: filters.gradeId } : {}),
        ...(filters?.subjectId ? { subjectId: filters.subjectId } : {}),
      },
    });
    return response.items;
  },

  async bulkUpsertSubjectAllocations(termId, items) {
    await apiPut<{ items: SubjectAllocation[] }>(`${allocationPath}/bulk`, {
      termId,
      items: items.map(
        (subjectAllocation): SubjectAllocationPayload => ({
          gradeId: subjectAllocation.gradeId,
          subjectId: subjectAllocation.subjectId,
          weeklyHours: subjectAllocation.weeklyHours,
        })
      ),
    });
  },

});

export const subjectsApiAdapter = createSubjectsApiAdapter();

export type { Subject, SubjectAllocation };

function subjectFromResponse(response: unknown): Subject {
  if (isObjectRecord(response) && isObjectRecord(response.data)) {
    return response.data as unknown as Subject;
  }
  if (isObjectRecord(response) && isObjectRecord(response.item)) {
    return response.item as unknown as Subject;
  }
  if (isObjectRecord(response) && isObjectRecord(response.subject)) {
    return response.subject as unknown as Subject;
  }
  return response as Subject;
}

function isObjectRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input && typeof input === "object");
}
