import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PreparationTemplatesView } from "../PreparationTemplatesPage";
import { academicContentBrowseOptionsFixture } from "../../__tests__/academicContentBrowseOptionsFixture";

const pageState = vi.hoisted(() => ({
  canManage: false,
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/academic-content-hub/templates",
  useRouter: () => ({ push: pageState.push }),
  useSearchParams: () => new URLSearchParams("year=year-1&term=term-1"),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    isPermissionsReady: true,
    hasPermission: (permission: string) =>
      permission === "academics.academic_content.settings.manage" &&
      pageState.canManage,
  }),
}));

vi.mock("../../components/templates/PreparationTemplateFilters", () => ({
  default: () => <div>Template filters</div>,
}));

function templateState(overrides = {}) {
  return {
    filters: { page: 1, limit: 50, stageId: "", subjectId: "", search: "" },
    search: "",
    items: [],
    total: 0,
    isLoading: false,
    isDeleting: false,
    error: null,
    setSearch: vi.fn(),
    setFilters: vi.fn(),
    setPage: vi.fn(),
    setLimit: vi.fn(),
    clearFilters: vi.fn(),
    reload: vi.fn(),
    deleteTemplate: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe("PreparationTemplatesPage", () => {
  beforeEach(() => {
    pageState.canManage = false;
    pageState.push.mockReset();
  });

  it("shows empty and recoverable error states", () => {
    const reload = vi.fn();
    const { rerender } = render(
      <PreparationTemplatesView
        templates={templateState()}
        browseOptions={academicContentBrowseOptionsFixture}
      />,
    );
    expect(
      screen.getByText("No preparation templates yet"),
    ).toBeInTheDocument();

    rerender(
      <PreparationTemplatesView
        templates={templateState({
          error: { message: "Templates unavailable" },
          reload,
        })}
        browseOptions={academicContentBrowseOptionsFixture}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Templates unavailable",
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it("hides create and delete controls from read-only users", () => {
    render(
      <PreparationTemplatesView
        templates={templateState({
          total: 1,
          items: [
            {
              id: "template-1",
              name: "Core lesson",
              description: null,
              stageId: null,
              subjectId: null,
              objectivesCount: 0,
              learningOutcomesCount: 0,
              teachingStrategiesCount: 0,
              activitiesCount: 0,
              updatedAt: "2026-10-02T08:00:00.000Z",
            },
          ],
        })}
        browseOptions={academicContentBrowseOptionsFixture}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "New template" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the template table visible while refreshed rows load", () => {
    render(
      <PreparationTemplatesView
        templates={templateState({ isLoading: true, total: 1 })}
        browseOptions={academicContentBrowseOptionsFixture}
      />,
    );

    expect(
      screen.getByRole("columnheader", { name: "Name" }),
    ).toBeInTheDocument();
  });

  it("confirms soft deletion for template managers", async () => {
    pageState.canManage = true;
    const deleteTemplate = vi.fn().mockResolvedValue(true);
    render(
      <PreparationTemplatesView
        templates={templateState({
          total: 1,
          deleteTemplate,
          items: [
            {
              id: "template-1",
              name: "Core lesson",
              description: null,
              stageId: null,
              subjectId: null,
              objectivesCount: 0,
              learningOutcomesCount: 0,
              teachingStrategiesCount: 0,
              activitiesCount: 0,
              updatedAt: "2026-10-02T08:00:00.000Z",
            },
          ],
        })}
        browseOptions={academicContentBrowseOptionsFixture}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Delete Core lesson?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete template" }));
    await waitFor(() =>
      expect(deleteTemplate).toHaveBeenCalledWith("template-1"),
    );
    expect(
      screen.getByRole("heading", { name: "Preparation templates" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Reusable templates: 1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New template" }),
    ).toBeInTheDocument();
  });
});
