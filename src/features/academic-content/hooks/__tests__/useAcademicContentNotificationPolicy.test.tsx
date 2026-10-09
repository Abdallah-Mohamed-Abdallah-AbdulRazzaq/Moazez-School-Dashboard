import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AcademicContentNotificationPolicy } from "../../types/contracts";
import { useAcademicContentNotificationPolicy } from "../useAcademicContentNotificationPolicy";

const api = vi.hoisted(() => ({
  getAcademicContentNotificationPolicy: vi.fn(),
  updateAcademicContentNotificationPolicy: vi.fn(),
}));

vi.mock("../../services/academicContentApi", () => api);

const policy: AcademicContentNotificationPolicy = {
  notificationsEnabled: true,
  studentNotificationsEnabled: true,
  guardianNotificationsEnabled: true,
  weeklyPlanNotificationsEnabled: true,
  guardianWeeklyNoteNotificationsEnabled: true,
  subjectResourceNotificationsEnabled: true,
  onlineSessionNotificationsEnabled: true,
  generalResourceNotificationsEnabled: true,
  significantUpdateNotificationsEnabled: true,
  cancellationNotificationsEnabled: true,
  onlineSessionRemindersEnabled: true,
  onlineSessionReminderOffsetsMinutes: [30, 60],
};

describe("useAcademicContentNotificationPolicy", () => {
  beforeEach(() => {
    api.getAcademicContentNotificationPolicy.mockReset();
    api.updateAcademicContentNotificationPolicy.mockReset();
  });

  it("loads the complete policy and retries a recoverable failure", async () => {
    api.getAcademicContentNotificationPolicy
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(policy);
    const { result } = renderHook(() => useAcademicContentNotificationPolicy());

    await waitFor(() => expect(result.current.error?.message).toBe(
      "This action could not be completed. Try again; contact support if the problem continues.",
    ));
    await act(async () => result.current.reload());

    expect(result.current.draft).toEqual(policy);
    expect(result.current.error).toBeNull();
  });

  it("patches only changed fields and preserves reminder offsets when disabled", async () => {
    api.getAcademicContentNotificationPolicy.mockResolvedValue(policy);
    api.updateAcademicContentNotificationPolicy.mockImplementation(
      async (changes: Partial<AcademicContentNotificationPolicy>) => ({
        ...policy,
        ...changes,
      }),
    );
    const { result } = renderHook(() => useAcademicContentNotificationPolicy());
    await waitFor(() => expect(result.current.draft).toEqual(policy));

    act(() => {
      result.current.updateDraft({ onlineSessionRemindersEnabled: false });
    });
    await act(async () => {
      await result.current.save();
    });

    expect(api.updateAcademicContentNotificationPolicy).toHaveBeenCalledWith({
      onlineSessionRemindersEnabled: false,
    });
    expect(result.current.draft?.onlineSessionReminderOffsetsMinutes).toEqual([
      30, 60,
    ]);
    expect(result.current.saved).toBe(true);
  });

  it("ignores a stale load that resolves after a newer retry", async () => {
    let resolveFirst!: (value: AcademicContentNotificationPolicy) => void;
    api.getAcademicContentNotificationPolicy
      .mockImplementationOnce(
        () =>
          new Promise<AcademicContentNotificationPolicy>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce({ ...policy, notificationsEnabled: false });
    const { result } = renderHook(() =>
      useAcademicContentNotificationPolicy(),
    );
    await waitFor(() =>
      expect(api.getAcademicContentNotificationPolicy).toHaveBeenCalledOnce(),
    );

    await act(async () => result.current.reload());
    act(() => resolveFirst(policy));

    await waitFor(() =>
      expect(result.current.draft?.notificationsEnabled).toBe(false),
    );
  });
});
