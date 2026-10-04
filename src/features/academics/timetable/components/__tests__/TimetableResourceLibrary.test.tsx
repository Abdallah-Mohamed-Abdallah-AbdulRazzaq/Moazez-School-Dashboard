import { DndContext } from "@dnd-kit/core";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TimetableResourceLibrary from "@/features/academics/timetable/components/TimetableResourceLibrary";
import type { TimetableLibraryItem } from "@/features/academics/timetable/services/timetableDragDrop";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () =>
    (key: string, values?: Record<string, string | number>) => {
      if (key === "remainingPeriods") {
        return `${values?.remaining}/${values?.target} remaining`;
      }
      if (key === "scheduledPeriods") {
        return `${values?.scheduled} scheduled`;
      }
      return key;
    },
}));

const libraryItems: TimetableLibraryItem[] = [
  {
    kind: "LESSON",
    id: "lesson:math",
    subjectId: "math",
    teacherId: "teacher-math",
    roomId: "room-1",
    targetPeriods: 5,
    scheduledPeriods: 2,
    remainingPeriods: 3,
  },
  {
    kind: "LESSON",
    id: "lesson:science",
    subjectId: "science",
    teacherId: null,
    roomId: null,
    targetPeriods: 2,
    scheduledPeriods: 2,
    remainingPeriods: 0,
  },
  {
    kind: "TEACHER",
    id: "teacher:math",
    teacherId: "teacher-math",
    subjectId: "math",
  },
  { kind: "ROOM", id: "room:room-1", roomId: "room-1" },
];

const subjects = [
  {
    id: "math",
    name: "Math",
    nameAr: "رياضيات",
    nameEn: "Math",
    code: "MATH",
    color: null,
    isActive: true,
  },
  {
    id: "science",
    name: "Science",
    nameAr: "علوم",
    nameEn: "Science",
    code: "SCI",
    color: null,
    isActive: true,
  },
];

const teachers = [
  {
    id: "teacher-math",
    nameAr: "معلم الرياضيات",
    nameEn: "Math Teacher",
    isActive: true,
  },
];

const rooms = [
  {
    id: "room-1",
    schoolId: "school-1",
    nameAr: "غرفة 1",
    nameEn: "Room 1",
    capacity: 30,
    isActive: true,
  },
];

describe("TimetableResourceLibrary", () => {
  it("shows localized lesson bundles with their remaining requirement", () => {
    renderLibrary();

    expect(screen.getByRole("button", { name: /Math/ })).toHaveTextContent(
      "3/5 remaining",
    );
    expect(screen.getByRole("button", { name: /Math/ })).toHaveTextContent(
      "Math Teacher",
    );
    expect(screen.getByRole("button", { name: /Math/ })).toHaveTextContent(
      "Room 1",
    );
    expect(
      screen.getByRole("button", { name: "tabs.lessons" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("filters lessons by localized resource names", async () => {
    const user = userEvent.setup();
    renderLibrary();

    await user.type(screen.getByRole("searchbox", { name: "searchLabel" }), "Science");

    expect(screen.getByRole("button", { name: /Science/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Math Teacher/ })).not.toBeInTheDocument();
  });

  it("hides completed lessons when Unscheduled only is active", async () => {
    const user = userEvent.setup();
    renderLibrary();

    await user.click(screen.getByRole("button", { name: "unscheduledOnly" }));

    expect(screen.queryByRole("button", { name: /Science/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Math/ })).toBeInTheDocument();
  });

  it("switches resource tabs and selects an item for placement", async () => {
    const user = userEvent.setup();
    const onItemSelect = vi.fn();
    renderLibrary({ onItemSelect });

    await user.click(screen.getByRole("button", { name: "tabs.teachers" }));
    fireEvent.click(screen.getByRole("button", { name: /Math Teacher/ }));

    expect(onItemSelect).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "TEACHER", teacherId: "teacher-math" }),
    );
  });

  it("marks the selected card and disables resources in read-only mode", () => {
    const { rerender } = renderLibrary({ selectedItemId: "lesson:math" });

    expect(screen.getByRole("button", { name: /Math/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /Math/ })).toHaveClass("min-h-11");

    rerender(library({ disabled: true, selectedItemId: null }));

    expect(screen.getByRole("button", { name: /Math/ })).toBeDisabled();
  });
});

function renderLibrary(
  overrides: Partial<React.ComponentProps<typeof TimetableResourceLibrary>> = {},
) {
  return render(library(overrides));
}

function library(
  overrides: Partial<React.ComponentProps<typeof TimetableResourceLibrary>> = {},
) {
  return (
    <DndContext>
      <TimetableResourceLibrary
        items={libraryItems}
        subjects={subjects}
        teachers={teachers}
        rooms={rooms}
        locale="en"
        selectedItemId={null}
        isOpen
        mobile={false}
        disabled={false}
        onOpenChange={vi.fn()}
        onItemSelect={vi.fn()}
        {...overrides}
      />
    </DndContext>
  );
}
