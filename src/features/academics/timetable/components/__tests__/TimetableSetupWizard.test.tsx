import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TimetableSetupWizard from "@/features/academics/timetable/components/TimetableSetupWizard";
import type {
  BackendTimetableConfigDto,
  BackendTimetablePeriodDto,
} from "@/features/academics/timetable/services/timetableApiTypes";
import type { TimetableSetupStatus } from "@/features/academics/timetable/services/timetableSetupStatus";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock(
  "@/features/academics/timetable/components/TimetableConfigEditor",
  () => ({
    default: ({ onSaved }: { onSaved: (config: BackendTimetableConfigDto) => void }) => (
      <button type="button" onClick={() => onSaved(config)}>
        save-config
      </button>
    ),
  }),
);

vi.mock(
  "@/features/academics/timetable/components/TimetablePeriodsEditor",
  () => ({ default: () => <div>period-editor</div> }),
);

const config = {
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
} satisfies BackendTimetableConfigDto;

const period = {
  id: "period-1",
  timetableConfigId: config.id,
  index: 1,
  label: "Period 1",
  startTime: "08:00",
  endTime: "08:45",
  type: "class",
  isInstructional: true,
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
} satisfies BackendTimetablePeriodDto;

const missingConfigStatus: TimetableSetupStatus = {
  kind: "missing_config",
  config: null,
  periods: [],
};

const missingPeriodsStatus: TimetableSetupStatus = {
  kind: "missing_periods",
  config,
  periods: [],
};

const readyStatus: TimetableSetupStatus = {
  kind: "ready",
  config,
  periods: [period],
  readOnly: false,
};

function renderWizard({
  status = missingConfigStatus,
  onComplete = vi.fn(),
  onReload = vi.fn().mockResolvedValue(undefined),
}: {
  status?: TimetableSetupStatus;
  onComplete?: () => void;
  onReload?: () => Promise<void>;
} = {}) {
  render(
    <TimetableSetupWizard
      academicYearId="year-1"
      termId="term-1"
      academicYearName="2026/2027"
      termName="First term"
      status={status}
      onReload={onReload}
      onComplete={onComplete}
    />,
  );
}

describe("TimetableSetupWizard", () => {
  it("starts at days when the term config is missing", () => {
    renderWizard();

    expect(
      screen.getByRole("heading", { name: "setup.steps.days.title" }),
    ).toHaveFocus();
    expect(screen.getByText("setup.stepStatus.current")).toBeInTheDocument();
  });

  it("resumes at periods when the config has no instructional period", () => {
    renderWizard({ status: missingPeriodsStatus });

    expect(
      screen.getByRole("heading", { name: "setup.steps.periods.title" }),
    ).toHaveFocus();
  });

  it("reloads and advances after saving the term config", async () => {
    const onReload = vi.fn().mockResolvedValue(undefined);
    renderWizard({ onReload });

    await userEvent.click(screen.getByRole("button", { name: "save-config" }));

    expect(onReload).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("heading", { name: "setup.steps.periods.title" }),
    ).toHaveFocus();
  });

  it("does not finish until an instructional period exists", () => {
    renderWizard({ status: missingPeriodsStatus });

    expect(
      screen.queryByRole("button", { name: "setup.startBuilding" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "setup.continue" }),
    ).toBeDisabled();
  });

  it("summarizes ready setup and completes through navigation", async () => {
    const onComplete = vi.fn();
    renderWizard({ status: readyStatus, onComplete });

    await userEvent.click(
      screen.getByRole("button", { name: "setup.startBuilding" }),
    );

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("lets a ready draft return to the periods step", async () => {
    renderWizard({ status: readyStatus });

    await userEvent.click(screen.getByRole("button", { name: "setup.back" }));

    expect(
      screen.getByRole("heading", { name: "setup.steps.periods.title" }),
    ).toHaveFocus();
  });
});
