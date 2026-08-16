import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import EditSlotDialog from "@/features/academics/timetable/components/EditSlotDialog";
import type { Subject } from "@/features/academics/subjects/services/subjectsService";
import type { Teacher } from "@/features/academics/teacher-allocation/services/teacherAllocationService";

const subjects: Subject[] = [
  {
    id: "subject-1",
    termId: "term-1",
    name: "Math",
    nameAr: "رياضيات",
    nameEn: "Math",
    isActive: true,
  },
];

const teachers: Teacher[] = [
  {
    id: "teacher-1",
    nameAr: "معلم الرياضيات",
    nameEn: "Math Teacher",
    isActive: true,
  },
];

describe("EditSlotDialog", () => {
  it("explains why teacher selection is unavailable without a classroom teacher allocation", async () => {
    render(
      <EditSlotDialog
        open
        dayKey="mon"
        periodIndex={1}
        dayName="Monday"
        entry={{
          id: "entry-1",
          termId: "term-1",
          sectionId: "section-1",
          classroomId: "classroom-1",
          dayKey: "mon",
          periodIndex: 1,
          subjectId: "subject-1",
          teacherId: null,
          roomId: null,
        }}
        subjects={subjects}
        teachers={teachers}
        teacherAllocations={[]}
        rooms={[]}
        onSave={vi.fn()}
        onClose={vi.fn()}
        getDefaultTeacher={() => null}
        getDefaultRoomSuggestion={() => ({ roomId: null, source: null })}
        getRoomSource={() => null}
        selectedSectionId="section-1"
        selectedClassroomId="classroom-1"
        hasRoomConflict={() => false}
        locale="en"
      />,
    );

    expect(
      await screen.findByText("noTeacherAllocationForClassroom"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "teacher" }),
    ).toBeDisabled();
  });

  it("saves only class-entry fields because breaks are configured as periods", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <EditSlotDialog
        open
        dayKey="mon"
        periodIndex={1}
        dayName="Monday"
        subjects={subjects}
        teachers={teachers}
        teacherAllocations={[]}
        rooms={[]}
        onSave={onSave}
        onClose={vi.fn()}
        getDefaultTeacher={() => null}
        getDefaultRoomSuggestion={() => ({ roomId: null, source: null })}
        getRoomSource={() => null}
        selectedSectionId="section-1"
        selectedClassroomId="classroom-1"
        hasRoomConflict={() => false}
        locale="en"
      />,
    );

    expect(screen.queryByText("slotType")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "save" }));

    expect(onSave).toHaveBeenCalledWith("mon", 1, null, null, null);
  });
});
