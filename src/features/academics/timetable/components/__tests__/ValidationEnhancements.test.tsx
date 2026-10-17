import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";
import ValidationPanel from "../ValidationPanel";
import { emptyValidationSummary } from "../../services/timetableValidationSummary";
import type { TimetableValidationItem } from "../../services/timetableApiTypes";
import type { TimetableConflictDisplay } from "../../services/timetableConflictNormalization";
import type { ValidationReviewState } from "../ValidationReviewStatus";

vi.mock("next-intl", async () => {
  const { createTranslator } =
    await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    useLocale: () => "en",
    useTranslations: (namespace: string) =>
      createTranslator({
        locale: "en",
        messages: en,
        namespace: namespace as "academics.timetable.validationEnhancements",
      }),
  };
});

const subject: TimetableValidationItem = {
  classroomId: "class-1",
  classroom: { id: "class-1", nameAr: "الفصل الأول", nameEn: "Class 1" },
  gradeId: "grade-1",
  grade: { id: "grade-1", nameAr: "الصف الأول", nameEn: "Grade 1" },
  subjectId: "math",
  subject: {
    id: "math",
    nameAr: "الرياضيات",
    nameEn: "Mathematics",
    code: "MATH",
    color: null,
  },
  expectedWeeklyHours: 5,
  scheduledWeeklyHours: 3,
  status: "missing_teacher_allocation",
  issues: [],
};
const teacher: TimetableConflictDisplay = {
  type: "TEACHER",
  resourceId: "teacher-1",
  severity: "blocking",
  dayOfWeek: 1,
  dayKey: "mon",
  startTime: "09:00",
  endTime: "09:45",
  message: "Teacher lessons overlap",
  entryIds: ["lesson-a", "lesson-b"],
  proposedIndexes: [],
};
const review: ValidationReviewState = {
  recheck: async () => {},
  isChecking: false,
  failed: false,
  checkedAt: Date.UTC(2026, 9, 15, 9),
  isCurrent: true,
  progress: { resolved: 3, added: 1, remaining: 2 },
  hasUnsavedChanges: false,
  canPublish: false,
};
function panelProps() {
  return {
    open: true,
    locale: "en",
    validationSummary: { ...emptyValidationSummary(), items: [subject] },
    conflicts: [teacher],
    teachers: [{ id: "teacher-1", nameAr: "المعلمة نور", nameEn: "Ms. Noor" }],
    rooms: [],
    classrooms: [subject.classroom],
    review: { ...review },
    reviewContext: { academicYearId: "year-1", termId: "term-1" },
    onClose: vi.fn(),
    onConflictSelect: vi.fn(),
    requirementActions: { openDestination: vi.fn(), focusSchedule: vi.fn() },
  };
}

describe("validation enhancements", () => {
  it("explains the weekly deficit and opens targeted timetable, teacher, and requirement pages", async () => {
    const user = userEvent.setup();
    const props = panelProps();
    render(<ValidationPanel {...props} />);
    await user.click(
      screen.getByRole("tab", { name: /subject scheduling issues/i }),
    );
    expect(
      screen.getByText("Mathematics needs 2 more lessons per week."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Assign teacher" }));
    expect(props.requirementActions.openDestination).toHaveBeenLastCalledWith(
      "/academics/teacher-allocation?year=year-1&term=term-1&grade=grade-1&classroom=class-1&subject=math&missing=1&highlightCell=class-1%3Amath",
    );
    await user.click(
      screen.getByRole("button", { name: "Open classroom timetable" }),
    );
    expect(props.requirementActions.openDestination).toHaveBeenLastCalledWith(
      "/academics/timetable?year=year-1&term=term-1&classroom=class-1&grade=grade-1&configurationScope=CLASSROOM&scopeId=class-1",
    );
    await user.click(
      screen.getByRole("button", { name: "Edit weekly requirements" }),
    );
    expect(props.requirementActions.openDestination).toHaveBeenLastCalledWith(
      "/academics/subjects?year=year-1&term=term-1&tab=matrix&gradeId=grade-1&subjectId=math",
    );
  });

  it("keeps missing weekly requirements separate from a zero requirement", async () => {
    const user = userEvent.setup();
    const props = panelProps();
    props.validationSummary.items = [{ ...subject, expectedWeeklyHours: null }];
    render(<ValidationPanel {...props} />);
    await user.click(
      screen.getByRole("tab", { name: /subject scheduling issues/i }),
    );
    expect(
      screen.getByText(/Weekly requirements are not set/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/needs .* more lessons/)).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Edit weekly requirements" }),
    );
    expect(props.requirementActions.openDestination).toHaveBeenCalledWith(
      expect.stringContaining("missing=1"),
    );
  });

  it("groups matching overlaps, filters by name/type/day, and opens every affected lesson", async () => {
    const user = userEvent.setup();
    const props = panelProps();
    props.conflicts = [
      teacher,
      { ...teacher, entryIds: ["lesson-b", "lesson-c"] },
      {
        ...teacher,
        type: "ROOM",
        resourceId: "room-1",
        dayOfWeek: 2,
        message: "Room overlap",
      },
    ];
    render(<ValidationPanel {...props} />);
    await user.click(screen.getByRole("tab", { name: /conflicts/i }));
    expect(screen.getByText("3 affected lessons")).toBeInTheDocument();
    await user.type(
      screen.getByRole("searchbox", { name: /Search teacher/ }),
      "Noor",
    );
    expect(screen.queryByText("Room overlap")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Teacher lessons overlap/ }),
    );
    expect(props.onConflictSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        entryIds: ["lesson-a", "lesson-b", "lesson-c"],
      }),
    );
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(
      screen.getByRole("searchbox", { name: /Search teacher/ }),
    ).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Room", exact: true }));
    expect(
      screen.queryByText("Teacher lessons overlap"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Room overlap")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Monday" }));
    expect(screen.getByText(/No issues match/)).toBeInTheDocument();
  });

  it.each([
    { isCurrent: false },
    { hasUnsavedChanges: true },
    { isChecking: true },
    { failed: true },
    { canPublish: false },
  ])(
    "does not show publication readiness for an incomplete or stale review: %j",
    (reviewChanges) => {
      const props = panelProps();
      render(
        <ValidationPanel
          {...props}
          conflicts={[]}
          validationSummary={{ ...emptyValidationSummary(), canPublish: true }}
          review={{ ...review, canPublish: true, ...reviewChanges }}
        />,
      );
      expect(
        screen.queryByText("No blocking issues in the current checks."),
      ).not.toBeInTheDocument();
    },
  );

  it("preserves the selected tab and search through rechecks and displays progress only for current saved results", async () => {
    const user = userEvent.setup();
    const props = panelProps();
    props.review.recheck = vi.fn(async () => {});
    const { rerender } = render(<ValidationPanel {...props} />);
    expect(
      screen.getByText("3 resolved · 1 new · 2 remaining"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /conflicts/i }));
    await user.type(
      screen.getByRole("searchbox", { name: /Search teacher/ }),
      "Noor",
    );
    await user.click(screen.getByRole("button", { name: "Recheck" }));
    expect(props.review.recheck).toHaveBeenCalledOnce();
    rerender(
      <ValidationPanel {...props} review={{ ...review, isChecking: true }} />,
    );
    expect(screen.getByRole("button", { name: /Recheck/ })).toBeDisabled();
    rerender(
      <ValidationPanel
        {...props}
        review={{ ...review, hasUnsavedChanges: true }}
      />,
    );
    expect(
      screen.getByText(/Unsaved edits are not included/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("3 resolved · 1 new · 2 remaining"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /conflicts/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("searchbox", { name: /Search teacher/ }),
    ).toHaveValue("Noor");
  });
});
