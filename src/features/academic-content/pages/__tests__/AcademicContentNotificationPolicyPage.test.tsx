import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AcademicContentNotificationPolicy } from "../../types/contracts";
import AcademicContentNotificationPolicyPage from "../AcademicContentNotificationPolicyPage";

const mocks = vi.hoisted(() => ({
  canManage: true,
  save: vi.fn(),
  updateDraft: vi.fn(),
  reload: vi.fn(),
}));

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

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: () => mocks.canManage }),
}));
vi.mock("../../hooks/useAcademicContentNotificationPolicy", () => ({
  useAcademicContentNotificationPolicy: () => ({
    policy,
    draft: policy,
    isLoading: false,
    isSaving: false,
    error: null,
    saved: false,
    isDirty: false,
    reload: mocks.reload,
    updateDraft: mocks.updateDraft,
    save: mocks.save,
  }),
}));

describe("AcademicContentNotificationPolicyPage", () => {
  beforeEach(() => {
    mocks.canManage = true;
    mocks.save.mockReset().mockResolvedValue(true);
    mocks.updateDraft.mockReset();
    mocks.reload.mockReset();
  });

  it("renders every contract field and becomes read-only without permission", () => {
    mocks.canManage = false;
    render(<AcademicContentNotificationPolicyPage />);

    expect(screen.getAllByRole("checkbox")).toHaveLength(11);
    expect(screen.getByLabelText("Reminder offsets in minutes")).toHaveValue(
      "30, 60",
    );
    expect(screen.getAllByRole("checkbox")[0]).toBeDisabled();
    expect(
      screen.getByText(/only settings managers can change it/i),
    ).toBeVisible();
  });

  it("blocks invalid offsets and saves normalized values", async () => {
    render(<AcademicContentNotificationPolicyPage />);
    const input = screen.getByLabelText("Reminder offsets in minutes");
    const save = screen.getByRole("button", {
      name: "Save notification policy",
    });

    fireEvent.change(input, { target: { value: "4" } });
    fireEvent.click(save);
    expect(screen.getByText(/between 5 and 10080/i)).toBeVisible();
    expect(mocks.save).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "60, 30, 60, 5" } });
    fireEvent.click(save);
    await waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith({
        onlineSessionReminderOffsetsMinutes: [5, 30, 60],
      }),
    );
  });
});
