import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AcademicContentFilePolicy } from "../../types/contracts";
import { useAcademicContentFilePolicy } from "../useAcademicContentFilePolicy";

const api = vi.hoisted(() => ({
  getAcademicContentFilePolicy: vi.fn(),
}));

vi.mock("../../services/academicContentApi", () => ({
  getAcademicContentFilePolicy: api.getAcademicContentFilePolicy,
}));

const filePolicy: AcademicContentFilePolicy = {
  attachmentsEnabled: true,
  maximumFileSizeBytes: "10485760",
  documentsEnabled: true,
  imagesEnabled: true,
  videosEnabled: false,
  audioEnabled: false,
  archivesEnabled: false,
  otherFilesEnabled: false,
  allowStudentDownload: true,
  allowGuardianDownload: false,
  allowInlinePreview: true,
};

describe("useAcademicContentFilePolicy", () => {
  beforeEach(() => {
    api.getAcademicContentFilePolicy.mockReset();
  });

  it("loads every school file-policy flag and supports retry", async () => {
    api.getAcademicContentFilePolicy
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(filePolicy);

    const { result } = renderHook(() => useAcademicContentFilePolicy());

    await waitFor(() => expect(result.current.error?.message).toBe(
      "This action could not be completed. Try again; contact support if the problem continues.",
    ));
    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.policy).toEqual(filePolicy);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("does not request policy when loading is disabled", () => {
    const { result } = renderHook(() => useAcademicContentFilePolicy(false));

    expect(api.getAcademicContentFilePolicy).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });
});
