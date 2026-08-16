import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NedaaStaffAssignmentsPage from "../NedaaStaffAssignmentsPage";

const serviceMocks = vi.hoisted(() => ({
  fetchSettingsUsers: vi.fn(),
  fetchSettingsRoles: vi.fn(),
  listDismissalGates: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showSuccess: vi.fn(), showError: vi.fn() }),
}));

vi.mock("@/features/settings/services/settingsUsersService", () => ({
  fetchSettingsUsers: serviceMocks.fetchSettingsUsers,
}));

vi.mock("@/features/settings/services/settingsRolesService", () => ({
  fetchSettingsRoles: serviceMocks.fetchSettingsRoles,
}));

vi.mock("@/features/nedaa/services/dismissalApiService", () => ({
  listDismissalGates: serviceMocks.listDismissalGates,
  listDismissalStaffAssignments: vi.fn().mockResolvedValue({
    data: [],
    summary: { totalCount: 0, activeCount: 0, inactiveCount: 0, leadCount: 0 },
  }),
  createDismissalStaffAssignment: vi.fn(),
  updateDismissalStaffAssignment: vi.fn(),
  deleteDismissalStaffAssignment: vi.fn(),
}));

vi.mock("@/features/nedaa/hooks/useNedaaAcademicStructure", () => ({
  useNedaaAcademicStructure: () => ({
    tree: {
      stages: [
        {
          id: "stage-1",
          name: "Primary",
          nameAr: "ابتدائي",
          nameEn: "Primary",
          order: 1,
        },
      ],
      grades: [],
      sections: [],
      classrooms: [],
    },
    isLoading: false,
    error: null,
    retry: vi.fn(),
  }),
}));

describe("NedaaStaffAssignmentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.fetchSettingsRoles.mockResolvedValue({
      items: [
        {
          id: "role-dismissal-staff",
          key: "dismissal_staff",
          name: "Dismissal Staff",
          description: null,
          isSystem: true,
          memberCount: 1,
          permissions: [],
        },
      ],
    });
    serviceMocks.fetchSettingsUsers.mockResolvedValue({
      items: [
        {
          id: "user-1",
          fullName: "Ahmed Staff",
          username: "ahmed.staff",
          email: "ahmed.staff@example.com",
          roleId: "role-1",
          status: "active",
        },
      ],
      pagination: { page: 1, limit: 20, total: 1 },
    });
    serviceMocks.listDismissalGates.mockResolvedValue({
      data: [
        {
          id: "gate-1",
          code: "MAIN",
          name: "Main Gate",
          campus: "North",
          status: "open",
          isActive: true,
          sortOrder: 1,
          location: { latitude: null, longitude: null },
          waitingZones: [],
          notes: null,
        },
      ],
    });
  });

  it("loads staff dropdown users from the Dismissal Staff role only", async () => {
    const user = userEvent.setup();
    render(<NedaaStaffAssignmentsPage />);

    await waitFor(() =>
      expect(
        screen.queryByText("staff_assignments.loading"),
      ).not.toBeInTheDocument(),
    );
    await user.click(
      screen.getByRole("button", { name: "filters.show_filters" }),
    );
    await user.click(
      screen.getByRole("button", { name: "filters.staff_user" }),
    );
    await waitFor(() =>
      expect(serviceMocks.fetchSettingsUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        roleId: "role-dismissal-staff",
        status: "active",
        search: undefined,
      }),
    );
  });

  it("offers academics-tree stages when assignment results are empty", async () => {
    const user = userEvent.setup();
    render(<NedaaStaffAssignmentsPage />);

    await waitFor(() =>
      expect(
        screen.queryByText("staff_assignments.loading"),
      ).not.toBeInTheDocument(),
    );
    await user.click(
      screen.getByRole("button", { name: "filters.show_filters" }),
    );
    await user.click(screen.getByRole("button", { name: "filters.stage" }));

    expect(screen.getByRole("button", { name: "Primary" })).toBeVisible();
  });

  it("uses searchable dropdowns for employee account and gate in the create form", async () => {
    const user = userEvent.setup();
    render(<NedaaStaffAssignmentsPage />);

    await user.click(
      await screen.findByRole("button", {
        name: "staff_assignments.add_assignment",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "staff_assignments.staff_user_id",
      }),
    );
    await user.type(screen.getByPlaceholderText("search_placeholder"), "Ahmed");
    expect(
      await screen.findByRole("button", { name: "Ahmed Staff - ahmed.staff" }),
    ).toBeVisible();

    await user.click(document.body);
    await user.click(
      screen.getByRole("button", { name: "staff_assignments.gate_id" }),
    );
    await user.type(screen.getByPlaceholderText("table.gate"), "MAIN");
    expect(
      screen.getByRole("button", { name: "Main Gate (MAIN)" }),
    ).toBeVisible();
  });
});
