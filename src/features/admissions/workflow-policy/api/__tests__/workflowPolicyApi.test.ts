import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ apiGet: vi.fn(), apiPatch: vi.fn() }));
vi.mock("@/lib/api", () => api);

import { getAdmissionWorkflowPolicy, updateAdmissionWorkflowPolicy } from "../workflowPolicyApi";

const policy = { requiresPlacementTest: true, requiresInterview: true, allowDirectAcceptance: false, source: "default" as const, updatedAt: null };

describe("workflow policy API", () => {
  beforeEach(() => { vi.clearAllMocks(); api.apiGet.mockResolvedValue(policy); api.apiPatch.mockResolvedValue({ ...policy, requiresInterview: false, source: "school_override" }); });

  it("uses the school workflow policy GET route", async () => {
    await expect(getAdmissionWorkflowPolicy()).resolves.toEqual(policy);
    expect(api.apiGet).toHaveBeenCalledWith("/admissions/workflow-policy");
  });

  it("sends only supplied policy fields to PATCH", async () => {
    await updateAdmissionWorkflowPolicy({ requiresInterview: false });
    expect(api.apiPatch).toHaveBeenCalledWith("/admissions/workflow-policy", { requiresInterview: false });
  });

  it("rejects an empty update before transport", async () => {
    await expect(updateAdmissionWorkflowPolicy({})).rejects.toThrow("At least one workflow policy field is required");
    expect(api.apiPatch).not.toHaveBeenCalled();
  });
});
