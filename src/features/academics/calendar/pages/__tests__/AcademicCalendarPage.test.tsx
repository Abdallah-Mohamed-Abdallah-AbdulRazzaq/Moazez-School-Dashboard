import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AcademicCalendarPage from "../AcademicCalendarPage";
import { usePermissions } from "@/hooks/usePermissions";
import { fetchCalendarEvents } from "../../services/calendarService";

type PermissionsState = ReturnType<typeof usePermissions>;

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  searchParams: new URLSearchParams("date=2024-01-01"),
}));

const translationMocks = vi.hoisted(() => ({
  translate: vi.fn((key: string) => key),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => translationMocks.translate,
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: navigationMocks.push,
    replace: navigationMocks.replace,
  }),
  useSearchParams: () => navigationMocks.searchParams,
}));

vi.mock("@/components/ui", () => ({
  AccessDenied: () => (
    <div>
      <h2>title</h2>
      <p>description</p>
    </div>
  ),
}));
vi.mock("@/components/ui/button/Button", () => ({
  default: () => null,
}));
vi.mock("@/components/ui/loaders/MainLoader", () => ({
  default: () => <div data-testid="main-loader" />,
}));

vi.mock("@mui/material", () => ({
  Alert: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Snackbar: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../../components/CalendarToolbar", () => ({
  default: ({ onRefresh }: { onRefresh?: () => void }) => (
    <button onClick={onRefresh}>refresh-calendar</button>
  ),
}));
vi.mock("../../components/MonthCalendar", () => ({
  default: () => <div>month-calendar</div>,
}));
vi.mock("../../components/WeekCalendar", () => ({
  default: () => null,
}));
vi.mock("../../components/AgendaView", () => ({
  default: () => null,
}));
vi.mock("../../components/EventDialog", () => ({
  default: () => null,
}));
vi.mock("../../components/MoveEventDialog", () => ({
  default: () => null,
}));
vi.mock(
  "@/features/academics/shared/components/export/AcademicsGlobalExportModal",
  () => ({ default: () => null })
);
vi.mock("@/features/academics/utils/exportAdapter", () => ({
  exportAcademicsData: vi.fn(),
  formatExportDate: vi.fn(() => "2024-01-01"),
  generateExportFilename: vi.fn(() => "calendar"),
}));

vi.mock("../../services/calendarService", () => ({
  fetchCalendarEvents: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
  formatCalendarDate: (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },
  updateEvent: vi.fn(),
}));

vi.mock("@/features/academics/academic-structure-tree/services/structureService", () => ({
  fetchAcademicYears: vi.fn().mockResolvedValue([]),
  fetchTerms: vi.fn().mockResolvedValue([]),
  fetchStructureTree: vi.fn().mockResolvedValue({
    stages: [],
    grades: [],
    sections: [],
    classrooms: [],
  }),
}));

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => ({
    academicYearId: "y1",
    termId: "t1",
    termStatus: "open",
    isInitializing: false,
    selectedTerm: {
      id: "t1",
      yearId: "y1",
      name: "Term 1",
      status: "open",
      startDate: "2024-01-01",
      endDate: "2024-06-01",
    },
  }),
}));

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

function createPermissionsState(
  hasPermission: PermissionsState["hasPermission"]
): PermissionsState {
  return {
    role: null,
    currentUser: null,
    grantedPermissions: [],
    hasPermission,
    hasAnyPermission: () => false,
    hasAllPermissions: () => false,
  };
}

describe("AcademicCalendarPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(<AcademicCalendarPage />);
  };

  it("denied users see access denied without loading calendar events", () => {
    vi.mocked(usePermissions).mockReturnValue(
      createPermissionsState(() => false)
    );

    renderComponent();
    expect(screen.getByRole("heading", { name: "title" })).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
    expect(fetchCalendarEvents).not.toHaveBeenCalled();
  });

  it("does not show the closed-term banner for an open term without manage permission", async () => {
    vi.mocked(usePermissions).mockReturnValue(
      createPermissionsState(
        (permission) => permission === "academics.calendar.view"
      )
    );

    renderComponent();

    await screen.findByText("month-calendar");
    expect(screen.queryByText("readonly_banner")).not.toBeInTheDocument();
  });

  it("keeps the calendar visible while refreshing after the initial load", async () => {
    vi.mocked(usePermissions).mockReturnValue(
      createPermissionsState(() => true)
    );

    renderComponent();
    await screen.findByText("month-calendar");

    vi.mocked(fetchCalendarEvents).mockImplementationOnce(
      () => new Promise(() => undefined)
    );
    fireEvent.click(screen.getByRole("button", { name: "refresh-calendar" }));

    await waitFor(() => {
      expect(fetchCalendarEvents).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByText("month-calendar")).toBeInTheDocument();
    expect(screen.queryByTestId("main-loader")).not.toBeInTheDocument();
  });
});
