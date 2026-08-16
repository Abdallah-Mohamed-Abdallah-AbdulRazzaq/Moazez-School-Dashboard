import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { teacherFixture } from "@/features/teachers/__tests__/fixtures";
import TeachersPage from "../TeachersPage";

const mocks = vi.hoisted(() => ({
  canView: true,
  canManage: false,
  isLoading: false,
  list: vi.fn(),
  createTeacher: vi.fn(),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    isLoading: mocks.isLoading,
    isPermissionsReady: !mocks.isLoading,
    hasPermission: (permission: string) => permission.endsWith("view") ? mocks.canView : mocks.canManage,
  }),
}));

vi.mock("@/features/students-guardians/shared/hooks/useUrlQueryState", () => ({
  useUrlQueryState: ({ defaults }: { defaults: Record<string, string> }) => ({ values: defaults, setValues: vi.fn(), reset: vi.fn() }),
}));

vi.mock("@/features/teachers/hooks/useTeacherList", () => ({ useTeacherList: (...args: unknown[]) => mocks.list(...args) }));
vi.mock("@/features/teachers/hooks/useTeacherActions", () => ({ useTeacherActions: () => ({ activeAction: null, createTeacher: mocks.createTeacher }) }));
vi.mock("@/components/ui/toast/Toast", () => ({ useToast: () => ({ showSuccess: vi.fn() }) }));
vi.mock("@/features/teachers/components/TeacherFilterBar", () => ({ default: () => <div>teacher-filters</div> }));
vi.mock("@/features/teachers/components/TeacherListTable", () => ({ default: ({ canManage }: { canManage: boolean }) => <div>teacher-table:{String(canManage)}</div> }));
vi.mock("@/features/teachers/components/CreateTeacherDialog", () => ({ default: () => <div>create-dialog</div> }));

describe("TeachersPage", () => {
  beforeEach(() => {
    mocks.canView = true;
    mocks.canManage = false;
    mocks.isLoading = false;
    mocks.list.mockReset().mockReturnValue({
      response: { items: [teacherFixture], pagination: { page: 1, limit: 20, total: 1 } },
      isLoading: false,
      isRefreshing: false,
      error: null,
      refresh: vi.fn(),
    });
  });

  it("uses the default server query and hides mutations for view-only users", () => {
    render(<TeachersPage />);
    expect(mocks.list).toHaveBeenCalledWith({ page: 1, limit: 20 }, true);
    expect(screen.getByText("teacher-table:false")).toBeVisible();
    expect(screen.queryByRole("button", { name: "actions.add_teacher" })).not.toBeInTheDocument();
  });

  it("does not expose directory content without view permission", () => {
    mocks.canView = false;
    render(<TeachersPage />);
    expect(mocks.list).toHaveBeenCalledWith({ page: 1, limit: 20 }, false);
    expect(screen.queryByText("teacher-table:false")).not.toBeInTheDocument();
  });

  it("opens creation only for managers", async () => {
    const user = userEvent.setup();
    mocks.canManage = true;
    render(<TeachersPage />);
    await user.click(screen.getByRole("button", { name: "actions.add_teacher" }));
    expect(screen.getByText("create-dialog")).toBeVisible();
  });

  it("does not expose rehire while the workflow is unavailable", () => {
    mocks.canManage = true;
    render(<TeachersPage />);
    expect(screen.queryByRole("button", { name: "actions.rehire" })).not.toBeInTheDocument();
  });
});
