import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import {
  createPolicy,
  deletePolicy,
  fetchEffectiveAttendancePolicy,
  fetchPolicies,
  resolveEffectiveExcusePolicy,
  updatePolicy,
  validatePolicyName,
  isAttendancePolicyConflict,
} from "@/features/attendance/policies/services/attendancePolicyService";

vi.mock("@/lib/api", () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock(
  "@/features/academics/timetable/services/timetableConfigService",
  () => ({
    fetchTimetableConfigs: vi.fn().mockResolvedValue([]),
  }),
);

const mockedApiDelete = vi.mocked(apiDelete);
const mockedApiGet = vi.mocked(apiGet);
const mockedApiPatch = vi.mocked(apiPatch);
const mockedApiPost = vi.mocked(apiPost);

describe("attendancePolicyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists policies from the backend attendance policy endpoint", async () => {
    mockedApiGet.mockResolvedValueOnce({
      items: [
        {
          id: "policy-1",
          academicYearId: "year-1",
          termId: "term-1",
          nameAr: "Default",
          nameEn: "Default",
          scopeType: "CLASSROOM",
          scopeKey: "classroom:classroom-1",
          scopeIds: { classroomId: "classroom-1" },
          mode: "PERIOD",
          selectedPeriodIds: ["period-1"],
          lateThresholdMinutes: 10,
          earlyLeaveThresholdMinutes: 10,
          allowExcuses: true,
          requireExcuseReason: true,
          requireAttachmentForExcuse: false,
          notifyTeachers: true,
          notifyStudents: false,
          notifyGuardians: true,
          notifyOnAbsent: true,
          notifyOnLate: true,
          notifyOnEarlyLeave: false,
          effectiveStartDate: "2026-02-01",
          effectiveEndDate: "2026-02-28",
          isActive: true,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });

    await expect(fetchPolicies("year-1", "term-1")).resolves.toEqual([
      expect.objectContaining({
        id: "policy-1",
        yearId: "year-1",
        scopeIds: { classroomId: "classroom-1" },
      }),
    ]);

    expect(mockedApiGet).toHaveBeenCalledWith("/attendance/policies", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
      },
    });
  });

  it("uses the backend-selected policy for the requested roll-call context", async () => {
    mockedApiGet.mockResolvedValueOnce({
      policy: {
        id: "policy-1",
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "CLASSROOM",
        scopeIds: { classroomId: "classroom-1" },
        mode: "PERIOD",
      },
    });

    await expect(
      fetchEffectiveAttendancePolicy({
        yearId: "year-1",
        termId: "term-1",
        scopeType: "CLASSROOM",
        scopeIds: { classroomId: "classroom-1" },
        date: "2026-02-10",
      }),
    ).resolves.toMatchObject({
      id: "policy-1",
      scopeType: "CLASSROOM",
      scopeIds: { classroomId: "classroom-1" },
    });

    expect(mockedApiGet).toHaveBeenCalledWith("/attendance/policies/effective", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "CLASSROOM",
        classroomId: "classroom-1",
        date: "2026-02-10",
      },
    });
  });

  it("preserves the single notes from the policy response", async () => {
    mockedApiGet.mockResolvedValueOnce({
      items: [
        {
          id: "policy-1",
          academicYearId: "year-1",
          termId: "term-1",
          nameAr: "سياسة الحضور",
          nameEn: "Attendance policy",
          notes: "Policy notes",
          scopeType: "SCHOOL",
        },
      ],
    });

    await expect(fetchPolicies("year-1", "term-1")).resolves.toEqual([
      expect.objectContaining({
        notes: "Policy notes",
      }),
    ]);
  });

  it("uses the documented create, update, delete, and effective policy contracts", async () => {
    const payload = {
      yearId: "year-1",
      termId: "term-1",
      nameAr: "Class policy",
      nameEn: "Class policy",
      scopeType: "CLASSROOM" as const,
      scopeIds: { classroomId: "classroom-1" },
      mode: "PERIOD" as const,
      selectedPeriodIds: ["period-1"],
      lateThresholdMinutes: 10,
      earlyLeaveThresholdMinutes: 10,
      absentIfMissedPeriodsCount: 1,
      allowExcuses: true,
      requireExcuseReason: false,
      requireAttachmentForExcuse: false,
      notifyTeachers: true,
      notifyStudents: false,
      notifyGuardians: true,
      notifyOnAbsent: true,
      notifyOnLate: true,
      notifyOnEarlyLeave: false,
      effectiveStartDate: "2026-02-01",
      effectiveEndDate: "2026-02-28",
      isActive: true,
    };

    mockedApiPost.mockResolvedValueOnce({
      id: "policy-1",
      ...payload,
      academicYearId: "year-1",
    });
    mockedApiPatch.mockResolvedValueOnce({
      id: "policy-1",
      ...payload,
      academicYearId: "year-1",
    });
    mockedApiDelete.mockResolvedValueOnce({ ok: true });
    mockedApiGet.mockResolvedValueOnce({
      policy: { id: "policy-1", ...payload, academicYearId: "year-1" },
    });

    await createPolicy(payload);
    await updatePolicy("policy-1", { isActive: false });
    await deletePolicy("policy-1");
    await resolveEffectiveExcusePolicy(
      "year-1",
      "term-1",
      "CLASSROOM",
      { classroomId: "classroom-1" },
      "2026-02-10",
    );

    expect(mockedApiPost).toHaveBeenCalledWith("/attendance/policies", {
      academicYearId: "year-1",
      termId: "term-1",
      nameAr: "Class policy",
      nameEn: "Class policy",
      descriptionAr: undefined,
      descriptionEn: undefined,
      notes: null,
      scopeType: "CLASSROOM",
      scopeIds: { classroomId: "classroom-1" },
      classroomId: "classroom-1",
      mode: "PERIOD",
      dailyComputationStrategy: "DERIVED_FROM_PERIODS",
      selectedPeriodIds: ["period-1"],
      lateThresholdMinutes: 10,
      earlyLeaveThresholdMinutes: 10,
      autoAbsentAfterMinutes: null,
      absentIfMissedPeriodsCount: 1,
      allowParentExcuseRequests: true,
      allowExcuses: true,
      requireExcuseReason: false,
      requireExcuseAttachment: false,
      requireAttachmentForExcuse: false,
      notifyGuardiansOnAbsence: true,
      notifyTeachers: true,
      notifyStudents: false,
      notifyGuardians: true,
      notifyOnAbsent: true,
      notifyOnLate: true,
      notifyOnEarlyLeave: false,
      effectiveFrom: "2026-02-01",
      effectiveStartDate: "2026-02-01",
      effectiveTo: "2026-02-28",
      effectiveEndDate: "2026-02-28",
      isActive: true,
    });
    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/attendance/policies/policy-1",
      { isActive: false },
    );
    expect(mockedApiDelete).toHaveBeenCalledWith(
      "/attendance/policies/policy-1",
    );
    expect(mockedApiGet).toHaveBeenCalledWith(
      "/attendance/policies/effective",
      {
        params: {
          academicYearId: "year-1",
          termId: "term-1",
          scopeType: "CLASSROOM",
          classroomId: "classroom-1",
          date: "2026-02-10",
        },
      },
    );
  });

  it("returns null when the backend has no effective policy", async () => {
    mockedApiGet.mockResolvedValueOnce({
      policy: null,
      requestedScope: { scopeType: "SCHOOL", scopeKey: "school" },
      matchedScope: null,
    });

    await expect(
      resolveEffectiveExcusePolicy(
        "year-1",
        "term-1",
        "SCHOOL",
        {},
        "2026-02-10",
      ),
    ).resolves.toBeNull();
  });

  it("preserves nullable thresholds and effective dates from the backend", async () => {
    mockedApiGet.mockResolvedValueOnce({
      items: [
        {
          id: "policy-nullable",
          academicYearId: "year-1",
          termId: "term-1",
          nameAr: "سياسة اختيارية",
          nameEn: "Optional policy",
          scopeType: "SCHOOL",
          mode: "DAILY",
          lateThresholdMinutes: null,
          earlyLeaveThresholdMinutes: null,
          effectiveStartDate: null,
          effectiveEndDate: null,
          isActive: true,
        },
      ],
    });

    await expect(fetchPolicies("year-1", "term-1")).resolves.toEqual([
      expect.objectContaining({
        lateThresholdMinutes: null,
        earlyLeaveThresholdMinutes: null,
        effectiveStartDate: null,
        effectiveEndDate: null,
      }),
    ]);
  });

  it("sends optional list filters without adding undefined query values", async () => {
    mockedApiGet.mockResolvedValueOnce({ items: [] });

    await fetchPolicies("year-1", "term-1", {
      scopeType: "CLASSROOM",
      classroomId: "classroom-1",
      isActive: false,
    });

    expect(mockedApiGet).toHaveBeenCalledWith("/attendance/policies", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "CLASSROOM",
        classroomId: "classroom-1",
        isActive: false,
      },
    });
  });

  it("validates both policy names for a scope and includes the edited policy id", async () => {
    mockedApiGet.mockResolvedValueOnce({
      uniqueAr: false,
      uniqueEn: true,
      available: false,
    });

    await expect(
      validatePolicyName({
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "CLASSROOM",
        scopeIds: { classroomId: "classroom-1" },
        nameAr: "سياسة الفصل",
        nameEn: "Class policy",
        excludeId: "policy-1",
      }),
    ).resolves.toEqual({ uniqueAr: false, uniqueEn: true, available: false });

    expect(mockedApiGet).toHaveBeenCalledWith(
      "/attendance/policies/validate-name",
      {
        params: {
          academicYearId: "year-1",
          termId: "term-1",
          scopeType: "CLASSROOM",
          classroomId: "classroom-1",
          nameAr: "سياسة الفصل",
          nameEn: "Class policy",
          excludeId: "policy-1",
        },
      },
    );
  });

  it("rejects malformed name-validation responses", async () => {
    mockedApiGet.mockResolvedValueOnce({ available: true });

    await expect(
      validatePolicyName({
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "SCHOOL",
        nameAr: "سياسة",
        nameEn: "Policy",
      }),
    ).rejects.toThrow("Invalid attendance policy name validation response");
  });

  it("rejects list items without a policy identity", async () => {
    mockedApiGet.mockResolvedValueOnce({
      items: [{ academicYearId: "year-1", termId: "term-1", nameEn: "Policy" }],
    });

    await expect(fetchPolicies("year-1", "term-1")).rejects.toThrow(
      "Invalid attendance policy response",
    );
  });

  it("recognizes only the attendance policy scope conflict code", () => {
    expect(
      isAttendancePolicyConflict(
        new ApiError(
          "An active policy already exists for this scope",
          409,
          "attendance.policy.conflict",
        ),
      ),
    ).toBe(true);
    expect(
      isAttendancePolicyConflict(new ApiError("Other", 409, "other.conflict")),
    ).toBe(false);
    expect(
      isAttendancePolicyConflict(new Error("attendance.policy.conflict")),
    ).toBe(false);
  });
});
