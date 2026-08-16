"use client";

import { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Select from "@/components/ui/input/Select";
import { Button } from "@/components/ui";
import Modal from "@/components/ui/modal/Modal";
import { TimetableEntry } from "@/features/academics/timetable/types/timetable";
import { Subject } from "@/features/academics/subjects/services/subjectsService";
import {
  type Teacher,
  type TeacherAllocation,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { Room } from "@/features/academics/timetable/types/timetable";
import { RoomAssignmentSource } from "@/features/academics/rooms/services/roomsService";
import { teacherAllocationOptions } from "@/features/academics/timetable/services/timetableSlotEditing";

type ResolvedRoomSuggestion = {
  roomId: string | null;
  source: Exclude<RoomAssignmentSource, "MANUAL"> | null;
};

interface EditSlotDialogProps {
  open: boolean;
  dayKey: string;
  periodIndex: number;
  dayName: string;
  entry?: TimetableEntry;
  subjects: Subject[];
  teachers: Teacher[];
  teacherAllocations: TeacherAllocation[];
  rooms: Room[];
  onSave: (
    dayKey: string,
    periodIndex: number,
    subjectId: string | null,
    teacherId: string | null,
    roomId: string | null,
  ) => void;
  onClose: () => void;
  getDefaultTeacher: (subjectId: string) => string | null;
  getDefaultRoomSuggestion: (subjectId: string) => ResolvedRoomSuggestion;
  getRoomSource: (
    roomId: string | null,
    subjectId?: string
  ) => RoomAssignmentSource | null;
  selectedClassroomName?: string;
  selectedSectionId: string;
  selectedClassroomId?: string;
  hasRoomConflict: (roomId: string) => boolean;
  locale: string;
}

export default function EditSlotDialog({
  open,
  dayKey,
  periodIndex,
  dayName,
  entry,
  subjects,
  teachers,
  teacherAllocations,
  rooms,
  onSave,
  onClose,
  getDefaultTeacher,
  getDefaultRoomSuggestion,
  getRoomSource,
  selectedClassroomName,
  selectedSectionId,
  selectedClassroomId,
  hasRoomConflict,
  locale,
}: EditSlotDialogProps) {
  const t = useTranslations("academics.timetable.editSlot");

  const [subjectId, setSubjectId] = useState<string>("");
  const [teacherId, setTeacherId] = useState<string>("");
  const [teacherAllocationId, setTeacherAllocationId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [autoFilledTeacher, setAutoFilledTeacher] = useState(false);
  const [autoFilledRoom, setAutoFilledRoom] = useState(false);
  const [roomSource, setRoomSource] = useState<RoomAssignmentSource | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) {
      return;
    }

    if (entry) {
      const matchingAllocation = teacherAllocationOptions({
        teacherAllocations,
        teachers,
        subjects,
        sectionId: selectedSectionId,
        classroomId: selectedClassroomId,
        subjectId: entry.subjectId || undefined,
        locale,
      }).find((allocation) => allocation.teacherId === entry.teacherId);

      setSubjectId(entry.subjectId || "");
      setTeacherId(entry.teacherId || "");
      setTeacherAllocationId(matchingAllocation?.allocationId ?? "");
      setRoomId(entry.roomId || "");
      setRoomSource(getRoomSource(entry.roomId || null, entry.subjectId || undefined));
    } else {
      setSubjectId("");
      setTeacherId("");
      setTeacherAllocationId("");
      setRoomId("");
      setRoomSource(null);
    }

    setAutoFilledTeacher(false);
    setAutoFilledRoom(false);
  }, [
    entry,
    getRoomSource,
    locale,
    open,
    selectedClassroomId,
    selectedSectionId,
    subjects,
    teacherAllocations,
    teachers,
  ]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const subjectOptions = [
    { value: "", label: t("noSubject") },
    ...subjects.map((subject) => ({
      value: subject.id,
      label: locale === "ar" ? subject.nameAr : subject.nameEn,
    })),
  ];

  const allocationOptions = useMemo(
    () =>
      teacherAllocationOptions({
        teacherAllocations,
        teachers,
        subjects,
        sectionId: selectedSectionId,
        classroomId: selectedClassroomId,
        subjectId: subjectId || undefined,
        locale,
      }),
    [
      locale,
      selectedClassroomId,
      selectedSectionId,
      subjectId,
      subjects,
      teacherAllocations,
      teachers,
    ],
  );

  const teacherOptions = [
    { value: "", label: t("noTeacher") },
    ...allocationOptions.map((allocation) => ({
      value: allocation.allocationId,
      label: allocation.label,
    })),
  ];
  const teacherSelectHelperText = !subjectId
    ? t("selectSubjectBeforeTeacher")
    : allocationOptions.length === 0
      ? t("noTeacherAllocationForClassroom")
      : undefined;

  const roomOptions = [
    { value: "", label: t("noRoom") },
    ...rooms.map((room) => ({
      value: room.id,
      label: locale === "ar" ? room.nameAr : room.nameEn,
    })),
  ];

  const getRoomSourceLabel = (source: RoomAssignmentSource | null) => {
    switch (source) {
      case "CLASSROOM_DEFAULT":
        return t("roomSourceClassroomDefault");
      case "SECTION_DEFAULT":
        return t("roomSourceSectionDefault");
      case "RECOMMENDED":
        return t("roomSourceRecommended");
      case "MANUAL":
        return t("roomSourceManual");
      default:
        return null;
    }
  };

  const handleSubjectChange = (value: string) => {
    setSubjectId(value);
    setTeacherAllocationId("");

    if (!value) {
      setTeacherId("");
      setRoomId("");
      setRoomSource(null);
      setAutoFilledTeacher(false);
      setAutoFilledRoom(false);
      return;
    }

    const validAllocation = teacherAllocationOptions({
      teacherAllocations,
      teachers,
      subjects,
      sectionId: selectedSectionId,
      classroomId: selectedClassroomId,
      subjectId: value,
      locale,
    })[0];
    const defaultTeacher = validAllocation?.teacherId ?? getDefaultTeacher(value);
    if (validAllocation) {
      setTeacherAllocationId(validAllocation.allocationId);
    }
    if (defaultTeacher) {
      setTeacherId(defaultTeacher);
      setAutoFilledTeacher(true);
    } else {
      setAutoFilledTeacher(false);
    }

    const roomSuggestion = getDefaultRoomSuggestion(value);
    if (roomSuggestion.roomId) {
      setRoomId(roomSuggestion.roomId);
      setRoomSource(roomSuggestion.source);
      setAutoFilledRoom(true);
    } else {
      setRoomId("");
      setRoomSource(null);
      setAutoFilledRoom(false);
    }
  };

  const handleTeacherAllocationChange = (value: string) => {
    setTeacherAllocationId(value);
    setAutoFilledTeacher(false);

    if (!value) {
      setTeacherId("");
      return;
    }

    const selectedAllocation = allocationOptions.find(
      (allocation) => allocation.allocationId === value,
    );
    if (!selectedAllocation) {
      return;
    }

    setTeacherId(selectedAllocation.teacherId);
    if (selectedAllocation.subjectId !== subjectId) {
      setSubjectId(selectedAllocation.subjectId);
      const roomSuggestion = getDefaultRoomSuggestion(selectedAllocation.subjectId);
      if (roomSuggestion.roomId && !roomId) {
        setRoomId(roomSuggestion.roomId);
        setRoomSource(roomSuggestion.source);
        setAutoFilledRoom(true);
      }
    }
  };

  const roomConflictWarning = roomId ? hasRoomConflict(roomId) : false;
  const missingRoomWarning = subjectId && !roomId;

  const handleSave = () => {
    onSave(
      dayKey,
      periodIndex,
      subjectId || null,
      teacherId || null,
      roomId || null,
    );
  };

  const handleClear = () => {
    onSave(dayKey, periodIndex, null, null, null);
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={t("title")}
      description={`${dayName} - ${t("period", { number: periodIndex })}`}
      size="md"
      footer={
        <>
          <Button onClick={handleClear} variant="secondary">
            {t("clear")}
          </Button>
          <div className="flex-1" />
          <Button onClick={onClose} variant="secondary">
            {t("cancel")}
          </Button>
          <Button onClick={handleSave} variant="primary">
            {t("save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {selectedClassroomName && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {t("targetClassroom", { classroom: selectedClassroomName })}
          </div>
        )}

        <>
            <div>
              <Select
                label={t("subject")}
                value={subjectId}
                onChange={handleSubjectChange}
                options={subjectOptions}
                placeholder={t("selectSubject")}
              />
            </div>

            <div>
              <Select
                label={t("teacher")}
                value={teacherAllocationId}
                onChange={handleTeacherAllocationChange}
                options={teacherOptions}
                placeholder={t("selectTeacher")}
                disabled={allocationOptions.length === 0}
                helperText={teacherSelectHelperText}
              />
              {autoFilledTeacher && (
                <p className="mt-1 text-xs text-blue-600">{t("autoFilled")}</p>
              )}
            </div>

            <div>
              <Select
                label={t("room")}
                value={roomId}
                onChange={(value) => {
                  setRoomId(value);
                  setRoomSource(value ? "MANUAL" : null);
                  setAutoFilledRoom(false);
                }}
                options={roomOptions}
                placeholder={t("selectRoom")}
                disabled={!subjectId}
              />
              {(autoFilledRoom || roomSource) && (
                <p className="mt-1 text-xs text-blue-600">
                  {autoFilledRoom ? t("autoFilledRoom") : t("roomSourceLabel")}
                  {roomSource ? ` ${getRoomSourceLabel(roomSource)}` : ""}
                </p>
              )}
              {missingRoomWarning && (
                <p className="mt-1 text-xs text-amber-700">
                  {t("roomOptionalWarning")}
                </p>
              )}
              {roomConflictWarning && (
                <p className="mt-1 text-xs text-amber-700">
                  {t("roomConflictWarning")}
                </p>
              )}
            </div>
        </>
      </div>
    </Modal>
  );
}
