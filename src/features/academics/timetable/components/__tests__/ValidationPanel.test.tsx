import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ValidationPanel from "@/features/academics/timetable/components/ValidationPanel";
import {
  emptyValidationSummary,
  type TimetableValidationSummary,
} from "@/features/academics/timetable/services/timetableValidationSummary";
import type { TimetableConflictDisplay } from "@/features/academics/timetable/services/timetableConflictNormalization";
import type {
  TimetablePublishReason,
  TimetableValidationItem,
} from "@/features/academics/timetable/services/timetableApiTypes";
import type { PublicationReasonReferenceNames } from "@/features/academics/timetable/services/timetablePublicationReasons";

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
  it.each([
    {
      locale: "en",
      forwardKey: "{ArrowRight}",
      subjectsLabel: /subject scheduling issues/i,
    },
    {
      locale: "ar",
      forwardKey: "{ArrowLeft}",
      subjectsLabel: /مشاكل المواد والفصول/i,
    },
  ])(
    "moves forward through validation tabs in $locale",
    async ({ locale, forwardKey, subjectsLabel }) => {
      const user = userEvent.setup();
      renderPanel({
        conflicts: [knownPeriodConflict],
        locale,
      });
      const overviewTab = screen.getByRole("tab", {
        name: locale === "ar" ? /نظرة عامة/i : /overview/i,
      });

      act(() => overviewTab.focus());
      await user.keyboard(forwardKey);

      expect(screen.getByRole("tab", { name: subjectsLabel })).toHaveFocus();
    },
  );

  it("shows canonical period details and selects a conflict accessibly", async () => {
    const user = userEvent.setup();
    const onConflictSelect = vi.fn();
    renderPanel({
      conflicts: [knownPeriodConflict],
      selectedConflict: knownPeriodConflict,
      onConflictSelect,
    });
    await user.click(screen.getByRole("button", { name: /review next issue/i }));

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

  it("uses only backend detail when a period cannot be resolved", async () => {
    const user = userEvent.setup();
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
    await user.click(screen.getByRole("tab", { name: /conflicts/i }));

    expect(
      screen.getByText("Backend detail for a removed period."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/deleted-period/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Period 0/)).not.toBeInTheDocument();
  });

  it("shows the localized classroom resource for classroom conflicts", async () => {
    const user = userEvent.setup();
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

    await user.click(screen.getByRole("tab", { name: /conflicts/i }));
    expect(screen.getByText("Classroom 1")).toBeInTheDocument();
  });

  it("does not expose an unresolved resource UUID", async () => {
    const user = userEvent.setup();
    const resourceId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    renderPanel({
      conflicts: [{ ...knownPeriodConflict, resourceId }],
    });

    await user.click(screen.getByRole("tab", { name: /conflicts/i }));

    expect(screen.getByText("Unknown resource")).toBeInTheDocument();
    expect(screen.queryByText(resourceId)).not.toBeInTheDocument();
  });

  it("renders duplicate backend publication reasons without a React key warning", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const duplicateReason = {
      code: "under_scheduled_subject",
      message: "Scheduled periods are below weekly hours.",
    };

    try {
      const user = userEvent.setup();
      renderPanel({
        conflicts: [],
        publicationReasons: [duplicateReason, duplicateReason],
      });
      await user.click(
        screen.getByRole("tab", { name: /publishing requirements/i }),
      );

      expect(
        screen.getAllByText(
          "Scheduled periods are below the required weekly hours.",
        ),
      ).toHaveLength(2);
      expect(consoleError.mock.calls.flat().join(" ")).not.toContain(
        "Encountered two children with the same key",
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it("shows only publishing requirements after selecting that tab", async () => {
    const user = userEvent.setup();
    renderPanel({
      conflicts: [knownPeriodConflict],
      publicationReasons: [
        {
          code: "under_scheduled_subject",
          message: "Scheduled periods are below weekly hours.",
        },
      ],
    });
    await user.click(
      screen.getByRole("tab", { name: /publishing requirements/i }),
    );

    expect(
      screen.getByText(
        "Scheduled periods are below the required weekly hours.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Teacher intervals overlap."),
    ).not.toBeInTheDocument();
  });

  it("shows a real resource name instead of a publication reason UUID", async () => {
    const user = userEvent.setup();
    const roomId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    renderPanel({
      conflicts: [],
      publicationReasons: [
        {
          code: "room_capacity_insufficient",
          message: "Scheduled room capacity is insufficient.",
          details: { roomId },
        },
      ],
      publicationReferenceNames: { roomId: { [roomId]: "Science Lab" } },
    });

    await user.click(
      screen.getByRole("tab", { name: /publishing requirements/i }),
    );

    expect(screen.getByText("Science Lab")).toBeInTheDocument();
    expect(screen.queryByText(roomId)).not.toBeInTheDocument();
  });

  it("opens timetable setup from a configuration requirement", async () => {
    const user = userEvent.setup();
    const onOpenDestination = vi.fn();
    renderPanel({
      conflicts: [],
      publicationReasons: [
        {
          code: "no_instructional_periods",
          message: "Add an instructional period.",
        },
      ],
      onOpenDestination,
    });

    await user.click(
      screen.getByRole("tab", { name: /publishing requirements/i }),
    );

    expect(
      screen.getByText(/review the timetable scope, term, active days/i),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /open timetable setup/i }),
    );
    expect(onOpenDestination).toHaveBeenCalledWith(
      "/academics/timetable/setup",
    );
  });

  it("opens the timetable from an empty-schedule requirement", async () => {
    const user = userEvent.setup();
    const onFocusSchedule = vi.fn();
    renderPanel({
      conflicts: [],
      publicationReasons: [
        { code: "no_entries", message: "Add entries before publishing." },
      ],
      onFocusSchedule,
    });

    await user.click(
      screen.getByRole("tab", { name: /publishing requirements/i }),
    );

    expect(
      screen.getByText(/add at least one entry to the timetable/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^open timetable$/i }));
    expect(onFocusSchedule).toHaveBeenCalledOnce();
  });

  it("opens the subjects matrix with the affected grade and subject selected", async () => {
    const user = userEvent.setup();
    const onOpenDestination = vi.fn();
    renderPanel({
      conflicts: [],
      publicationReasons: [
        {
          code: "under_scheduled_subject",
          message: "Scheduled periods are below weekly hours.",
          details: { gradeId: "grade-1", subjectId: "mathematics" },
        },
      ],
      validationSummary: validationSummaryWithItems([
        validationItem("mathematics", "Mathematics"),
      ]),
      onOpenDestination,
    });

    await user.click(
      screen.getByRole("tab", { name: /publishing requirements/i }),
    );
    expect(
      screen.getByText(/adjust scheduled periods to match/i),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /open subjects/i }),
    );
    expect(onOpenDestination).toHaveBeenCalledWith(
      "/academics/subjects?tab=matrix&gradeId=grade-1&subjectId=mathematics",
    );
  });

  it.each([
    {
      code: "missing_teacher_allocation",
      buttonName: /open teacher allocation/i,
      details: {
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
        subjectId: "subject-1",
      },
      expectedPath:
        "/academics/teacher-allocation?grade=grade-1&section=section-1&classroom=classroom-1&subject=subject-1&missing=1&highlightCell=classroom-1%3Asubject-1",
      publicationReferenceNames: {},
    },
    {
      code: "room_inactive",
      buttonName: /open rooms/i,
      details: { roomId: "room-1" },
      expectedPath: "/academics/rooms?roomSearch=Science+Lab",
      publicationReferenceNames: {
        roomId: { "room-1": "Science Lab" },
      },
    },
  ] as const)(
    "opens the repair page for $code with problem-selection params",
    async ({
      code,
      buttonName,
      details,
      expectedPath,
      publicationReferenceNames,
    }) => {
      const user = userEvent.setup();
      const onOpenDestination = vi.fn();
      renderPanel({
        conflicts: [],
        publicationReasons: [
          { code, message: "Repair this requirement.", details },
        ],
        publicationReferenceNames,
        onOpenDestination,
      });

      await user.click(
        screen.getByRole("tab", { name: /publishing requirements/i }),
      );
      await user.click(screen.getByRole("button", { name: buttonName }));

      expect(onOpenDestination).toHaveBeenCalledWith(expectedPath);
    },
  );

  it("opens the timetable filtered to the conflicting classroom", async () => {
    const user = userEvent.setup();
    const onOpenDestination = vi.fn();
    renderPanel({
      conflicts: [],
      publicationReasons: [
        {
          code: "classroom_conflict",
          message: "Classroom has a conflicting entry.",
          details: {
            gradeId: "grade-1",
            sectionId: "section-1",
            classroomId: "classroom-1",
          },
        },
      ],
      onOpenDestination,
    });

    await user.click(
      screen.getByRole("tab", { name: /publishing requirements/i }),
    );
    await user.click(screen.getByRole("button", { name: /^open timetable$/i }));

    expect(onOpenDestination).toHaveBeenCalledWith(
      "/academics/timetable?grade=grade-1&section=section-1&classroom=classroom-1",
    );
  });

  it("searches subject issues by their localized names", async () => {
    const user = userEvent.setup();
    renderPanel({
      conflicts: [],
      validationSummary: validationSummaryWithItems([
        validationItem("mathematics", "Mathematics"),
        validationItem("biology", "Biology"),
      ]),
    });

    await user.click(
      screen.getByRole("tab", { name: /subject scheduling issues/i }),
    );
    await user.type(
      screen.getByRole("searchbox", {
        name: /search by subject, classroom, or grade/i,
      }),
      "Mathematics",
    );

    expect(screen.getByText("Mathematics")).toBeInTheDocument();
    expect(screen.queryByText("Biology")).not.toBeInTheDocument();
    expect(screen.getByText("Results: 1")).toBeInTheDocument();
  });

  it("filters subject issues by status", async () => {
    const user = userEvent.setup();
    renderPanel({
      conflicts: [],
      validationSummary: validationSummaryWithItems([
        validationItem("mathematics", "Mathematics", "under_scheduled"),
        validationItem("biology", "Biology", "missing_teacher_allocation"),
      ]),
    });

    await user.click(
      screen.getByRole("tab", { name: /subject scheduling issues/i }),
    );
    await user.click(screen.getByRole("button", { name: /^Missing teacher$/i }));

    expect(screen.getByText("Biology")).toBeInTheDocument();
    expect(screen.queryByText("Mathematics")).not.toBeInTheDocument();
    expect(screen.getByText("Results: 1")).toBeInTheDocument();
  });

  it("progressively reveals long subject issue lists", async () => {
    const user = userEvent.setup();
    const issues = Array.from({ length: 21 }, (_, index) =>
      validationItem(`subject-${index + 1}`, `Subject ${index + 1}`),
    );
    renderPanel({
      conflicts: [],
      validationSummary: validationSummaryWithItems(issues),
    });

    await user.click(
      screen.getByRole("tab", { name: /subject scheduling issues/i }),
    );

    expect(screen.queryByText("Subject 21")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /show more \(1\)/i }));
    expect(screen.getByText("Subject 21")).toBeInTheDocument();
  });
});

function renderPanel({
  conflicts,
  classrooms = [],
  publicationReasons = [],
  publicationReferenceNames = {},
  validationSummary = emptyValidationSummary(),
  onOpenDestination = vi.fn(),
  onFocusSchedule = vi.fn(),
  selectedConflict = null,
  onConflictSelect = vi.fn(),
  locale = "en",
}: {
  conflicts: TimetableConflictDisplay[];
  classrooms?: Array<{ id: string; nameAr: string; nameEn: string }>;
  publicationReasons?: TimetablePublishReason[];
  publicationReferenceNames?: PublicationReasonReferenceNames;
  validationSummary?: TimetableValidationSummary;
  onOpenDestination?: (path: string) => void;
  onFocusSchedule?: () => void;
  selectedConflict?: TimetableConflictDisplay | null;
  onConflictSelect?: (conflict: TimetableConflictDisplay) => void;
  locale?: string;
}) {
  render(
    <ValidationPanel
      open
      validationSummary={validationSummary}
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
      publicationReasons={publicationReasons}
      publicationReferenceNames={publicationReferenceNames}
      selectedConflict={selectedConflict}
      onConflictSelect={onConflictSelect}
      requirementActions={{
        openDestination: onOpenDestination,
        focusSchedule: onFocusSchedule,
      }}
      onClose={vi.fn()}
      locale={locale}
    />,
  );
}

function validationSummaryWithItems(
  items: TimetableValidationItem[],
): TimetableValidationSummary {
  return {
    ...emptyValidationSummary(),
    items,
  };
}

function validationItem(
  subjectId: string,
  subjectName: string,
  status: TimetableValidationItem["status"] = "under_scheduled",
): TimetableValidationItem {
  return {
    classroomId: "classroom-1",
    classroom: {
      id: "classroom-1",
      nameAr: "الفصل الأول",
      nameEn: "Classroom 1",
    },
    gradeId: "grade-1",
    grade: { id: "grade-1", nameAr: "الصف الأول", nameEn: "Grade 1" },
    subjectId,
    subject: {
      id: subjectId,
      nameAr: subjectName,
      nameEn: subjectName,
      code: null,
      color: null,
    },
    expectedWeeklyHours: 5,
    scheduledWeeklyHours: 3,
    status,
    issues: [],
  };
}
