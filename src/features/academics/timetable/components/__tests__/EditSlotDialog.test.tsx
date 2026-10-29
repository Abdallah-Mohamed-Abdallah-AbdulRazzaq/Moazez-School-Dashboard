import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import arabicMessages from "@/messages/ar.json";
import englishMessages from "@/messages/en.json";
import EditSlotDialog from "@/features/academics/timetable/components/EditSlotDialog";
import type { Subject } from "@/features/academics/subjects/services/subjectsService";
import type { Teacher } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import type { Room } from "../../types/timetable";
import { getRoomRecommendations } from "../../utils/roomRecommendations";

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
  it("shows three available suggestions with reasons and preserves an explicit room choice across subject changes", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const roomChoices: Room[] = ["A", "B", "C", "D", "Occupied"].map((id) => ({
      id, schoolId: "school-1", nameAr: `قاعة ${id}`, nameEn: `Room ${id}`, capacity: 30, isActive: true,
    }));
    render(<EditSlotDialog open dayKey="mon" periodIndex={1} dayName="Monday"
      subjects={[...subjects, { ...subjects[0], id: "science", nameEn: "Science" }]}
      teachers={teachers} teacherAllocations={[]} rooms={roomChoices}
      onSave={onSave} onClose={() => undefined} getDefaultTeacher={() => null}
      getRoomSuggestions={(subjectId) => getRoomRecommendations({
        subjectId, rooms: roomChoices, entries: [], isRoomUnavailable: (roomId) => roomId === "Occupied",
        selectedClassroom: { id: "classroom-1", nameEn: "Classroom 1", nameAr: "فصل 1", capacity: 25 },
      })}
      selectedSectionId="section-1" selectedClassroomId="classroom-1" selectedClassroomCapacity={25}
      hasRoomConflict={(roomId) => roomId === "Occupied"} locale="en" />);

    await user.click(screen.getByRole("button", { name: "subject" }));
    await user.click(screen.getByRole("button", { name: "Math", exact: true }));
    expect(screen.getByRole("button", { name: "room" })).toHaveTextContent("Room A");
    const suggestions = screen.getByRole("group", { name: "roomSuggestions" });
    expect(suggestions.querySelectorAll("button")).toHaveLength(3);
    expect(suggestions).toHaveTextContent("roomAvailable");
    expect(suggestions).toHaveTextContent("roomSeats");
    expect(suggestions).toHaveTextContent("roomSuitableCapacity");
    expect(suggestions).not.toHaveTextContent("Occupied");

    await user.click(screen.getByRole("button", { name: "room" }));
    expect(screen.getByRole("button", { name: "Room Occupied: roomOccupied" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Room D", exact: true }));
    await user.click(screen.getByRole("button", { name: "subject" }));
    await user.click(screen.getByRole("button", { name: "Science", exact: true }));
    expect(screen.getByRole("button", { name: "room" })).toHaveTextContent("Room D");

    const alternative = screen.getByRole("button", { name: /Room B roomAvailable/ });
    alternative.focus();
    await user.keyboard("{Enter}");
    expect(alternative).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "save" }));
    expect(onSave).toHaveBeenCalledWith("mon", 1, "science", null, "B");
  });

  it("keeps an existing room while explaining that no suitable alternative is available", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const occupiedRoom: Room = { id: "occupied", schoolId: "school-1", nameAr: "قاعة", nameEn: "Existing room", capacity: 30, isActive: true };
    render(<EditSlotDialog open dayKey="mon" periodIndex={1} dayName="Monday"
      entry={{ id: "existing", termId: "term-1", sectionId: "section-1", classroomId: "classroom-1",
        dayKey: "mon", periodIndex: 1, subjectId: "subject-1", teacherId: null, roomId: occupiedRoom.id }}
      subjects={[...subjects, { ...subjects[0], id: "science", nameEn: "Science" }]}
      teachers={teachers} teacherAllocations={[]} rooms={[occupiedRoom]} onSave={onSave} onClose={() => undefined}
      getDefaultTeacher={() => null} getRoomSuggestions={(subjectId) => getRoomRecommendations({
        subjectId, rooms: [occupiedRoom], entries: [], isRoomUnavailable: () => true,
      })}
      selectedSectionId="section-1" selectedClassroomId="classroom-1" hasRoomConflict={() => true} locale="en" />);
    expect(screen.getByRole("status")).toHaveTextContent("noSuitableRoom");
    expect(screen.getByText("roomConflictWarning")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "subject" }));
    await user.click(screen.getByRole("button", { name: "Science", exact: true }));
    expect(screen.getByRole("button", { name: "room" })).toHaveTextContent("Existing room");
    await user.click(screen.getByRole("button", { name: "save" }));
    expect(onSave).toHaveBeenCalledWith("mon", 1, "science", null, occupiedRoom.id);
  });

  it.each(["clear", "replace"])("keeps a deleted subject identifiable and allows %s without resaving it", async (action) => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<EditSlotDialog open dayKey="mon" periodIndex={1} dayName="Monday"
      entry={{ id: "deleted-entry", termId: "term-1", sectionId: "section-1", classroomId: "classroom-1", dayKey: "mon", periodIndex: 1, subjectId: "deleted-subject", subjectSnapshot: { id: "deleted-subject", nameAr: "اختبار", nameEn: "Deleted Test" }, teacherId: null, roomId: null }}
      subjects={subjects} teachers={teachers} teacherAllocations={[]} rooms={[]}
      onSave={onSave} onClose={vi.fn()} onTransfer={vi.fn()}
      getDefaultTeacher={() => null} getRoomSuggestions={() => []}
      selectedSectionId="section-1" selectedClassroomId="classroom-1" hasRoomConflict={() => false} locale="en" />);
    expect(screen.getByRole("alert")).toHaveTextContent("unavailableSubjectWarning");
    expect(screen.getByRole("button", { name: "subject" })).toHaveTextContent("Deleted Test");
    expect(screen.getByRole("button", { name: "save" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "copy" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "move" })).toBeDisabled();
    if (action === "clear") {
      await user.click(screen.getByRole("button", { name: "clear" }));
      expect(onSave).toHaveBeenCalledWith("mon", 1, null, null, null);
    } else {
      await user.click(screen.getByRole("button", { name: "subject" }));
      await user.click(screen.getByRole("button", { name: "Math", exact: true }));
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "save" }));
      expect(onSave).toHaveBeenCalledWith("mon", 1, "subject-1", null, null);
    }
  });

  it("offers lesson actions but requires form edits to be saved before transferring", async () => {
    const user = userEvent.setup();
    const onTransfer = vi.fn();
    render(<EditSlotDialog open dayKey="mon" periodIndex={1} dayName="Monday"
      entry={{ id: "entry-1", termId: "term-1", sectionId: "section-1", classroomId: "classroom-1", dayKey: "mon", periodIndex: 1, subjectId: "subject-1", teacherId: null, roomId: null }}
      subjects={subjects} teachers={teachers} teacherAllocations={[]} rooms={[]}
      onSave={vi.fn()} onClose={vi.fn()} onTransfer={onTransfer}
      getDefaultTeacher={() => null} getRoomSuggestions={() => []}
      selectedSectionId="section-1" selectedClassroomId="classroom-1" hasRoomConflict={() => false} locale="en" />);
    await user.click(screen.getByRole("button", { name: "copy" }));
    expect(onTransfer).toHaveBeenCalledWith("copy");
    await user.click(screen.getByRole("button", { name: "subject" }));
    await user.click(screen.getByRole("button", { name: "noSubject" }));
    expect(screen.getByRole("button", { name: "copy" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "move" })).toBeDisabled();
    expect(screen.getByText("saveEditsFirst")).toBeInTheDocument();
  });

  it("includes localized room eligibility messages after the missing Arabic message incident", () => {
    const englishEditSlot = englishMessages.academics.timetable.editSlot;
    const arabicEditSlot = arabicMessages.academics.timetable.editSlot;

    expect(englishEditSlot.roomInactive).toBeTruthy();
    expect(englishEditSlot.roomCapacityInsufficient).toContain("{roomCapacity}");
    expect(arabicEditSlot.roomInactive).toBeTruthy();
    expect(arabicEditSlot.roomCapacityInsufficient).toContain("{classroomCapacity}");
  });

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
        getRoomSuggestions={() => []}
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
        getRoomSuggestions={() => []}
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
