import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

import {
  createReinforcementTemplate,
  listReinforcementTemplates,
  serializeCreateReinforcementTemplatePayload,
} from "@/features/reinforcement/services/reinforcementTemplatesService";
import { getReinforcementFilterOptions } from "@/features/reinforcement/services/reinforcementFilterOptionsService";
import {
  cancelReinforcementTask,
  createReinforcementTask,
  duplicateReinforcementTask,
  getReinforcementTask,
  listReinforcementTasks,
} from "@/features/reinforcement/services/reinforcementTasksService";
import {
  createXpPolicy,
  getEffectiveXpPolicy,
  getXpSummary,
  grantManualXp,
  listXpLedger,
  listXpPolicies,
  patchXpPolicy,
} from "@/features/reinforcement/services/reinforcementXpService";
import {
  getClassroomReinforcementSummary,
  getReinforcementOverview,
  getStudentReinforcementProgress,
} from "@/features/reinforcement/services/reinforcementOverviewService";

describe("Sprint 5A reinforcement service endpoint contracts", () => {
  beforeEach(() => {
    apiMocks.apiGet.mockReset().mockResolvedValue({});
    apiMocks.apiPost.mockReset().mockResolvedValue({});
    apiMocks.apiPatch.mockReset().mockResolvedValue({});
  });

  it("lists and creates reinforcement templates through documented endpoints", async () => {
    apiMocks.apiGet.mockResolvedValueOnce({
      items: [{ id: "tpl-1", nameEn: "Helper", nameAr: "مساعد" }],
      total: 1,
    });
    apiMocks.apiPost.mockResolvedValueOnce({
      data: { id: "tpl-2", nameEn: "Leader", nameAr: "قائد" },
    });

    const templates = await listReinforcementTemplates({
      search: "helper",
      source: "teacher",
      includeDeleted: true,
    });
    const created = await createReinforcementTemplate({
      nameEn: "Leader",
      nameAr: "قائد",
      source: "teacher",
      reward: { type: "badge" },
      stages: [
        {
          sortOrder: 1,
          titleEn: "Do it",
          titleAr: "نفذ",
          proofType: "none",
        },
      ],
    });

    expect(templates.items).toHaveLength(1);
    expect(templates.total).toBe(1);
    expect(created.id).toBe("tpl-2");
    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/reinforcement/templates?search=helper&source=teacher&includeDeleted=true",
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/reinforcement/templates",
      expect.objectContaining({
        nameEn: "Leader",
        rewardType: "badge",
        stages: [
          {
            sortOrder: 1,
            titleEn: "Do it",
            titleAr: "نفذ",
            proofType: "none",
          },
        ],
      }),
    );
  });

  it("serializes template create payload with proof settings only inside stages", () => {
    const payload = {
      nameEn: "Reading challenge",
      nameAr: "تحدي القراءة",
      descriptionEn: "",
      descriptionAr: undefined,
      source: "teacher",
      reward: {
        type: "xp",
        value: 20,
        labelEn: "20 XP",
        labelAr: "",
      },
      proofType: "image",
      requiresApproval: true,
      stages: [
        {
          sortOrder: 1,
          titleEn: "Complete reading task",
          titleAr: "إكمال مهمة القراءة",
          descriptionEn: undefined,
          descriptionAr: "",
          proofType: "none",
          requiresApproval: true,
        },
      ],
    } satisfies Parameters<typeof serializeCreateReinforcementTemplatePayload>[0] &
      Record<string, unknown>;

    const serialized = serializeCreateReinforcementTemplatePayload(payload);

    expect(serialized).toEqual({
      nameEn: "Reading challenge",
      nameAr: "تحدي القراءة",
      source: "teacher",
      rewardType: "xp",
      rewardValue: 20,
      rewardLabelEn: "20 XP",
      stages: [
        {
          sortOrder: 1,
          titleEn: "Complete reading task",
          titleAr: "إكمال مهمة القراءة",
          proofType: "none",
          requiresApproval: true,
        },
      ],
    });
    expect(serialized).not.toHaveProperty("reward");
    expect(serialized).not.toHaveProperty("proofType");
    expect(serialized).not.toHaveProperty("requiresApproval");
    expect(JSON.stringify(serialized)).not.toContain("undefined");
    expect(JSON.stringify(serialized)).not.toContain("descriptionAr");
  });

  it("supports wrapped and plain array task list responses", async () => {
    apiMocks.apiGet
      .mockResolvedValueOnce([{ id: "task-1", titleEn: "Plain" }])
      .mockResolvedValueOnce({ data: { items: [{ id: "task-2" }] } });

    const plain = await listReinforcementTasks({ status: "in_progress" });
    const wrapped = await listReinforcementTasks({ includeCancelled: true });

    expect(plain.items).toEqual([{ id: "task-1", titleEn: "Plain" }]);
    expect(wrapped.items).toEqual([{ id: "task-2" }]);
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      1,
      "/reinforcement/tasks?status=in_progress",
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      2,
      "/reinforcement/tasks?includeCancelled=true",
    );
  });

  it("uses documented task create, detail, duplicate, and cancel endpoints", async () => {
    apiMocks.apiPost.mockResolvedValue({ id: "task-1" });
    apiMocks.apiGet.mockResolvedValue({ data: { id: "task-1" } });

    await createReinforcementTask({
      academicYearId: "year-1",
      termId: "term-1",
      titleEn: "Read",
      titleAr: "اقرأ",
      source: "teacher",
      rewardType: "xp",
      rewardValue: 10,
      dueDate: "2026-05-21",
      targets: [{ scopeType: "student", scopeId: "student-1" }],
      stages: [
        {
          sortOrder: 1,
          titleEn: "Submit",
          titleAr: "إرسال",
          proofType: "document",
        },
      ],
    });
    await getReinforcementTask("task-1");
    await duplicateReinforcementTask("task-1", { dueDate: "2026-05-28" });
    await cancelReinforcementTask(
      "task-1",
      {
        reason: "No longer needed",
        reasonAr: "لم تعد مطلوبة",
      } as Parameters<typeof cancelReinforcementTask>[1] & {
        reasonAr: string;
      },
    );

    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      1,
      "/reinforcement/tasks",
      expect.objectContaining({
        dueDate: "2026-05-21",
        targets: [{ scopeType: "student", scopeId: "student-1" }],
      }),
    );
    expect(apiMocks.apiGet).toHaveBeenCalledWith("/reinforcement/tasks/task-1");
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      2,
      "/reinforcement/tasks/task-1/duplicate",
      { dueDate: "2026-05-28" },
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      3,
      "/reinforcement/tasks/task-1/cancel",
      { reason: "No longer needed" },
    );
  });

  it("uses documented filter options, overview, student progress, and classroom summary endpoints", async () => {
    await getReinforcementFilterOptions({ academicYearId: "year-1" });
    await getReinforcementOverview({ termId: "term-1" });
    await getStudentReinforcementProgress("student-1", { termId: "term-1" });
    await getClassroomReinforcementSummary("classroom-1", {
      termId: "term-1",
    });

    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      1,
      "/reinforcement/filter-options?academicYearId=year-1",
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      2,
      "/reinforcement/overview?termId=term-1",
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      3,
      "/reinforcement/students/student-1/progress?termId=term-1",
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      4,
      "/reinforcement/classrooms/classroom-1/summary?termId=term-1",
    );
  });

  it("uses documented XP endpoints and payloads", async () => {
    await listXpPolicies({
      academicYearId: "year-1",
      yearId: "legacy-year-1",
      termId: "term-1",
      isActive: true,
      includeDeleted: true,
    });
    await getEffectiveXpPolicy({
      yearId: "legacy-year-1",
      studentId: "student-1",
      termId: "term-1",
    });
    const createPolicyPayload = {
      academicYearId: "year-1",
      yearId: "legacy-year-1",
      termId: "term-1",
      scopeType: "school",
      dailyCap: 20,
      weeklyCap: 100,
    } satisfies Parameters<typeof createXpPolicy>[0] & Record<string, unknown>;
    await createXpPolicy(createPolicyPayload);
    await patchXpPolicy("policy-1", { dailyCap: 30 });
    const manualGrantPayload = {
      academicYearId: "year-1",
      yearId: "legacy-year-1",
      termId: "term-1",
      studentId: "student-1",
      enrollmentId: "enrollment-1",
      amount: 5,
      reason: "helpful",
      dedupeKey: "grant-1",
    } satisfies Parameters<typeof grantManualXp>[0] & Record<string, unknown>;
    await grantManualXp(manualGrantPayload);
    await listXpLedger({ yearId: "legacy-year-1", studentId: "student-1" });
    await getXpSummary({
      academicYearId: "year-1",
      termId: "term-1",
      studentId: "student-1",
    });

    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      1,
      "/reinforcement/xp/policies?academicYearId=year-1&termId=term-1&isActive=true&includeDeleted=true",
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      2,
      "/reinforcement/xp/policies/effective?academicYearId=legacy-year-1&studentId=student-1&termId=term-1",
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      1,
      "/reinforcement/xp/policies",
      expect.not.objectContaining({ yearId: "legacy-year-1" }),
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      1,
      "/reinforcement/xp/policies",
      expect.objectContaining({
        academicYearId: "year-1",
        dailyCap: 20,
        weeklyCap: 100,
      }),
    );
    expect(apiMocks.apiPatch).toHaveBeenCalledWith(
      "/reinforcement/xp/policies/policy-1",
      { dailyCap: 30 },
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      2,
      "/reinforcement/xp/grants/manual",
      expect.not.objectContaining({ yearId: "legacy-year-1" }),
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      2,
      "/reinforcement/xp/grants/manual",
      expect.objectContaining({
        academicYearId: "year-1",
        studentId: "student-1",
        enrollmentId: "enrollment-1",
        dedupeKey: "grant-1",
      }),
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      3,
      "/reinforcement/xp/ledger?academicYearId=legacy-year-1&studentId=student-1",
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      4,
      "/reinforcement/xp/summary?academicYearId=year-1&termId=term-1&studentId=student-1",
    );
  });
});
