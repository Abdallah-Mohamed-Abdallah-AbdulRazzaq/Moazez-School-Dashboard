import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TimetableGrid from "@/features/academics/timetable/components/TimetableGrid";
import type { TimetableConflictDisplay } from "@/features/academics/timetable/services/timetableConflictNormalization";
import type { TimetableEntry } from "@/features/academics/timetable/types/timetable";

const entry: TimetableEntry = {
  id: "entry-1",
  termId: "term-1",
  sectionId: "section-1",
  classroomId: "classroom-1",
  dayKey: "mon",
  periodIndex: 1,
  subjectId: "subject-1",
  teacherId: "teacher-1",
  roomId: "room-1",
};

const baseConflict: TimetableConflictDisplay = {
  type: "TEACHER",
  code: "teacher_conflict",
  message: "Teacher intervals overlap.",
  severity: "blocking",
  dayOfWeek: null,
  entryIds: [],
  proposedIndexes: [],
  resourceId: "teacher-1",
};

describe("TimetableGrid conflict highlighting", () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("highlights and identifies the selected cell by backend entry ID", () => {
    const conflict = { ...baseConflict, entryIds: ["entry-1"] };
    renderGrid(conflict);

    expect(screen.getByRole("cell", { name: /Math/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("highlights and identifies the selected proposed entry by index", () => {
    const conflict = { ...baseConflict, proposedIndexes: [0] };
    renderGrid(conflict);

    expect(screen.getByRole("cell", { name: /Math/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("reveals the selected conflict day in the mobile view", async () => {
    const conflict = { ...baseConflict, entryIds: ["entry-1"] };
    renderGrid(conflict);

    await waitFor(() =>
      expect(screen.getAllByText("Math")).toHaveLength(2),
    );
  });
});

function renderGrid(focusedConflict: TimetableConflictDisplay) {
  render(
    <TimetableGrid
      entries={[entry]}
      proposalEntries={[entry]}
      subjects={[
        {
          id: "subject-1",
          name: "Math",
          nameAr: "رياضيات",
          nameEn: "Math",
          code: null,
          color: null,
          isActive: true,
        },
      ]}
      teachers={[
        {
          id: "teacher-1",
          nameAr: "المعلم 1",
          nameEn: "Teacher 1",
          isActive: true,
        },
      ]}
      rooms={[
        {
          id: "room-1",
          schoolId: "school-1",
          nameAr: "غرفة 1",
          nameEn: "Room 1",
          capacity: 30,
          isActive: true,
        },
      ]}
      conflicts={[focusedConflict]}
      focusedConflict={focusedConflict}
      onSlotClick={vi.fn()}
      isHolidayDay={() => false}
      locale="en"
      isReadOnly={false}
      resolvedConfig={{
        days: [
          {
            key: "mon",
            index: 1,
            nameAr: "الإثنين",
            nameEn: "Monday",
            isActive: true,
          },
        ],
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
        source: { scope: "CLASSROOM", id: "classroom-1" },
      }}
    />,
  );
}
