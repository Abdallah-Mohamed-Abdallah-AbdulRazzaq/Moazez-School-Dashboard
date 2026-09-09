import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ValidationPanel from "@/features/academics/timetable/components/ValidationPanel";
import { emptyValidationSummary } from "@/features/academics/timetable/services/timetableValidationSummary";
import type { TimetableConflictDisplay } from "@/features/academics/timetable/services/timetableConflictNormalization";

const knownPeriodConflict: TimetableConflictDisplay = {
  type: "TEACHER",
  code: "teacher_conflict",
  message: "Teacher intervals overlap.",
  severity: "blocking",
  dayOfWeek: 2,
  dayKey: "tue",
  periodId: "period-2",
  periodIndex: 2,
  periodLabel: "Period 2",
  startTime: "09:00",
  endTime: "09:45",
  entryIds: ["entry-1"],
  proposedIndexes: [],
  resourceId: "teacher-1",
};

describe("ValidationPanel conflict display", () => {
  it("shows canonical period details and selects a conflict accessibly", async () => {
    const user = userEvent.setup();
    const onConflictSelect = vi.fn();
    renderPanel({
      conflicts: [knownPeriodConflict],
      selectedConflict: knownPeriodConflict,
      onConflictSelect,
    });

    expect(screen.getByText("Period 2")).toBeInTheDocument();
    expect(screen.getByText("9:00 AM - 9:45 AM")).toBeInTheDocument();
    expect(screen.getByText("Teacher intervals overlap.")).toBeInTheDocument();

    const conflictRow = screen.getByRole("button", {
      name: /Teacher intervals overlap\./,
    });
    expect(conflictRow).toHaveAttribute("aria-current", "true");
    await user.click(conflictRow);
    expect(onConflictSelect).toHaveBeenCalledWith(knownPeriodConflict);
  });

  it("uses only backend detail when a period cannot be resolved", () => {
    renderPanel({
      conflicts: [
        {
          ...knownPeriodConflict,
          message: "Backend detail for a removed period.",
          dayOfWeek: null,
          dayKey: undefined,
          periodId: "deleted-period",
          periodIndex: undefined,
          periodLabel: undefined,
          startTime: undefined,
          endTime: undefined,
        },
      ],
    });

    expect(
      screen.getByText("Backend detail for a removed period."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/deleted-period/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Period 0/)).not.toBeInTheDocument();
  });

  it("shows the localized classroom resource for classroom conflicts", () => {
    renderPanel({
      conflicts: [
        {
          ...knownPeriodConflict,
          type: "CLASSROOM",
          code: "classroom_conflict",
          message: "Classroom intervals overlap.",
          resourceId: "classroom-1",
        },
      ],
      classrooms: [
        {
          id: "classroom-1",
          nameAr: "الفصل الأول",
          nameEn: "Classroom 1",
        },
      ],
    });

    expect(screen.getByText("Classroom 1")).toBeInTheDocument();
  });
});

function renderPanel({
  conflicts,
  classrooms = [],
  selectedConflict = null,
  onConflictSelect = vi.fn(),
}: {
  conflicts: TimetableConflictDisplay[];
  classrooms?: Array<{ id: string; nameAr: string; nameEn: string }>;
  selectedConflict?: TimetableConflictDisplay | null;
  onConflictSelect?: (conflict: TimetableConflictDisplay) => void;
}) {
  render(
    <ValidationPanel
      open
      validationSummary={emptyValidationSummary()}
      conflicts={conflicts}
      teachers={[
        {
          id: "teacher-1",
          nameAr: "المعلمة نور",
          nameEn: "Ms. Noor",
        },
      ]}
      rooms={[]}
      classrooms={classrooms}
      selectedConflict={selectedConflict}
      onConflictSelect={onConflictSelect}
      onClose={vi.fn()}
      locale="en"
    />,
  );
}
