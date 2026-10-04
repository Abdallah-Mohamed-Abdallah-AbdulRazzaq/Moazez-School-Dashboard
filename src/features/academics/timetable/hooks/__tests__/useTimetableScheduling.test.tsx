import { act, fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTimetableScheduling } from "@/features/academics/timetable/hooks/useTimetableScheduling";

const classroom = {
  id: "classroom-1",
  sectionId: "section-1",
  name: "Classroom 1",
  nameAr: "فصل 1",
  nameEn: "Classroom 1",
  capacity: 25,
  order: 1,
};

describe("useTimetableScheduling", () => {
  it("places a selected lesson and restores the prior entries with undo", () => {
    const setTimetableEntries = vi.fn();
    const onDirtyChange = vi.fn();
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useTimetableScheduling({
        termId: "term-1",
        locale: "en",
        gradeId: "grade-1",
        stageId: "stage-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
        selectedClassroom: classroom,
        classrooms: [classroom],
        subjects: [
          {
            id: "math",
            name: "Math",
            nameAr: "رياضيات",
            nameEn: "Math",
            code: "MATH",
            color: null,
            isActive: true,
          },
        ],
        subjectAllocations: [
          { gradeId: "grade-1", subjectId: "math", weeklyHours: 5 },
        ],
        teachers: [],
        teacherAllocations: [],
        rooms: [],
        timetableEntries: [],
        allTermEntries: [],
        periods: [{ index: 1, isInstructional: true }],
        canEdit: true,
        isDirty: false,
        isHolidayDay: () => false,
        setTimetableEntries,
        onDirtyChange,
        showToast,
        translate: (key) => key,
      }),
    );
    const lesson = result.current.libraryItems[0];

    act(() => result.current.selectLibraryItem(lesson));
    expect(result.current.selectedLibraryItem).toEqual(lesson);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(result.current.selectedLibraryItem).toBeNull();

    act(() => {
      result.current.selectLibraryItem(lesson);
      result.current.placeItem(lesson, {
        classroomId: "classroom-1",
        sectionId: "section-1",
        dayKey: "sun",
        periodIndex: 1,
      });
    });

    expect(setTimetableEntries).toHaveBeenLastCalledWith([
      expect.objectContaining({
        classroomId: "classroom-1",
        subjectId: "math",
        dayKey: "sun",
        periodIndex: 1,
      }),
    ]);
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    expect(result.current.undoEffect).toBe("CREATE");

    act(() => result.current.undo());

    expect(setTimetableEntries).toHaveBeenLastCalledWith([]);
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    expect(result.current.undoEffect).toBeNull();
    expect(showToast).toHaveBeenCalledWith(
      "schedulingLibrary.undoComplete",
      "success",
    );
  });
});
