import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { CreateTeacherRequest, RehireTeacherRequest } from "@/features/teachers/types";
import { teacherApi } from "../teacherApi";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

describe("teacherApi", () => {
  const teacherIdentity = {
    teacherCode: "TCH-001",
    firstNameAr: "نور",
    lastNameAr: "علي",
    firstNameEn: "Nour",
    lastNameEn: "Ali",
    preferredDisplayLanguage: "EN",
    gender: "FEMALE",
  } as const;

  const createInput: CreateTeacherRequest = {
    ...teacherIdentity,
    username: "nour.ali",
    employmentStatus: "INACTIVE",
  };

  const rehireInput: RehireTeacherRequest = teacherIdentity;

  beforeEach(() => vi.clearAllMocks());

  it("sends list filters as Axios query params", async () => {
    vi.mocked(apiGet).mockResolvedValue({ items: [], pagination: { page: 1, limit: 20, total: 0 } });
    await teacherApi.list({ employmentStatus: "ACTIVE", page: 1, limit: 20 });
    expect(apiGet).toHaveBeenCalledWith("/teachers", { params: { employmentStatus: "ACTIVE", page: 1, limit: 20 } });
  });

  it.each([
    ["get", () => teacherApi.get("teacher-1"), apiGet, "/teachers/teacher-1"],
    ["archive", () => teacherApi.archive("teacher-1"), apiDelete, "/teachers/teacher-1"],
  ])("uses the correct path for %s", async (_, call, boundary, path) => {
    vi.mocked(boundary).mockResolvedValue(undefined as never);
    await call();
    expect(boundary).toHaveBeenCalledWith(path);
  });

  it("uses dedicated mutation endpoints", async () => {
    vi.mocked(apiPost).mockResolvedValue({} as never);
    vi.mocked(apiPatch).mockResolvedValue({} as never);
    await teacherApi.create(createInput);
    await teacherApi.update("teacher-1", { department: "Science" });
    await teacherApi.changeEmploymentStatus("teacher-1", { employmentStatus: "INACTIVE" });
    await teacherApi.rehire("teacher-1", rehireInput);
    expect(apiPost).toHaveBeenNthCalledWith(1, "/teachers", createInput);
    expect(apiPatch).toHaveBeenNthCalledWith(1, "/teachers/teacher-1", { department: "Science" });
    expect(apiPatch).toHaveBeenNthCalledWith(2, "/teachers/teacher-1/employment-status", { employmentStatus: "INACTIVE" });
    expect(apiPost).toHaveBeenNthCalledWith(2, "/teachers/teacher-1/rehire", rehireInput);
  });
});
