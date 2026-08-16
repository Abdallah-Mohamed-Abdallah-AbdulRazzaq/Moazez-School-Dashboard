import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getConfig, getDashboardTimetable } from "@/features/academics/timetable/services/timetableApiAdapter";
import EditLessonPlanItemDialog from "../EditLessonPlanItemDialog";

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

const item = {
  id: "item-1",
  planId: "plan-1",
  lessonId: "lesson-1",
  unitId: "unit-1",
  unitTitle: "Unit",
  lessonTitle: "Lesson",
  title: "Old title",
  notes: "Old notes",
  status: "PLANNED" as const,
  rawStatus: "planned",
  order: 0,
  plannedDate: "2026-09-16",
  createdAt: "2026-09-01",
  updatedAt: "2026-09-01",
};

const week = {
  weekIndex: 3,
  startDate: "2026-09-15",
  endDate: "2026-09-21",
  instructionalDays: ["2026-09-16", "2026-09-17"],
  holidayDays: [],
  lostTeachingDays: 0,
  hasHolidays: false,
  plannedItemsCount: 1,
};

const scope = {
  academicYearId: "year-1",
  termId: "term-1",
  gradeId: "grade-1",
  sectionId: "section-1",
  classroomId: "classroom-1",
  teacherUserId: "teacher-1",
  subjectId: "subject-1",
  teacherSubjectAllocationId: "allocation-1",
};

describe("EditLessonPlanItemDialog", () => {
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

  it("blocks saving and reports a timetable metadata load failure", async () => {
    vi.mocked(getConfig).mockReset().mockRejectedValue(new Error("network"));
    const onSave = vi.fn();
    render(
      <EditLessonPlanItemDialog
        item={item}
        week={week}
        {...scope}
        onClose={vi.fn()}
        onSave={onSave}
        loading={false}
      />,
    );

    expect(
      await screen.findByText("timetableSlotOptions.loadError"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("validation.no_instructional_days"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "editItem.save" })).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves title notes and another instructional day without a slot", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(
      <EditLessonPlanItemDialog
        item={item}
        week={week}
        termStartDate="2026-09-01"
        termEndDate="2026-12-31"
        {...scope}
        onClose={vi.fn()}
        onSave={onSave}
        loading={false}
      />,
    );

    await screen.findByText("timetableSlotOptions.noSlots");
    const [titleInput, notesInput] = screen.getAllByRole("textbox");
    await user.clear(titleInput);
    await user.type(titleInput, "New title");
    await user.clear(notesInput);
    await user.type(notesInput, "New notes");
    await user.click(screen.getByRole("button", { name: "editItem.plannedDay" }));
    await user.click(screen.getByRole("button", { name: /Sep 17/i }));
    await user.click(screen.getByRole("button", { name: "editItem.save" }));

    expect(onSave).toHaveBeenCalledWith({
      title: "New title",
      notes: "New notes",
      plannedDate: "2026-09-17",
      dayOfWeek: 4,
      timetableEntryId: null,
      periodId: null,
      periodLabel: null,
    });
  });

  it("blocks saving when the week has no valid instructional day", async () => {
    render(
      <EditLessonPlanItemDialog
        item={item}
        week={{ ...week, instructionalDays: [] }}
        {...scope}
        onClose={vi.fn()}
        onSave={vi.fn()}
        loading={false}
      />,
    );

    expect(await screen.findByText("validation.no_instructional_days")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "editItem.save" })).toBeDisabled();
  });

  it("saves the selected timetable slot metadata", async () => {
    vi.mocked(getConfig).mockReset().mockResolvedValue({
      id: "config-1",
      activeDays: [3],
      weekStartDay: 0,
    } as never);
    vi.mocked(getDashboardTimetable).mockReset().mockResolvedValue(dashboard([
      {
        id: "entry-1",
        dayOfWeek: 3,
        periodId: "period-1",
        period: { label: "Period 1", index: 1 },
        teacherSubjectAllocationId: "allocation-1",
        status: "active",
      },
    ]) as never);
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(
      <EditLessonPlanItemDialog
        item={item}
        week={week}
        {...scope}
        onClose={vi.fn()}
        onSave={onSave}
        loading={false}
      />,
    );

    await user.click(
      await screen.findByRole("button", { name: "timetableSlotOptions.label" }),
    );
    await user.click(screen.getByRole("button", { name: "Period 1" }));
    await user.click(screen.getByRole("button", { name: "editItem.save" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        dayOfWeek: 3,
        timetableEntryId: "entry-1",
        periodId: "period-1",
        periodLabel: "Period 1",
      }),
    );
  });
});
