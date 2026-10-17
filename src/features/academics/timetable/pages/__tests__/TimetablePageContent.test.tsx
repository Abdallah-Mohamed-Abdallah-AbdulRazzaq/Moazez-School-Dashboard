import { act, render, screen } from "@testing-library/react";
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
const academicContextMocks = vi.hoisted(() => ({
  changeAcademicYear: vi.fn(async () => undefined),
  changeTerm: vi.fn(),
  setGuardHandlers: vi.fn(),
  academicYearId: "year-1",
  termId: "term-1",
  termStatus: "open" as const,
  selectedAcademicYear: {
    id: "year-1",
    name: "2026/2027",
    nameAr: "٢٠٢٦/٢٠٢٧",
    nameEn: "2026/2027",
  },
  selectedTerm: {
    id: "term-1",
    name: "First term",
    nameAr: "الفصل الدراسي الأول",
    nameEn: "First term",
  },
  isInitializing: false,
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
  useAcademicYearTermLayoutContext: () => academicContextMocks,
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
    academicContextMocks.isInitializing = false;
  });

  it.each([
    ["onTermChange", "changeTerm", "term-2"],
    ["onAcademicYearChange", "changeAcademicYear", "year-2"],
  ] as const)(
    "protects unsaved lessons during %s until discard is confirmed",
    async (request, change, destination) => {
      const user = userEvent.setup();
      render(
        <UnsavedChangesProvider>
          <TimetablePageContent />
        </UnsavedChangesProvider>,
      );
      await user.click(await screen.findByRole("button", { name: "Edit timetable" }));
      const requestChange = () => {
        const handlers = academicContextMocks.setGuardHandlers.mock.lastCall?.[0];
        void handlers[request](destination);
      };

      act(requestChange);
      expect(screen.getByText("unsavedChanges.message")).toBeInTheDocument();
      expect(academicContextMocks[change]).not.toHaveBeenCalled();
      await user.click(screen.getByRole("button", { name: "cancel" }));
      expect(academicContextMocks[change]).not.toHaveBeenCalled();
      expect(screen.getByText("Scope: stage-1")).toBeInTheDocument();

      act(requestChange);
      await user.click(screen.getByRole("button", { name: "discard" }));
      expect(academicContextMocks[change]).toHaveBeenCalledWith(destination);
    },
  );

  it("shows a timetable skeleton while the academic context loads", () => {
    academicContextMocks.isInitializing = true;

    render(
      <UnsavedChangesProvider>
        <TimetablePageContent />
      </UnsavedChangesProvider>,
    );

    expect(
      screen.getByRole("status", { name: "loadingLabel" }),
    ).toHaveAttribute("aria-busy", "true");
  });

  it("keeps timetable edits until a filter change is confirmed", async () => {
    const user = userEvent.setup();
    render(
      <UnsavedChangesProvider>
        <TimetablePageContent />
      </UnsavedChangesProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "Edit timetable" }));
    await user.click(screen.getByRole("button", { name: "Change stage" }));

    expect(screen.getByText("unsavedChanges.message")).toBeInTheDocument();
    expect(routerMocks.push).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "cancel" }));
    expect(routerMocks.push).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Change stage" }));
    await user.click(screen.getByRole("button", { name: "discard" }));

    expect(routerMocks.push).toHaveBeenCalledWith(
      "?stage=stage-2&workspace=1",
      {
        scroll: false,
      },
    );
  });

  it("retains the edited scope when browser history changes the URL", async () => {
    const user = userEvent.setup();
    const page = (
      <UnsavedChangesProvider>
        <TimetablePageContent />
      </UnsavedChangesProvider>
    );
    const { rerender } = render(page);

    expect(await screen.findByText("Scope: stage-1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit timetable" }));

    navigationMocks.searchParams = new URLSearchParams();
    rerender(page);

    expect(screen.getByText("Scope: stage-1")).toBeInTheDocument();
    expect(screen.queryByText("Scope: none")).not.toBeInTheDocument();
  });

  it("preserves the configuration identity while changing viewing filters", async () => {
    navigationMocks.searchParams = new URLSearchParams(
      "year=year-1&term=term-1&stage=stage-1&configurationScope=GRADE&scopeId=grade-1&configuration=config-1&entry=entry-1",
    );
    render(
      <UnsavedChangesProvider>
        <TimetablePageContent />
      </UnsavedChangesProvider>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Change stage" }));
    const params = new URLSearchParams(
      routerMocks.push.mock.calls[0][0].slice(1),
    );
    expect(params.get("configurationScope")).toBe("GRADE");
    expect(params.get("scopeId")).toBe("grade-1");
    expect(params.get("configuration")).toBe("config-1");
    expect(params.has("entry")).toBe(false);
  });

  it("requires discarding unsaved lessons before returning to the overview", async () => {
    const user = userEvent.setup();
    navigationMocks.searchParams = new URLSearchParams(
      "year=year-1&term=term-1&workspace=1&configurationScope=TERM",
    );
    render(
      <UnsavedChangesProvider>
        <TimetablePageContent />
      </UnsavedChangesProvider>,
    );
    await user.click(await screen.findByRole("button", { name: "Edit timetable" }));
    await user.click(screen.getByRole("button", { name: "overview.back" }));
    expect(routerMocks.push).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "discard" }));
    expect(routerMocks.push).toHaveBeenCalledWith("?year=year-1&term=term-1", {
      scroll: false,
    });
  });
});
