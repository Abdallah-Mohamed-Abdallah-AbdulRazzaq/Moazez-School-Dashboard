import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import { getDashboardTimetable } from "@/features/academics/timetable/services/timetableApiAdapter";
import AutoPlanDialog from "../AutoPlanDialog";

vi.mock("@/features/academics/timetable/services/timetableApiAdapter", () => ({
  getDashboardTimetable: vi.fn(),
}));

const scope = {
  academicYearId: "year-1",
  termId: "term-1",
  gradeId: "grade-1",
  sectionId: "section-1",
  classroomId: "classroom-1",
  subjectId: "subject-1",
};

const ready = {
  canPreview: true,
  canApply: true,
  previewBlockingReasons: [],
  applyBlockingReasons: [],
  warnings: [],
} as const;

const previewResponse = {
  termId: "term-1",
  academicYearId: "year-1",
  teacherSubjectAllocationId: "allocation-1",
  dryRun: true,
  summary: {
    candidateLessons: 1,
    availableSlots: 1,
    proposedItems: 1,
    createdItems: 0,
    skippedExistingItems: 0,
    skippedHolidaySlots: 0,
  },
  items: [],
};

const timetableEntry = (id: string) => ({
  id,
  timetableConfigId: "config-1",
  periodId: "period-1",
  dayOfWeek: 2,
  period: {
    id: "period-1",
    index: 1,
    label: "Period 1",
    startTime: "08:00",
    endTime: "08:45",
  },
  classroom: {
    id: "classroom-1",
    nameAr: "الفصل الأول",
    nameEn: "Classroom 1",
  },
  subject: {
    id: "subject-1",
    nameAr: "الرياضيات",
    nameEn: "Mathematics",
  },
  teacher: { userId: "teacher-1", fullName: "Teacher One" },
  room: null,
  teacherSubjectAllocationId: "allocation-1",
  notes: null,
  status: "active",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
});

const timetableDashboard = (entryId?: string) => ({
  termId: "term-1",
  academicYearId: "year-1",
  publishedAt: "2026-09-01T00:00:00.000Z",
  isPublished: true,
  items: entryId
    ? [
        {
          classroomId: "classroom-1",
          classroom: {
            id: "classroom-1",
            nameAr: "الفصل الأول",
            nameEn: "Classroom 1",
          },
          gradeId: "grade-1",
          grade: {
            id: "grade-1",
            nameAr: "الصف الأول",
            nameEn: "Grade 1",
          },
          effectiveConfig: {
            id: "config-1",
            name: "Published timetable",
            scopeType: "classroom",
            scopeKey: "classroom-1",
            stageId: null,
            status: "active",
            activeDays: [2],
          },
          configs: [],
          periods: [],
          entries: [timetableEntry(entryId)],
        },
      ]
    : [],
});

describe("AutoPlanDialog missing-data actions", () => {
  beforeEach(() => {
    vi.mocked(getDashboardTimetable)
      .mockReset()
      .mockResolvedValue(timetableDashboard());
  });

  it.each([
    [
      "academics.lesson_plan.auto_plan_no_slots",
      "ctas.timetable",
      "/en/academics/timetable?year=year-1&term=term-1&grade=grade-1&section=section-1&classroom=classroom-1",
    ],
    [
      "academics.lesson_plan.auto_plan_no_curriculum",
      "ctas.curriculum",
      "/en/academics/curriculum?year=year-1&term=term-1&filterGrade=grade-1&filterSubject=subject-1",
    ],
  ] as const)(
    "offers a scoped resolution for %s",
    async (code, label, expectedHref) => {
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      render(
        <AutoPlanDialog
          isOpen
          termStartDate="2026-09-01"
          termEndDate="2026-12-31"
          onClose={vi.fn()}
          onPreview={vi
            .fn()
            .mockRejectedValue(new ApiError("blocked", 422, code))}
          onApply={vi.fn()}
          showError={vi.fn()}
          readiness={ready}
          previewBlockedMessage="preview blocked"
          applyBlockedMessage="apply blocked"
          hasVisibleLessons
          locale="en"
          scope={scope}
          onNavigate={onNavigate}
        />,
      );

      await user.click(screen.getByRole("button", { name: "actions.preview" }));
      const resolutionButton = await screen.findByRole("button", {
        name: label,
      });
      await user.click(resolutionButton);

      expect(onNavigate).toHaveBeenCalledWith(expectedHref);
    },
  );

  it("allows Preview but keeps Apply blocked for a closed term", async () => {
    const onPreview = vi.fn().mockResolvedValue(previewResponse);
    const onApply = vi.fn();
    const user = userEvent.setup();
    render(
      <AutoPlanDialog
        isOpen
        termStartDate="2026-09-01"
        termEndDate="2026-12-31"
        onClose={vi.fn()}
        onPreview={onPreview}
        onApply={onApply}
        showError={vi.fn()}
        readiness={{
          ...ready,
          canApply: false,
          applyBlockingReasons: ["closed_term"],
        }}
        previewBlockedMessage="preview blocked"
        applyBlockedMessage="closed term apply blocked"
        hasVisibleLessons
        locale="en"
        scope={scope}
        onNavigate={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "actions.preview" }));

    expect(onPreview).toHaveBeenCalledWith({
      from: "2026-09-01",
      to: "2026-12-31",
      overwrite: false,
    });
    expect(
      screen.getByRole("button", { name: "actions.apply" }),
    ).toBeDisabled();
    expect(screen.getByText("closed term apply blocked")).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("previews and applies independently when both actions are ready", async () => {
    const onPreview = vi.fn().mockResolvedValue(previewResponse);
    const onApply = vi.fn().mockResolvedValue({
      ...previewResponse,
      dryRun: false,
    });
    const user = userEvent.setup();
    render(
      <AutoPlanDialog
        isOpen
        termStartDate="2026-09-01"
        termEndDate="2026-12-31"
        onClose={vi.fn()}
        onPreview={onPreview}
        onApply={onApply}
        showError={vi.fn()}
        readiness={ready}
        previewBlockedMessage="preview blocked"
        applyBlockedMessage="apply blocked"
        hasVisibleLessons
        locale="en"
        scope={scope}
        onNavigate={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "actions.preview" }));
    await user.click(
      await screen.findByRole("button", { name: "actions.apply" }),
    );

    expect(onPreview).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith({
      from: "2026-09-01",
      to: "2026-12-31",
      overwrite: false,
    });
  });

  it("shows the real timetable period instead of its UUID", async () => {
    const timetableEntryId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    vi.mocked(getDashboardTimetable).mockResolvedValue(
      timetableDashboard(timetableEntryId),
    );
    const onPreview = vi.fn().mockResolvedValue({
      ...previewResponse,
      items: [
        {
          lessonId: "lesson-1",
          title: "Fractions",
          plannedDate: "2026-09-02",
          timetableEntryId,
          weekIndex: 1,
          status: "proposed",
        },
      ],
    });
    const user = userEvent.setup();
    render(
      <AutoPlanDialog
        isOpen
        termStartDate="2026-09-01"
        termEndDate="2026-12-31"
        onClose={vi.fn()}
        onPreview={onPreview}
        onApply={vi.fn()}
        showError={vi.fn()}
        readiness={ready}
        previewBlockedMessage="preview blocked"
        applyBlockedMessage="apply blocked"
        hasVisibleLessons
        locale="en"
        scope={scope}
        onNavigate={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "actions.preview" }));

    expect(await screen.findByText(/Period 1.*Mathematics/)).toBeInTheDocument();
    expect(screen.queryByText(timetableEntryId)).not.toBeInTheDocument();
  });

  it("discards a preview response when the form changes before it resolves", async () => {
    const previewRequest = deferred<typeof previewResponse>();
    const user = userEvent.setup();
    render(
      <AutoPlanDialog
        isOpen
        termStartDate="2026-09-01"
        termEndDate="2026-12-31"
        onClose={vi.fn()}
        onPreview={vi.fn().mockReturnValue(previewRequest.promise)}
        onApply={vi.fn()}
        showError={vi.fn()}
        readiness={ready}
        previewBlockedMessage="preview blocked"
        applyBlockedMessage="apply blocked"
        hasVisibleLessons
        locale="en"
        scope={scope}
        onNavigate={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "actions.preview" }));
    await user.click(screen.getByRole("checkbox"));
    await act(async () => {
      previewRequest.resolve(previewResponse);
      await previewRequest.promise;
    });

    expect(
      screen.getByRole("button", { name: "actions.apply" }),
    ).toBeDisabled();
  });

  it("discards a preview response from a previous dialog session", async () => {
    const previewRequest = deferred<typeof previewResponse>();
    const props = {
      termStartDate: "2026-09-01",
      termEndDate: "2026-12-31",
      onClose: vi.fn(),
      onPreview: vi.fn().mockReturnValue(previewRequest.promise),
      onApply: vi.fn(),
      showError: vi.fn(),
      readiness: ready,
      previewBlockedMessage: "preview blocked",
      applyBlockedMessage: "apply blocked",
      hasVisibleLessons: true,
      locale: "en",
      scope,
      onNavigate: vi.fn(),
    };
    const user = userEvent.setup();
    const { rerender } = render(<AutoPlanDialog isOpen {...props} />);

    await user.click(screen.getByRole("button", { name: "actions.preview" }));
    rerender(<AutoPlanDialog isOpen={false} {...props} />);
    rerender(<AutoPlanDialog isOpen {...props} />);
    await act(async () => {
      previewRequest.resolve(previewResponse);
      await previewRequest.promise;
    });

    expect(
      screen.getByRole("button", { name: "actions.apply" }),
    ).toBeDisabled();
  });
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};
