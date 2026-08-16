import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SessionPickerPanel from "../SessionPickerPanel";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/features/attendance/policies/components/ScopePicker", () => ({
  default: ({
    disabled,
    onScopeTypeChange,
    onScopeIdsChange,
  }: {
    disabled?: boolean;
    onScopeTypeChange: (scopeType: "SCHOOL") => void;
    onScopeIdsChange: (scopeIds: Record<string, string | undefined>) => void;
  }) => (
    <>
      <button type="button" disabled={disabled}>Scope control</button>
      <button
        type="button"
        onClick={() => {
          onScopeTypeChange("SCHOOL");
          onScopeIdsChange({});
        }}
      >
        Change scope
      </button>
    </>
  ),
}));

vi.mock("@/components/ui/input/DatePicker", () => ({
  default: ({ disabled }: { disabled?: boolean }) => (
    <button type="button" disabled={disabled}>Date control</button>
  ),
}));

const defaultProps = {
  scopeType: "CLASSROOM" as const,
  scopeIds: { classroomId: "classroom-1" },
  stages: [],
  grades: [],
  sections: [],
  classrooms: [],
  onScopeChange: vi.fn(),
  onScopeIdsChange: vi.fn(),
  date: "2026-02-10",
  onDateChange: vi.fn(),
  termStartDate: "2026-01-01",
  termEndDate: "2026-06-30",
  mode: "PERIOD" as const,
  periods: [
    {
      id: "period-1",
      index: 1,
      nameAr: "الحصة الأولى",
      nameEn: "Period 1",
      startTime: "08:00",
      endTime: "08:45",
    },
  ],
  selectedPeriodId: "period-1",
  onPeriodChange: vi.fn(),
  sessionStatus: "DRAFT" as const,
  canReopenForEdit: false,
  onReopenForEdit: vi.fn(),
};

describe("SessionPickerPanel", () => {
  it("disables every session-defining control while the workspace is busy", () => {
    render(<SessionPickerPanel {...defaultProps} variant="drawer" disabled />);

    expect(screen.getByRole("button", { name: "Scope control" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Date control" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "sessionPicker.prev" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "sessionPicker.next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Period 1/ })).toBeDisabled();
  });

  it("explains the scope lock and offers reopening for a submitted session", () => {
    const onReopenForEdit = vi.fn();
    render(
      <SessionPickerPanel
        {...defaultProps}
        sessionStatus="SUBMITTED"
        canReopenForEdit
        onReopenForEdit={onReopenForEdit}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "sessionPicker.submittedLockDescription",
    );
    screen.getByRole("button", { name: "sessionPicker.reopenForEdit" }).click();
    expect(onReopenForEdit).toHaveBeenCalledOnce();
  });

  it("forwards a scope-type change as one atomic scope change", async () => {
    const user = userEvent.setup();
    const onScopeChange = vi.fn();
    const onScopeIdsChange = vi.fn();
    render(
      <SessionPickerPanel
        {...defaultProps}
        onScopeChange={onScopeChange}
        onScopeIdsChange={onScopeIdsChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Change scope" }));

    expect(onScopeChange).toHaveBeenCalledWith("SCHOOL");
    expect(onScopeIdsChange).not.toHaveBeenCalled();
  });
});
