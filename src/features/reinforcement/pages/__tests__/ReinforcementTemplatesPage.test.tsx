import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import ReinforcementTemplatesPage from "../ReinforcementTemplatesPage";

const permissionState = vi.hoisted(() => ({
  permissions: [
    "reinforcement.templates.view",
    "reinforcement.templates.manage",
  ] as string[],
}));

const templateMocks = vi.hoisted(() => ({
  listReinforcementTemplates: vi.fn(),
  createReinforcementTemplate: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ isLoading: false }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) =>
      permissionState.permissions.includes(permission),
  }),
}));

vi.mock(
  "@/features/reinforcement/services/reinforcementTemplatesService",
  () => templateMocks,
);

function renderPage() {
  return render(
    <ToastProvider>
      <ReinforcementTemplatesPage />
    </ToastProvider>,
  );
}

describe("ReinforcementTemplatesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permissionState.permissions = [
      "reinforcement.templates.view",
      "reinforcement.templates.manage",
    ];
    templateMocks.listReinforcementTemplates.mockResolvedValue({
      items: [],
      total: 0,
    });
    templateMocks.createReinforcementTemplate.mockResolvedValue({
      id: "template-1",
    });
  });

  it("asks for confirmation before closing a dirty create modal", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "templates.form.create" }),
    );
    const createDialog = await screen.findByRole("dialog", {
      name: "templates.form.createTitle",
    });

    await user.type(
      within(createDialog).getByLabelText("templates.form.nameEn"),
      "Leadership",
    );
    await user.click(
      within(createDialog).getByRole("button", { name: "Close modal" }),
    );

    const discardDialog = await screen.findByRole("dialog", {
      name: "templates.form.discardTitle",
    });
    expect(createDialog).toBeInTheDocument();

    await user.click(
      within(discardDialog).getByRole("button", {
        name: "templates.form.keepEditing",
      }),
    );

    expect(
      screen.getByRole("dialog", { name: "templates.form.createTitle" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "templates.form.discardTitle" }),
    ).not.toBeInTheDocument();

    await user.click(
      within(createDialog).getByRole("button", { name: "Close modal" }),
    );
    const nextDiscardDialog = await screen.findByRole("dialog", {
      name: "templates.form.discardTitle",
    });
    await user.click(
      within(nextDiscardDialog).getByRole("button", {
        name: "templates.form.discard",
      }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "templates.form.createTitle" }),
      ).not.toBeInTheDocument();
    });
  });

  it("requires approval for a new template stage by default", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "templates.form.create" }),
    );

    expect(
      screen.getByRole("checkbox", {
        name: "templates.form.requiresApproval",
      }),
    ).toBeChecked();
  });

  it("passes backend-supported template filters when they change", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(templateMocks.listReinforcementTemplates).toHaveBeenCalledWith({
        search: undefined,
        source: undefined,
        includeDeleted: undefined,
      });
    });

    await user.click(
      screen.getByRole("button", { name: "templates.sourceFilter" }),
    );
    await user.click(screen.getByRole("button", { name: "source.system" }));

    await waitFor(() => {
      expect(templateMocks.listReinforcementTemplates).toHaveBeenLastCalledWith({
        search: undefined,
        source: "system",
        includeDeleted: undefined,
      });
    });

    await user.click(
      screen.getByRole("checkbox", { name: "templates.includeDeleted" }),
    );

    await waitFor(() => {
      expect(templateMocks.listReinforcementTemplates).toHaveBeenLastCalledWith({
        search: undefined,
        source: "system",
        includeDeleted: true,
      });
    });
  });
});
