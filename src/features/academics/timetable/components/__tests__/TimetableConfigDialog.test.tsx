import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TimetableConfigDialog from "@/features/academics/timetable/components/TimetableConfigDialog";
import type {
  BackendTimetableConfigDto,
  BackendTimetablePeriodDto,
} from "@/features/academics/timetable/services/timetableApiTypes";
import {
  createTimetablePeriodDto,
} from "@/features/academics/timetable/services/timetablePeriodsService";
import { upsertBackendTimetableConfig } from "@/features/academics/timetable/services/timetableConfigService";
import type { TimetableScopeSelection } from "@/features/academics/timetable/services/timetableScope";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/features/academics/timetable/services/timetablePeriodsService", () => ({
  createTimetablePeriodDto: vi.fn(),
  deleteTimetablePeriod: vi.fn(),
  updateTimetablePeriodDto: vi.fn(),
}));

vi.mock("@/features/academics/timetable/services/timetableConfigService", () => ({
  upsertBackendTimetableConfig: vi.fn(),
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
  stageId: null,
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
  mode = "periods",
  config = timetableConfig,
  selectedStageId = "",
  allowScopeSelection = true,
  fixedName,
  fixedScope,
  onContinue,
}: {
  periods?: BackendTimetablePeriodDto[];
  readOnly?: boolean;
  mode?: "config" | "periods";
  config?: BackendTimetableConfigDto | null;
  selectedStageId?: string;
  allowScopeSelection?: boolean;
  fixedName?: string;
  fixedScope?: TimetableScopeSelection;
  onContinue?: () => void;
} = {}) => {
  const onSaved = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();

  render(
    <TimetableConfigDialog
      mode={mode}
      open
      onClose={onClose}
      onSaved={onSaved}
      academicYearId="year-1"
      termId="term-1"
      config={config}
      periods={periods}
      entries={[]}
      selectedStageId={selectedStageId}
      selectedGradeId=""
      selectedSectionId=""
      selectedClassroomId=""
      readOnly={readOnly}
      locale="en"
      allowScopeSelection={allowScopeSelection}
      fixedName={fixedName}
      fixedScope={fixedScope}
      onContinue={onContinue}
    />,
  );

  return { onClose, onSaved };
};

describe("TimetableConfigDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the name label stable and announces its required-field error", async () => {
    const user = userEvent.setup();
    renderDialog({ mode: "config" });
    const nameField = screen.getByRole("textbox", { name: "config.name" });

    await user.clear(nameField);
    await user.click(screen.getByRole("button", { name: "config.saveConfig" }));

    expect(screen.getByRole("textbox", { name: "config.name", exact: true })).toBe(nameField);
    expect(nameField).toHaveAttribute("aria-invalid", "true");
    expect(nameField).toHaveAccessibleDescription("config.validation.nameRequired");
    expect(screen.getByRole("alert")).toHaveTextContent("config.validation.nameRequired");
  });

  it("locks the submitted fields while saving and restores editing after a failure", async () => {
    let failSave!: (error: Error) => void;
    vi.mocked(upsertBackendTimetableConfig).mockReturnValueOnce(new Promise((_resolve, reject) => { failSave = reject; }));
    const { onClose } = renderDialog({ mode: "config" });
    await userEvent.click(screen.getByRole("button", { name: "config.saveConfig" }));
    expect(screen.getByRole("textbox", { name: "config.name" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Monday" })).toBeDisabled();
    await act(async () => { failSave(new Error("Network unavailable")); });
    expect(screen.getByRole("textbox", { name: "config.name" })).toBeEnabled();
    expect(screen.getByRole("checkbox", { name: "Monday" })).toBeEnabled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it.each([
    { periods: [], ready: false },
    { periods: [{ ...savedPeriod, isInstructional: false }], ready: false },
    { periods: [savedPeriod], ready: true },
  ])("allows scheduling only with a saved instructional period ($ready)", async ({ periods, ready }) => {
    const onContinue = vi.fn();
    renderDialog({ periods, onContinue });
    const continueButton = screen.getByRole("button", { name: "workflow.continueScheduling" });
    if (!ready) expect(continueButton).toBeDisabled();
    else {
      await userEvent.click(continueButton);
      expect(onContinue).toHaveBeenCalledOnce();
    }
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
    fireEvent.change(screen.getByLabelText("config.startTime"), {
      target: { value: "09:00" },
    });
    fireEvent.change(screen.getByLabelText("config.endTime"), {
      target: { value: "09:45" },
    });
    await user.click(
      screen.getByRole("button", { name: "config.addNextPeriod" }),
    );

    await waitFor(() => {
      expect(createTimetablePeriodDto).toHaveBeenCalledWith(
        expect.objectContaining({
          timetableConfigId: "config-1",
          index: 2,
          label: "Second period",
          startTime: "09:00",
          endTime: "09:45",
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

  it("creates a stage config and closes after saving", async () => {
    const user = userEvent.setup();
    vi.mocked(upsertBackendTimetableConfig).mockResolvedValue({
      ...timetableConfig,
      scopeType: "stage",
      scopeKey: "stage-1",
      stageId: "stage-1",
    });
    const { onClose, onSaved } = renderDialog({
      mode: "config",
      config: null,
      periods: [],
      selectedStageId: "stage-1",
    });

    await user.click(screen.getByRole("button", { name: "config.saveConfig" }));

    await waitFor(() => {
      expect(upsertBackendTimetableConfig).toHaveBeenCalledWith(
        expect.objectContaining({ scopeType: "STAGE", stageId: "stage-1" }),
      );
    });
    expect(onSaved).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("creates a term config when term scope is selected from a narrower context", async () => {
    const user = userEvent.setup();
    vi.mocked(upsertBackendTimetableConfig).mockResolvedValue(timetableConfig);
    renderDialog({
      mode: "config",
      config: null,
      periods: [],
      selectedStageId: "stage-1",
    });

    await user.click(screen.getByLabelText("config.scopeLabel"));
    await user.click(
      screen.getByRole("button", { name: "config.scopeOptions.term" }),
    );
    await user.click(screen.getByRole("button", { name: "config.saveConfig" }));

    await waitFor(() => {
      expect(upsertBackendTimetableConfig).toHaveBeenCalledOnce();
    });
    const payload = vi.mocked(upsertBackendTimetableConfig).mock.calls[0][0];
    expect(payload).toMatchObject({ scopeType: "TERM" });
    expect(payload).not.toHaveProperty("stageId");
  });

  it("locks first-run setup to a generated term config", async () => {
    const user = userEvent.setup();
    vi.mocked(upsertBackendTimetableConfig).mockResolvedValue(timetableConfig);
    renderDialog({
      mode: "config",
      config: null,
      periods: [],
      selectedStageId: "stage-1",
      allowScopeSelection: false,
      fixedName: "First term timetable",
    });

    expect(screen.queryByLabelText("config.name")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("config.scopeLabel")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "config.saveConfig" }));

    await waitFor(() => {
      expect(upsertBackendTimetableConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          scopeType: "TERM",
          name: "First term timetable",
        }),
      );
    });
  });

  it("locks an explicit override editor to its selected scope", async () => {
    const user = userEvent.setup();
    vi.mocked(upsertBackendTimetableConfig).mockResolvedValue({
      ...timetableConfig,
      scopeType: "stage",
      scopeKey: "stage-1",
      stageId: "stage-1",
    });
    renderDialog({
      mode: "config",
      config: null,
      periods: [],
      allowScopeSelection: false,
      fixedScope: { scopeType: "STAGE", stageId: "stage-1" },
    });

    await user.click(screen.getByRole("button", { name: "config.saveConfig" }));

    await waitFor(() => {
      expect(upsertBackendTimetableConfig).toHaveBeenCalledWith(
        expect.objectContaining({ scopeType: "STAGE", stageId: "stage-1" }),
      );
    });
  });
});
