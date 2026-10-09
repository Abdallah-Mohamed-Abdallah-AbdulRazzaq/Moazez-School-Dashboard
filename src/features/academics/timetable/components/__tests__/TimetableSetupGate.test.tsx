import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TimetableSetupGate from "@/features/academics/timetable/components/TimetableSetupGate";
import type {
  BackendTimetableConfigDto,
  BackendTimetablePeriodDto,
} from "@/features/academics/timetable/services/timetableApiTypes";
import type { TimetableSetupStatus } from "@/features/academics/timetable/services/timetableSetupStatus";

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));
const setupHookMock = vi.hoisted(() => ({
  result: {
    status: null as TimetableSetupStatus | null,
    isLoading: false,
    reload: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("next/navigation", () => ({ useRouter: () => routerMocks }));
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));
vi.mock("@/features/academics/timetable/hooks/useTimetableSetupStatus", () => ({
  useTimetableSetupStatus: () => setupHookMock.result,
}));

const termConfig = {
  id: "term-config",
  academicYearId: "year-1",
  termId: "term-1",
  name: "Term timetable",
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
} satisfies BackendTimetableConfigDto;

const period = {
  id: "period-1",
  timetableConfigId: termConfig.id,
  index: 1,
  label: "Period 1",
  startTime: "08:00",
  endTime: "08:45",
  type: "class",
  isInstructional: true,
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
} satisfies BackendTimetablePeriodDto;

const statusByKind = {
  missing_config: { kind: "missing_config", config: null, periods: [] },
  missing_periods: { kind: "missing_periods", config: termConfig, periods: [] },
  ready: {
    kind: "ready",
    config: termConfig,
    periods: [period],
    readOnly: false,
  },
  error: { kind: "error", error: new Error("offline") },
} satisfies Record<string, TimetableSetupStatus>;

function mockStatus(kind: keyof typeof statusByKind) {
  setupHookMock.result = {
    status: statusByKind[kind],
    isLoading: false,
    reload: vi.fn().mockResolvedValue(undefined),
  };
}

function renderGate() {
  return render(
    <TimetableSetupGate
      academicYearId="year-1"
      termId="term-1"
      termStatus="open"
      canManage
    >
      <p>workspace child</p>
    </TimetableSetupGate>,
  );
}

describe("TimetableSetupGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupHookMock.result = {
      status: null,
      isLoading: false,
      reload: vi.fn().mockResolvedValue(undefined),
    };
  });

  it.each(["missing_config", "missing_periods"] as const)(
    "keeps the workspace available for manageable %s setup",
    async (kind) => {
      const user = userEvent.setup();
      mockStatus(kind);
      renderGate();

      expect(screen.getByText("workspace child")).toBeInTheDocument();
      expect(routerMocks.replace).not.toHaveBeenCalled();

      await user.click(
        screen.getByRole("button", { name: "setup.notice.openSetup" }),
      );
      expect(routerMocks.push).toHaveBeenCalledWith(
        "/academics/timetable/setup",
      );
    },
  );

  it("does not redirect a load error", () => {
    mockStatus("error");
    renderGate();

    expect(routerMocks.replace).not.toHaveBeenCalled();
    expect(screen.getByText("workspace child")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "setup.retry" }),
    ).toBeInTheDocument();
  });

  it("keeps legacy scopes viewable when the default cannot be completed", () => {
    setupHookMock.result = {
      status: {
        kind: "read_only",
        readiness: "missing_config",
        reason: "missing_permission",
        config: null,
        periods: [],
      },
      isLoading: false,
      reload: vi.fn().mockResolvedValue(undefined),
    };

    renderGate();

    expect(screen.getByText("workspace child")).toBeInTheDocument();
    expect(
      screen.getByText("setup.readOnly.missingPermission"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "setup.notice.openSetup" }),
    ).not.toBeInTheDocument();
  });

  it("allows a ready draft through", () => {
    mockStatus("ready");
    renderGate();

    expect(screen.getByText("workspace child")).toBeInTheDocument();
  });
});
