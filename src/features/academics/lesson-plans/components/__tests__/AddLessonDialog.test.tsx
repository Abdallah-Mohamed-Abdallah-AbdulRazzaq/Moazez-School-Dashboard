import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getConfig, getDashboardTimetable } from "@/features/academics/timetable/services/timetableApiAdapter";
import type { WeekInfo } from "../../services/lessonPlansService";
import AddLessonDialog from "../AddLessonDialog";

vi.mock("@/features/academics/timetable/services/timetableApiAdapter", () => ({
  getConfig: vi.fn(),
  getDashboardTimetable: vi.fn(),
}));

const dashboard = (entries: unknown[] = []) => ({
  termId: "term-1",
  academicYearId: "year-1",
  publishedAt: null,
  isPublished: false,
  items: [{ classroomId: "classroom-1", entries }],
});

const week = (instructionalDays: string[]): WeekInfo => ({
  weekIndex: 2,
  startDate: "2026-09-08",
  endDate: "2026-09-14",
  instructionalDays,
  holidayDays: [],
  lostTeachingDays: 0,
  hasHolidays: false,
  plannedItemsCount: 0,
});

function renderDialog(instructionalDays: string[], onConfirm = vi.fn()) {
  render(
    <AddLessonDialog
      isOpen
      lesson={{
        id: "lesson-1",
        curriculumId: "curriculum-1",
        unitId: "unit-1",
        title: "Fractions",
        description: null,
        objectives: [],
        sortOrder: 0,
        estimatedMinutes: null,
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T00:00:00.000Z",
      }}
      weeks={[week(instructionalDays)]}
      preselectedWeekIndex={2}
      termStartDate="2026-09-01"
      termEndDate="2026-12-31"
      academicYearId="year-1"
      termId="term-1"
      gradeId="grade-1"
      sectionId="section-1"
      classroomId="classroom-1"
      teacherUserId="teacher-1"
      subjectId="subject-1"
      teacherSubjectAllocationId="allocation-1"
      onClose={vi.fn()}
      onConfirm={onConfirm}
    />,
  );
  return onConfirm;
}

describe("AddLessonDialog planned day selection", () => {
  beforeEach(() => {
    vi.mocked(getConfig).mockReset().mockResolvedValue({
      id: "config-1",
      activeDays: [3, 4],
      weekStartDay: 0,
    } as never);
    vi.mocked(getDashboardTimetable).mockReset().mockResolvedValue(
      dashboard() as never,
    );
  });

  it("blocks confirmation and reports a timetable metadata load failure", async () => {
    vi.mocked(getConfig).mockReset().mockRejectedValue(new Error("network"));
    const onConfirm = renderDialog(["2026-09-09"]);

    expect(
      await screen.findByText("timetableSlotOptions.loadError"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("validation.no_instructional_days"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "confirm" })).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
  it("defaults confirmation to the first instructional day", async () => {
    const user = userEvent.setup();
    const onConfirm = renderDialog(["2026-09-09", "2026-09-10"]);

    await screen.findByText(/Sep 9/i);
    await user.click(screen.getByRole("button", { name: "confirm" }));

    expect(onConfirm).toHaveBeenCalledWith("lesson-1", 2, "2026-09-09", null);
  });

  it("allows another instructional day in the same week", async () => {
    const user = userEvent.setup();
    const onConfirm = renderDialog(["2026-09-09", "2026-09-10"]);

    await screen.findByText(/Sep 9/i);
    await user.click(screen.getByRole("button", { name: "selectPlannedDay" }));
    await user.click(screen.getByRole("button", { name: /Sep 10/i }));
    await user.click(screen.getByRole("button", { name: "confirm" }));

    expect(onConfirm).toHaveBeenCalledWith("lesson-1", 2, "2026-09-10", null);
  });

  it("orders active instructional days from the timetable week start day", async () => {
    vi.mocked(getConfig).mockResolvedValue({
      id: "config-1",
      activeDays: [0, 3, 4],
      weekStartDay: 3,
    } as never);
    const user = userEvent.setup();
    const onConfirm = renderDialog(["2026-09-14", "2026-09-09", "2026-09-10"]);

    await screen.findByText(/Sep 9/i);
    await user.click(screen.getByRole("button", { name: "confirm" }));

    expect(onConfirm).toHaveBeenCalledWith("lesson-1", 2, "2026-09-09", null);
  });

  it("includes the selected timetable slot in confirmation", async () => {
    vi.mocked(getConfig).mockResolvedValue({
      id: "config-1",
      activeDays: [4],
      weekStartDay: 0,
    } as never);
    vi.mocked(getDashboardTimetable).mockResolvedValue(dashboard([
      {
        id: "entry-1",
        dayOfWeek: 4,
        periodId: "period-1",
        period: { label: "Period 2", index: 2 },
        teacherSubjectAllocationId: "allocation-1",
        status: "active",
        classroom: { id: "classroom-1" },
        subject: { id: "subject-1" },
        teacher: { userId: "teacher-1" },
      },
    ]) as never);
    const user = userEvent.setup();
    const onConfirm = renderDialog(["2026-09-10"]);

    await user.click(
      await screen.findByRole("button", { name: "timetableSlotOptions.label" }),
    );
    await user.click(screen.getByRole("button", { name: /Period 2/i }));
    await user.click(screen.getByRole("button", { name: "confirm" }));

    expect(onConfirm).toHaveBeenCalledWith(
      "lesson-1",
      2,
      "2026-09-10",
      expect.objectContaining({ id: "entry-1", periodId: "period-1" }),
    );
  });

  it("blocks confirmation when the week has no valid instructional day", async () => {
    renderDialog([]);

    expect(
      await screen.findByText("validation.no_instructional_days"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "confirm" })).toBeDisabled();
  });
});
