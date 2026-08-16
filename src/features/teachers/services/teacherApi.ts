import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  ChangeTeacherEmploymentStatusRequest,
  CreateTeacherRequest,
  RehireTeacherRequest,
  TeacherDirectoryDetail,
  TeacherEmploymentStatusResponse,
  TeacherListQuery,
  TeachersListResponse,
  UpdateTeacherRequest,
} from "@/features/teachers/types/index";

const TEACHERS_PATH = "/teachers";

export const teacherApi = {
  list: (query: TeacherListQuery = {}) =>
    apiGet<TeachersListResponse>(TEACHERS_PATH, { params: query }),
  get: (teacherId: string) =>
    apiGet<TeacherDirectoryDetail>(`${TEACHERS_PATH}/${teacherId}`),
  create: (input: CreateTeacherRequest) =>
    apiPost<TeacherDirectoryDetail>(TEACHERS_PATH, input),
  update: (teacherId: string, input: UpdateTeacherRequest) =>
    apiPatch<TeacherDirectoryDetail>(`${TEACHERS_PATH}/${teacherId}`, input),
  changeEmploymentStatus: (
    teacherId: string,
    input: ChangeTeacherEmploymentStatusRequest,
  ) =>
    apiPatch<TeacherEmploymentStatusResponse>(
      `${TEACHERS_PATH}/${teacherId}/employment-status`,
      input,
    ),
  archive: async (teacherId: string) => {
    await apiDelete<void>(`${TEACHERS_PATH}/${teacherId}`);
  },
  rehire: (teacherId: string, input: RehireTeacherRequest) =>
    apiPost<TeacherDirectoryDetail>(
      `${TEACHERS_PATH}/${teacherId}/rehire`,
      input,
    ),
};
