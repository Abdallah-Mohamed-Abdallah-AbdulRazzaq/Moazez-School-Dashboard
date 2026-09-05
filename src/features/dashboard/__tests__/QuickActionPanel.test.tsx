import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import QuickActionPanel from "@/features/dashboard/components/QuickActionPanel";
import { createAnnouncement } from "@/features/communication/api/communication.service";
import { ApiError } from "@/lib/api-error";

const toastSpies = vi.hoisted(() => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

let grantedPermissions = new Set<string>();

vi.mock("@/features/communication/api/communication.service", () => ({
  createAnnouncement: vi.fn(),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({
    showError: toastSpies.showError,
    showSuccess: toastSpies.showSuccess,
  }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) => grantedPermissions.has(permission),
    isPermissionsReady: true,
  }),
}));

const mockedCreateAnnouncement = vi.mocked(createAnnouncement);

describe("QuickActionPanel", () => {
  beforeEach(() => {
    grantedPermissions = new Set([
      "students.records.manage",
      "students.guardians.manage",
      "students.enrollments.manage",
      "attendance.sessions.view",
      "attendance.policies.view",
      "academics.structure.view",
      "communication.announcements.view",
      "communication.announcements.manage",
      "grades.gradebook.view",
      "grades.assessments.manage",
    ]);
    mockedCreateAnnouncement.mockReset();
    toastSpies.showError.mockClear();
    toastSpies.showSuccess.mockClear();
  });

  it("creates a school-wide announcement draft directly from the dashboard", async () => {
    const user = userEvent.setup();
    mockedCreateAnnouncement.mockResolvedValue({
      data: { id: "announcement-1" },
    } as Awaited<ReturnType<typeof createAnnouncement>>);

    render(<QuickActionPanel />);

    await user.type(screen.getByLabelText("Title"), "Term opening");
    await user.type(screen.getByLabelText("Body"), "Welcome back tomorrow.");
    await user.click(screen.getByRole("button", { name: /create draft/i }));

    await waitFor(() => {
      expect(mockedCreateAnnouncement).toHaveBeenCalledWith({
        title: "Term opening",
        body: "Welcome back tomorrow.",
        status: "draft",
        priority: "normal",
        audienceType: "school",
      });
    });
    expect(toastSpies.showSuccess).toHaveBeenCalledWith(
      "Announcement draft created.",
    );
    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByLabelText("Body")).toHaveValue("");
  });

  it("shows validation feedback instead of calling the API for empty content", async () => {
    const user = userEvent.setup();

    render(<QuickActionPanel />);

    await user.click(screen.getByRole("button", { name: /create draft/i }));

    expect(screen.getByText("Enter a title.")).toBeInTheDocument();
    expect(mockedCreateAnnouncement).not.toHaveBeenCalled();
  });

  it("shows a mapped API error when quick-draft creation fails", async () => {
    const user = userEvent.setup();
    mockedCreateAnnouncement.mockRejectedValue(
      new ApiError("File too large", 413, "files.upload.size_exceeded"),
    );

    render(<QuickActionPanel />);

    await user.type(screen.getByLabelText("Title"), "Term opening");
    await user.type(screen.getByLabelText("Body"), "Welcome back tomorrow.");
    await user.click(screen.getByRole("button", { name: /create draft/i }));

    await waitFor(() => {
      expect(toastSpies.showError).toHaveBeenCalledWith(
        "The file exceeds the allowed size.",
      );
    });
  });

  it("shows only quick actions the user can open and hides announcement drafting without manage access", () => {
    grantedPermissions = new Set([
      "attendance.sessions.view",
      "attendance.policies.view",
      "academics.structure.view",
    ]);

    render(<QuickActionPanel />);

    expect(screen.getByRole("link", { name: "attendance" })).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "add_student" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "announcement" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "assessment" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /create draft/i }),
    ).not.toBeInTheDocument();
  });
});
