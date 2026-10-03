import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TimetableSetupPage from "@/features/academics/timetable/pages/TimetableSetupPage";
import type { TimetableSetupStatus } from "@/features/academics/timetable/services/timetableSetupStatus";

const routerMocks = vi.hoisted(() => ({ replace: vi.fn() }));
const academicContextMock = vi.hoisted(() => ({
  academicYearId: "year-1",
  termId: "term-1",
  termStatus: "open" as "open" | "closed",
  selectedAcademicYear: { nameEn: "2026/2027", nameAr: "٢٠٢٦/٢٠٢٧" },
  selectedTerm: { nameEn: "First term", nameAr: "الترم الأول" },
  isInitializing: false,
}));
const permissionMock = vi.hoisted(() => ({
  canManage: true,
  isPermissionsReady: true,
}));
const setupHookMock = vi.hoisted(() => ({
  result: {
    status: null as TimetableSetupStatus | null,
    isLoading: true,
    reload: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("next/navigation", () => ({ useRouter: () => routerMocks }));
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => academicContextMock,
}));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: () => permissionMock.canManage,
    isPermissionsReady: permissionMock.isPermissionsReady,
  }),
}));
vi.mock("@/features/academics/timetable/hooks/useTimetableSetupStatus", () => ({
  useTimetableSetupStatus: () => setupHookMock.result,
}));
vi.mock(
  "@/features/academics/timetable/components/TimetableSetupWizard",
  () => ({
    default: ({ onComplete }: { onComplete: () => void }) => (
      <button type="button" onClick={onComplete}>
        setup.startBuilding
      </button>
    ),
  }),
);
vi.mock("@/components/ui", () => ({
  AccessDenied: ({ description }: { description?: string }) => (
    <div>
      <span>access-denied</span>
      <span>{description}</span>
    </div>
  ),
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));
vi.mock("@/components/ui/loaders/MainLoader", () => ({
  default: () => <div>main-loader</div>,
}));

const readOnlyMissingConfig: TimetableSetupStatus = {
  kind: "read_only",
  readiness: "missing_config",
  reason: "missing_permission",
  config: null,
  periods: [],
};

const readyStatus: TimetableSetupStatus = {
  kind: "ready",
  readOnly: false,
  config: {
    id: "term-config",
    academicYearId: "year-1",
    termId: "term-1",
    name: "First term timetable",
    weekStartDay: 0,
    activeDays: [0, 1, 2, 3, 4],
    scopeType: "term",
    scopeKey: "term:term-1",
    stageId: null,
    gradeId: null,
    sectionId: null,
    classroomId: null,
    status: "draft",
    createdAt: "2026-10-02T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z",
  },
  periods: [
    {
      id: "period-1",
      timetableConfigId: "term-config",
      index: 1,
      label: "Period 1",
      startTime: "08:00",
      endTime: "08:45",
      type: "class",
      isInstructional: true,
      createdAt: "2026-10-02T00:00:00.000Z",
      updatedAt: "2026-10-02T00:00:00.000Z",
    },
  ],
};

describe("TimetableSetupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    academicContextMock.isInitializing = false;
    permissionMock.isPermissionsReady = true;
    permissionMock.canManage = true;
    setupHookMock.result = {
      status: null,
      isLoading: true,
      reload: vi.fn().mockResolvedValue(undefined),
    };
  });

  it("shows loading while setup status is unresolved", () => {
    render(<TimetableSetupPage />);

    expect(screen.getByRole("status", { name: "loadingLabel" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("shows a management blocker for incomplete read-only setup", () => {
    setupHookMock.result = {
      status: readOnlyMissingConfig,
      isLoading: false,
      reload: vi.fn().mockResolvedValue(undefined),
    };

    render(<TimetableSetupPage />);

    expect(screen.getByText("setup.readOnly.missingPermission")).toBeInTheDocument();
    expect(screen.getByText("access-denied")).toBeInTheDocument();
  });

  it("replaces the setup route after completion", async () => {
    setupHookMock.result = {
      status: readyStatus,
      isLoading: false,
      reload: vi.fn().mockResolvedValue(undefined),
    };
    render(<TimetableSetupPage />);

    await userEvent.click(
      screen.getByRole("button", { name: "setup.startBuilding" }),
    );

    expect(routerMocks.replace).toHaveBeenCalledWith("/academics/timetable");
  });
});
