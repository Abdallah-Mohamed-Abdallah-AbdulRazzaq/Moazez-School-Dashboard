import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ValidationPanel from "@/features/academics/timetable/components/ValidationPanel";
import { emptyValidationSummary } from "@/features/academics/timetable/services/timetableValidationSummary";
import type { TimetableConflictDisplay } from "@/features/academics/timetable/services/timetableConflictNormalization";
import type { TimetablePublishReason } from "@/features/academics/timetable/services/timetableApiTypes";
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
    await user.click(screen.getByRole("button", { name: /review next blocker/i }));

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
      await user.click(screen.getByRole("tab", { name: /publish blockers/i }));

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

  it("shows only publish blockers after selecting that navigation tab", async () => {
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
    await user.click(screen.getByRole("tab", { name: /publish blockers/i }));

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

    await user.click(screen.getByRole("tab", { name: /publish blockers/i }));

    expect(screen.getByText("Science Lab")).toBeInTheDocument();
    expect(screen.queryByText(roomId)).not.toBeInTheDocument();
  });
});

function renderPanel({
  conflicts,
  classrooms = [],
  publicationReasons = [],
  publicationReferenceNames = {},
  selectedConflict = null,
  onConflictSelect = vi.fn(),
  locale = "en",
}: {
  conflicts: TimetableConflictDisplay[];
  classrooms?: Array<{ id: string; nameAr: string; nameEn: string }>;
  publicationReasons?: TimetablePublishReason[];
  publicationReferenceNames?: PublicationReasonReferenceNames;
  selectedConflict?: TimetableConflictDisplay | null;
  onConflictSelect?: (conflict: TimetableConflictDisplay) => void;
  locale?: string;
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
      publicationReasons={publicationReasons}
      publicationReferenceNames={publicationReferenceNames}
      selectedConflict={selectedConflict}
      onConflictSelect={onConflictSelect}
      onClose={vi.fn()}
      locale={locale}
    />,
  );
}
