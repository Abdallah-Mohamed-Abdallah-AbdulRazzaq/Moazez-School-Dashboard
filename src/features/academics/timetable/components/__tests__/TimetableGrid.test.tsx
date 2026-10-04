import { DndContext } from "@dnd-kit/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TimetableGrid from "@/features/academics/timetable/components/TimetableGrid";
import type { TimetableConflictDisplay } from "@/features/academics/timetable/services/timetableConflictNormalization";
import type { TimetableEntry } from "@/features/academics/timetable/types/timetable";
import type { TimetableLibraryItem } from "@/features/academics/timetable/services/timetableDragDrop";

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

    await waitFor(() => expect(screen.getAllByText("Math")).toHaveLength(2));
  });

  it("dismisses conflict focus when the user selects another mobile day", () => {
    const onFocusedConflictDismiss = vi.fn();
    const conflict = { ...baseConflict, entryIds: ["entry-1"] };
    renderGrid(conflict, onFocusedConflictDismiss);

    fireEvent.click(
      screen.getByRole("button", { name: /^Tuesday 0\/1$/ }),
    );

    expect(onFocusedConflictDismiss).toHaveBeenCalledOnce();
  });
});

describe("TimetableGrid direct placement", () => {
  it("opens the existing editor when no library item is selected", () => {
    const onSlotClick = vi.fn();
    renderGrid(null, undefined, { onSlotClick });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Monday.*Period 1.*Math/ })[0],
    );

    expect(onSlotClick).toHaveBeenCalledWith("mon", 1);
  });

  it("places the selected library item instead of opening the editor", () => {
    const onSlotClick = vi.fn();
    const onPlaceItem = vi.fn();
    const selectedLibraryItem = lessonItem();
    renderGrid(null, undefined, {
      onSlotClick,
      onPlaceItem,
      selectedLibraryItem,
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Tuesday.*Period 1/ })[0],
    );

    expect(onPlaceItem).toHaveBeenCalledWith(
      selectedLibraryItem,
      expect.objectContaining({
        classroomId: "classroom-1",
        dayKey: "tue",
        periodIndex: 1,
      }),
    );
    expect(onSlotClick).not.toHaveBeenCalled();
  });

  it("exposes text-independent invalid drop state", () => {
    renderGrid(null, undefined, {
      selectedLibraryItem: lessonItem(),
      canDropOnSlot: () => ({
        allowed: false,
        tone: "INVALID",
        reason: "TEACHER_CONFLICT",
      }),
    });

    expect(
      screen.getAllByRole("button", { name: /Tuesday.*Period 1/ })[0],
    ).toHaveAttribute("data-drop-state", "INVALID");
  });

  it("makes filled editable lessons draggable", () => {
    renderGrid(null);

    expect(
      screen.getAllByRole("button", { name: /Monday.*Period 1.*Math/ })[0],
    ).toHaveAttribute("aria-roledescription", "draggable");
  });

  it("does not expose dragging in read-only mode", () => {
    renderGrid(null, undefined, { isReadOnly: true });

    expect(
      screen.getAllByRole("button", { name: /Monday.*Period 1.*Math/ })[0],
    ).not.toHaveAttribute("aria-roledescription");
  });
});

function renderGrid(
  focusedConflict: TimetableConflictDisplay | null,
  onFocusedConflictDismiss?: () => void,
  overrides: Partial<React.ComponentProps<typeof TimetableGrid>> = {},
) {
  render(
    <DndContext>
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
        conflicts={focusedConflict ? [focusedConflict] : []}
        focusedConflict={focusedConflict}
        onFocusedConflictDismiss={onFocusedConflictDismiss}
        onSlotClick={vi.fn()}
        isHolidayDay={() => false}
        locale="en"
        isReadOnly={false}
        classroomId="classroom-1"
        sectionId="section-1"
        resolvedConfig={{
          days: [
            {
              key: "mon",
              index: 1,
              nameAr: "الإثنين",
              nameEn: "Monday",
              isActive: true,
            },
            {
              key: "tue",
              index: 2,
              nameAr: "الثلاثاء",
              nameEn: "Tuesday",
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
        {...overrides}
      />
    </DndContext>,
  );
}

function lessonItem(): TimetableLibraryItem {
  return {
    kind: "LESSON",
    id: "lesson:subject-1",
    subjectId: "subject-1",
    teacherId: "teacher-1",
    roomId: "room-1",
    targetPeriods: 5,
    scheduledPeriods: 1,
    remainingPeriods: 4,
  };
}
