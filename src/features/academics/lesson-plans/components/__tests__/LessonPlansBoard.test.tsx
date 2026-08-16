import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLessonPlan,
  createLessonPlanItem,
  reorderLessonPlanItem,
  type LessonPlan,
  type LessonPlanItem,
} from "../../services/lessonPlansService";
import {
  getConfig,
  getDashboardTimetable,
} from "@/features/academics/timetable/services/timetableApiAdapter";
import LessonPlansBoard from "../LessonPlansBoard";

const showError = vi.fn();

vi.mock("@mui/material", () => ({
  useMediaQuery: () => false,
  useTheme: () => ({ breakpoints: { down: () => "" } }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showError, showSuccess: vi.fn() }),
}));

vi.mock("@/features/academics/timetable/services/timetableApiAdapter", () => ({
  getConfig: vi.fn(),
  getDashboardTimetable: vi.fn(),
}));

vi.mock("../LessonLibrary", () => ({
  default: (props: {
    lessons: Array<{ id: string }>;
    onDragStart: (lesson: { id: string }) => void;
  }) => (
    <button onClick={() => props.onDragStart(props.lessons[0])}>
      drag lesson
    </button>
  ),
}));

vi.mock("../WeeksBoardDesktop", () => ({
  default: (props: {
    onDropOnWeek: (weekIndex: number) => void;
    onReorder: (itemId: string, direction: "up" | "down") => void;
    pendingItemIds: Set<string>;
  }) => (
    <>
      <button onClick={() => props.onDropOnWeek(1)}>drop lesson</button>
      <button onClick={() => props.onReorder("item-2", "up")}>
        reorder lesson
      </button>
      <button onClick={() => props.onReorder("item-3", "up")}>
        overlapping reorder
      </button>
      <output data-testid="pending-items">
        {[...props.pendingItemIds].sort().join(",")}
      </output>
    </>
  ),
}));

vi.mock("../WeeksBoardMobile", () => ({ default: () => null }));
vi.mock("../ProgressSummary", () => ({ default: () => null }));
vi.mock("../EditLessonPlanDialog", () => ({ default: () => null }));
vi.mock("../SkipCancelReasonDialog", () => ({ default: () => null }));
vi.mock("../MoveLessonDialog", () => ({ default: () => null }));
vi.mock("../EditLessonPlanItemDialog", () => ({ default: () => null }));

vi.mock("../../services/lessonPlansService", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../services/lessonPlansService")>();
  return {
    ...actual,
    createLessonPlan: vi.fn(),
    createLessonPlanItem: vi.fn(),
    reorderLessonPlanItem: vi.fn(),
  };
});

const lesson = {
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
};

const renderBoard = ({
  plans = [],
  onRefreshPlanDetail = vi.fn(),
  onRefreshSummaryAndValidation = vi.fn(),
  onUpsertPlanItem = vi.fn(),
}: {
  plans?: LessonPlan[];
  onRefreshPlanDetail?: ReturnType<typeof vi.fn>;
  onRefreshSummaryAndValidation?: ReturnType<typeof vi.fn>;
  onUpsertPlanItem?: ReturnType<typeof vi.fn>;
} = {}) =>
  render(
    <LessonPlansBoard
      academicYearId="year-1"
      termId="term-1"
      termStartDate="2026-09-01"
      termEndDate="2026-12-31"
      teacherSubjectAllocationId="allocation-1"
      curriculumId="curriculum-1"
      subjectId="subject-1"
      gradeId="grade-1"
      sectionId="section-1"
      classroomId="classroom-1"
      teacherId="teacher-1"
      lessons={[lesson]}
      units={[]}
      plans={plans}
      weeks={[
        {
          weekIndex: 1,
          startDate: "2026-09-01",
          endDate: "2026-09-07",
          instructionalDays: ["2026-09-02"],
          holidayDays: [],
          lostTeachingDays: 0,
          hasHolidays: false,
          plannedItemsCount: 0,
        },
      ]}
      summary={null}
      summaryLoading={false}
      summaryError={null}
      validation={null}
      isReadOnly={false}
      librarySearchQuery=""
      librarySelectedUnitId=""
      onLibrarySearchQueryChange={vi.fn()}
      onLibrarySelectedUnitIdChange={vi.fn()}
      onRefreshPlanDetail={onRefreshPlanDetail}
      onRefreshSummaryAndValidation={onRefreshSummaryAndValidation}
      onUpsertPlan={vi.fn()}
      onRemovePlan={vi.fn()}
      onUpsertPlanItem={onUpsertPlanItem}
      onRemovePlanItem={vi.fn()}
      validationMessages={{
        noInstructionalDays: "validation.no_instructional_days",
        weekOutsideTerm: "validation.week_outside_term",
        plannedDateOutsideTerm: "validation.planned_date_outside_term",
      }}
    />,
  );

describe("LessonPlansBoard timetable metadata", () => {
  beforeEach(() => {
    showError.mockReset();
    vi.mocked(createLessonPlan).mockReset();
    vi.mocked(createLessonPlanItem).mockReset();
    vi.mocked(reorderLessonPlanItem).mockReset();
    vi.mocked(getConfig).mockReset().mockResolvedValue({
      id: "config-1",
      activeDays: [2],
      weekStartDay: 0,
    } as never);
    vi.mocked(getDashboardTimetable).mockReset();
  });

  it("blocks drag creation and reports metadata load errors accurately", async () => {
    vi.mocked(getConfig).mockReset().mockRejectedValue(new Error("network"));
    const user = userEvent.setup();
    renderBoard();

    await waitFor(() => expect(getConfig).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "drop lesson" }),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "drag lesson" }));
    await user.click(screen.getByRole("button", { name: "drop lesson" }));

    expect(showError).toHaveBeenCalledWith("timetableSlotOptions.loadError");
    expect(showError).not.toHaveBeenCalledWith(
      "validation.no_instructional_days",
    );
    expect(createLessonPlan).not.toHaveBeenCalled();
    expect(createLessonPlanItem).not.toHaveBeenCalled();
  });

  it("keeps both adjacent items pending and reconciles after both patches", async () => {
    const first = deferred<LessonPlanItem>();
    const second = deferred<LessonPlanItem>();
    vi.mocked(reorderLessonPlanItem)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const onRefreshPlanDetail = vi.fn().mockResolvedValue(reorderPlan);
    const onRefreshSummaryAndValidation = vi.fn().mockResolvedValue(undefined);
    const onUpsertPlanItem = vi.fn();
    const user = userEvent.setup();
    renderBoard({
      plans: [reorderPlan],
      onRefreshPlanDetail,
      onRefreshSummaryAndValidation,
      onUpsertPlanItem,
    });

    await user.click(screen.getByRole("button", { name: "reorder lesson" }));
    expect(screen.getByTestId("pending-items")).toHaveTextContent(
      "item-1,item-2",
    );
    expect(reorderLessonPlanItem).toHaveBeenNthCalledWith(1, {
      lessonPlanId: "plan-1",
      itemId: "item-2",
      payload: { sortOrder: 10 },
    });
    expect(reorderLessonPlanItem).toHaveBeenNthCalledWith(2, {
      lessonPlanId: "plan-1",
      itemId: "item-1",
      payload: { sortOrder: 20 },
    });

    first.resolve(reorderPlan.items[1]);
    expect(screen.getByTestId("pending-items")).toHaveTextContent(
      "item-1,item-2",
    );
    second.resolve(reorderPlan.items[0]);

    await waitFor(() =>
      expect(onRefreshPlanDetail).toHaveBeenCalledWith("plan-1", {
        silent: true,
      }),
    );
    expect(onRefreshSummaryAndValidation).toHaveBeenCalledWith({
      silent: true,
    });
    expect(onUpsertPlanItem).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByTestId("pending-items")).toHaveTextContent(""),
    );
  });

  it("reconciles partial reorder failure before reporting it", async () => {
    vi.mocked(reorderLessonPlanItem)
      .mockResolvedValueOnce(reorderPlan.items[1])
      .mockRejectedValueOnce(new Error("second patch failed"));
    const onRefreshPlanDetail = vi.fn().mockResolvedValue(reorderPlan);
    const onRefreshSummaryAndValidation = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderBoard({
      plans: [reorderPlan],
      onRefreshPlanDetail,
      onRefreshSummaryAndValidation,
    });

    await user.click(screen.getByRole("button", { name: "reorder lesson" }));

    await waitFor(() => expect(showError).toHaveBeenCalled());
    expect(onRefreshPlanDetail).toHaveBeenCalledWith("plan-1", {
      silent: true,
    });
    expect(onRefreshSummaryAndValidation).not.toHaveBeenCalled();
    expect(onRefreshPlanDetail.mock.invocationCallOrder[0]).toBeLessThan(
      showError.mock.invocationCallOrder[0],
    );
  });

  it("rejects overlapping reorder operations for the same plan", async () => {
    const first = deferred<LessonPlanItem>();
    const second = deferred<LessonPlanItem>();
    vi.mocked(reorderLessonPlanItem)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const user = userEvent.setup();
    renderBoard({
      plans: [reorderPlan],
      onRefreshPlanDetail: vi.fn().mockResolvedValue(reorderPlan),
      onRefreshSummaryAndValidation: vi.fn().mockResolvedValue(undefined),
    });

    await user.click(screen.getByRole("button", { name: "reorder lesson" }));
    await user.click(
      screen.getByRole("button", { name: "overlapping reorder" }),
    );

    expect(reorderLessonPlanItem).toHaveBeenCalledTimes(2);

    await act(async () => {
      first.resolve(reorderPlan.items[1]);
      second.resolve(reorderPlan.items[0]);
      await Promise.all([first.promise, second.promise]);
    });
  });
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

const reorderPlan = {
  id: "plan-1",
  academicYearId: "year-1",
  termId: "term-1",
  teacherSubjectAllocationId: "allocation-1",
  teacherId: "teacher-1",
  classroomId: "classroom-1",
  subjectId: "subject-1",
  curriculumId: "curriculum-1",
  title: "Week 1",
  description: null,
  status: "ACTIVE" as const,
  rawStatus: "active",
  weekIndex: 1,
  weekStartDate: "2026-09-01",
  weekEndDate: "2026-09-07",
  updatedAt: "2026-09-01T00:00:00.000Z",
  items: [
    {
      id: "item-1",
      planId: "plan-1",
      lessonId: "lesson-1",
      unitId: "unit-1",
      unitTitle: "Unit 1",
      lessonTitle: "Lesson 1",
      status: "PLANNED" as const,
      rawStatus: "planned",
      order: 10,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    },
    {
      id: "item-2",
      planId: "plan-1",
      lessonId: "lesson-2",
      unitId: "unit-1",
      unitTitle: "Unit 1",
      lessonTitle: "Lesson 2",
      status: "PLANNED" as const,
      rawStatus: "planned",
      order: 20,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    },
    {
      id: "item-3",
      planId: "plan-1",
      lessonId: "lesson-3",
      unitId: "unit-1",
      unitTitle: "Unit 1",
      lessonTitle: "Lesson 3",
      status: "PLANNED" as const,
      rawStatus: "planned",
      order: 30,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    },
  ],
} satisfies LessonPlan;
