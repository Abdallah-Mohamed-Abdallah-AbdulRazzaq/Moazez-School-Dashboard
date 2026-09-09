import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnsavedChangesProvider } from "@/providers/UnsavedChangesProvider";
import TimetablePageContent from "../TimetablePageContent";

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));
const navigationMocks = vi.hoisted(() => ({
  searchParams: new URLSearchParams("stage=stage-1"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks,
  useSearchParams: () => navigationMocks.searchParams,
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => ({
    academicYearId: "year-1",
    termId: "term-1",
    termStatus: "open",
    isInitializing: false,
  }),
}));

vi.mock("../../components/TimetableView", () => ({
  default: ({
    onDirtyChange,
    onStageChange,
    selectedStageId,
  }: {
    onDirtyChange: (dirty: boolean) => void;
    onStageChange: (stageId: string) => void;
    selectedStageId: string;
  }) => (
    <>
      <p>Scope: {selectedStageId || "none"}</p>
      <button type="button" onClick={() => onDirtyChange(true)}>
        Edit timetable
      </button>
      <button type="button" onClick={() => onStageChange("stage-2")}>
        Change stage
      </button>
    </>
  ),
}));

vi.mock("../../../rooms/components/RoomsView", () => ({
  default: () => <div>Rooms</div>,
}));

describe("TimetablePageContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationMocks.searchParams = new URLSearchParams("stage=stage-1");
  });

  it("keeps timetable edits until a filter change is confirmed", async () => {
    const user = userEvent.setup();
    render(
      <UnsavedChangesProvider>
        <TimetablePageContent />
      </UnsavedChangesProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Edit timetable" }));
    await user.click(screen.getByRole("button", { name: "Change stage" }));

    expect(screen.getByText("unsavedChanges.message")).toBeInTheDocument();
    expect(routerMocks.push).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "cancel" }));
    expect(routerMocks.push).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Change stage" }));
    await user.click(screen.getByRole("button", { name: "discard" }));

    expect(routerMocks.push).toHaveBeenCalledWith("?stage=stage-2", {
      scroll: false,
    });
  });

  it("retains the edited scope when browser history changes the URL", async () => {
    const user = userEvent.setup();
    const page = (
      <UnsavedChangesProvider>
        <TimetablePageContent />
      </UnsavedChangesProvider>
    );
    const { rerender } = render(page);

    expect(screen.getByText("Scope: stage-1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit timetable" }));

    navigationMocks.searchParams = new URLSearchParams();
    rerender(page);

    expect(screen.getByText("Scope: stage-1")).toBeInTheDocument();
    expect(screen.queryByText("Scope: none")).not.toBeInTheDocument();
  });
});
