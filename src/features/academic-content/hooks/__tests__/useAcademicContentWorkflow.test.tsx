import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import type {
  AcademicContentApprovalHistoryResponse,
  AcademicContentTransitionResponse,
} from "../../types/contracts";
import { useAcademicContentWorkflow } from "../useAcademicContentWorkflow";

const api = vi.hoisted(() => ({
  getAcademicContentWorkflowPolicy: vi.fn(),
  listAcademicContentApprovalHistory: vi.fn(),
  submitAcademicContent: vi.fn(),
}));

vi.mock("../../services/academicContentApi", () => api);

const emptyHistory: AcademicContentApprovalHistoryResponse = {
  items: [],
  page: 1,
  limit: 50,
  total: 0,
};

const submitted: AcademicContentTransitionResponse = {
  contentId: "content-1",
  contentStatus: "SUBMITTED",
  approvalId: "approval-1",
  approvalStatus: "PENDING",
  revisionId: "revision-1",
  roundNumber: 1,
  submittedAt: "2026-10-02T08:00:00.000Z",
  decidedAt: null,
};

describe("useAcademicContentWorkflow", () => {
  beforeEach(() => {
    api.getAcademicContentWorkflowPolicy.mockReset().mockResolvedValue({
      preparationApprovalRequired: true,
    });
    api.listAcademicContentApprovalHistory.mockReset().mockResolvedValue(emptyHistory);
    api.submitAcademicContent.mockReset().mockResolvedValue(submitted);
  });

  it("loads policy and newest-first approval history", async () => {
    const { result } = renderHook(() => useAcademicContentWorkflow("content-1"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(api.getAcademicContentWorkflowPolicy).toHaveBeenCalledOnce();
    expect(api.listAcademicContentApprovalHistory).toHaveBeenCalledWith(
      "content-1",
      { page: 1, limit: 50 },
    );
    expect(result.current.policy?.preparationApprovalRequired).toBe(true);
    expect(result.current.history).toEqual(emptyHistory);
  });

  it("returns the transition and refreshes history without fabricating a round", async () => {
    api.listAcademicContentApprovalHistory
      .mockResolvedValueOnce(emptyHistory)
      .mockResolvedValueOnce(emptyHistory);
    const { result } = renderHook(() => useAcademicContentWorkflow("content-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let transition: AcademicContentTransitionResponse | null = null;
    await act(async () => {
      transition = await result.current.submit();
    });

    expect(transition).toEqual(submitted);
    expect(api.submitAcademicContent).toHaveBeenCalledWith("content-1");
    expect(api.listAcademicContentApprovalHistory).toHaveBeenCalledTimes(2);
    expect(result.current.history?.items).toEqual([]);
  });

  it("keeps the server error available when submission fails", async () => {
    api.submitAcademicContent.mockRejectedValue(
      new ApiError("Preparation is not ready", 409, "CONTENT_NOT_READY"),
    );
    const { result } = renderHook(() => useAcademicContentWorkflow("content-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      expect(await result.current.submit()).toBeNull();
    });

    expect(result.current.error?.message).toBe("Preparation is not ready");
  });

  it("keeps a successful transition when refreshing history fails", async () => {
    api.listAcademicContentApprovalHistory
      .mockResolvedValueOnce(emptyHistory)
      .mockRejectedValueOnce(new ApiError("History unavailable", 503, "UNAVAILABLE"));
    const { result } = renderHook(() => useAcademicContentWorkflow("content-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let transition: AcademicContentTransitionResponse | null = null;
    await act(async () => {
      transition = await result.current.submit();
    });

    expect(transition).toEqual(submitted);
    expect(result.current.error?.message).toBe("History unavailable");
  });
});
