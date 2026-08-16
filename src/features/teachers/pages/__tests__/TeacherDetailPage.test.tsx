import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { teacherFixture } from "@/features/teachers/__tests__/fixtures";
import { ApiError } from "@/lib/api-error";
import TeacherDetailPage from "../TeacherDetailPage";

const mocks = vi.hoisted(() => ({
  canView: true,
  canManage: true,
  detail: vi.fn(),
  archiveTeacher: vi.fn(),
  changeEmploymentStatus: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    isLoading: false,
    isPermissionsReady: true,
    hasPermission: (permission: string) => permission.endsWith("view") ? mocks.canView : mocks.canManage,
  }),
}));
vi.mock("@/features/teachers/hooks/useTeacherDetail", () => ({ useTeacherDetail: (...args: unknown[]) => mocks.detail(...args) }));
vi.mock("@/features/teachers/hooks/useTeacherActions", () => ({ useTeacherActions: () => ({ activeAction: null, updateTeacher: vi.fn(), changeEmploymentStatus: mocks.changeEmploymentStatus, archiveTeacher: mocks.archiveTeacher }) }));
vi.mock("@/components/ui/toast/Toast", () => ({ useToast: () => ({ showError: vi.fn(), showSuccess: vi.fn() }) }));
vi.mock("@/features/teachers/components/TeacherDetailHeader", () => ({ default: () => <div>detail-header</div> }));
vi.mock("@/features/teachers/components/TeacherDetailSections", () => ({ default: () => <div>detail-sections</div> }));
vi.mock("@/features/teachers/components/EditTeacherDialog", () => ({ default: () => <div>edit-dialog</div> }));
vi.mock("@/features/teachers/components/EmploymentTransitionDialog", () => ({ default: ({ targetStatus, onSubmit }: { targetStatus: string; onSubmit: (input: { employmentStatus: string }) => Promise<void> }) => <button onClick={() => void onSubmit({ employmentStatus: targetStatus })}>transition-dialog:{targetStatus}</button> }));
vi.mock("@/features/teachers/components/EmploymentTransitionResultDialog", () => ({ default: () => null }));
vi.mock("@/features/teachers/components/ArchiveConfirmDialog", () => ({ default: ({ isOpen, onConfirm }: { isOpen: boolean; onConfirm: () => void }) => isOpen ? <button onClick={onConfirm}>confirm-archive</button> : null }));

describe("TeacherDetailPage", () => {
  beforeEach(() => {
    mocks.canView = true;
    mocks.canManage = true;
    mocks.archiveTeacher.mockReset().mockResolvedValue(undefined);
    mocks.changeEmploymentStatus.mockReset();
    mocks.refresh.mockReset().mockResolvedValue(undefined);
    mocks.detail.mockReset().mockReturnValue({ teacher: teacherFixture, isLoading: false, error: null, refresh: mocks.refresh, replaceTeacher: vi.fn() });
  });

  it("offers only legal transitions and never exposes archive or rehire", async () => {
    const user = userEvent.setup();
    render(<TeacherDetailPage teacherId="teacher-1" />);
    expect(screen.getByRole("button", { name: "lifecycle.actions.active" })).toBeVisible();
    expect(screen.getByRole("button", { name: "lifecycle.actions.terminated" })).toBeVisible();
    expect(screen.queryByText(/rehire/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "actions.archive" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "lifecycle.actions.active" }));
    expect(screen.getByText("transition-dialog:ACTIVE")).toBeVisible();
  });

  it("uses the safe employment transition when disabling an active teacher account", async () => {
    const user = userEvent.setup();
    mocks.detail.mockReturnValue({ teacher: { ...teacherFixture, employmentStatus: "ACTIVE" }, isLoading: false, error: null, refresh: mocks.refresh, replaceTeacher: vi.fn() });
    render(<TeacherDetailPage teacherId="teacher-1" />);

    await user.click(screen.getByRole("button", { name: "actions.disable_account" }));

    expect(screen.getByText("transition-dialog:INACTIVE")).toBeVisible();
  });

  it("hides every mutation action from view-only users", () => {
    mocks.canManage = false;
    render(<TeacherDetailPage teacherId="teacher-1" />);
    expect(screen.getByText("detail-header")).toBeVisible();
    expect(screen.queryByRole("button", { name: "actions.edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "actions.archive" })).not.toBeInTheDocument();
  });

  it("does not request detail data without view permission", () => {
    mocks.canView = false;
    render(<TeacherDetailPage teacherId="teacher-1" />);
    expect(mocks.detail).toHaveBeenCalledWith("teacher-1", false);
    expect(screen.queryByText("detail-header")).not.toBeInTheDocument();
  });

  it("refreshes and closes the transition after an identity integrity conflict", async () => {
    const user = userEvent.setup();
    mocks.changeEmploymentStatus.mockRejectedValue(
      new ApiError(
        "Teacher identity state is not safe for this operation",
        409,
        "teachers.account.role_transition_conflict",
        undefined,
        { reasonCode: "teacher_identity_inconsistent" },
        "trace-123",
      ),
    );
    render(<TeacherDetailPage teacherId="teacher-1" />);

    await user.click(screen.getByRole("button", { name: "lifecycle.actions.active" }));
    await user.click(screen.getByRole("button", { name: "transition-dialog:ACTIVE" }));

    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
    expect(screen.getByText("errors.identity_inconsistent")).toBeVisible();
    expect(screen.getByText("trace-123")).toBeVisible();
    expect(screen.queryByRole("button", { name: "transition-dialog:ACTIVE" })).not.toBeInTheDocument();
  });
});
