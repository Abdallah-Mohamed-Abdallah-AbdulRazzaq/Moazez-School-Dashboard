import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TimetableConfigDialog from "@/features/academics/timetable/components/TimetableConfigDialog";
import type {
  BackendTimetableConfigDto,
  BackendTimetablePeriodDto,
} from "@/features/academics/timetable/services/timetableApiTypes";
import {
  createTimetablePeriodDto,
  deleteTimetablePeriod,
  updateTimetablePeriodDto,
} from "@/features/academics/timetable/services/timetablePeriodsService";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/features/academics/timetable/services/timetablePeriodsService", () => ({
  createTimetablePeriodDto: vi.fn(),
  deleteTimetablePeriod: vi.fn(),
  updateTimetablePeriodDto: vi.fn(),
}));

const timetableConfig: BackendTimetableConfigDto = {
  id: "config-1",
  academicYearId: "year-1",
  termId: "term-1",
  name: "Term timetable",
  weekStartDay: 0,
  activeDays: [0, 1, 2, 3, 4],
  scopeType: "term",
  scopeKey: "term-1",
  gradeId: null,
  sectionId: null,
  classroomId: null,
  status: "draft",
  createdAt: "2026-09-05T08:00:00.000Z",
  updatedAt: "2026-09-05T08:00:00.000Z",
};

const savedPeriod: BackendTimetablePeriodDto = {
  id: "period-1",
  timetableConfigId: "config-1",
  index: 1,
  label: "First period",
  startTime: "08:00",
  endTime: "08:45",
  type: "CLASS",
  isInstructional: true,
  createdAt: "2026-09-05T08:00:00.000Z",
  updatedAt: "2026-09-05T08:00:00.000Z",
};

const renderDialog = ({
  periods = [savedPeriod],
  readOnly = false,
}: {
  periods?: BackendTimetablePeriodDto[];
  readOnly?: boolean;
} = {}) => {
  const onSaved = vi.fn().mockResolvedValue(undefined);

  render(
    <TimetableConfigDialog
      mode="periods"
      open
      onClose={vi.fn()}
      onSaved={onSaved}
      academicYearId="year-1"
      termId="term-1"
      config={timetableConfig}
      periods={periods}
      entries={[]}
      selectedGradeId=""
      selectedSectionId=""
      selectedClassroomId=""
      readOnly={readOnly}
      locale="en"
    />,
  );

  return { onSaved };
};

describe("TimetableConfigDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prepares the next period after a successful rapid add", async () => {
    const user = userEvent.setup();
    const createdPeriod = { ...savedPeriod, id: "period-2", index: 2 };
    vi.mocked(createTimetablePeriodDto).mockResolvedValue(createdPeriod);
    const { onSaved } = renderDialog();
    const labelInput = screen.getByRole("textbox", {
      name: "config.periodLabel",
    });

    await user.type(labelInput, "Second period");
    await user.click(
      screen.getByRole("button", { name: "config.addNextPeriod" }),
    );

    await waitFor(() => {
      expect(createTimetablePeriodDto).toHaveBeenCalledWith(
        expect.objectContaining({
          timetableConfigId: "config-1",
          index: 2,
          label: "Second period",
        }),
      );
    });

    expect(onSaved).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent(
      "config.periodAdded",
    );
    expect(labelInput).toHaveValue("");
    expect(screen.getByRole("spinbutton", { name: "config.periodIndex" })).toHaveValue(3);
    expect(labelInput).toHaveFocus();
  });

  it("returns to add mode when editing is cancelled", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "config.editPeriod" }));
    await user.click(screen.getByRole("button", { name: "config.cancelEdit" }));

    expect(
      screen.getByRole("button", { name: "config.addNextPeriod" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "config.periodIndex" })).toHaveValue(2);
  });

  it("shows saved periods without entry controls for read-only users", async () => {
    renderDialog({ readOnly: true });

    expect(await screen.findByText("First period")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "config.addNextPeriod" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "config.editPeriod" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "config.deletePeriod" }),
    ).not.toBeInTheDocument();
  });
});
