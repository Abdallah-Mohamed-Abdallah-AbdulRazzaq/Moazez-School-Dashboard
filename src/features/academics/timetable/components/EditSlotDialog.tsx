"use client";

import { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Copy, MoveRight } from "lucide-react";
import type { LessonTransferMode } from "../services/timetableLessonTransfer";
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
import { evaluateRoomEligibility } from "@/features/academics/rooms/services/roomSchedulingEligibility";
import { teacherAllocationOptions } from "@/features/academics/timetable/services/timetableSlotEditing";
import RoomSuggestions from "./RoomSuggestions";
import type { RoomRecommendation } from "../utils/roomRecommendations";
import { timetableSubjectName } from "../services/timetableSubjectDisplay";

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
  onTransfer?: (mode: LessonTransferMode) => void;
  getDefaultTeacher: (subjectId: string) => string | null;
  getRoomSuggestions: (subjectId: string) => RoomRecommendation[];
  selectedClassroomName?: string;
  selectedClassroomCapacity?: number | null;
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
  onTransfer,
  getDefaultTeacher,
  getRoomSuggestions,
  selectedClassroomName,
  selectedClassroomCapacity,
  selectedSectionId,
  selectedClassroomId,
  hasRoomConflict,
  locale,
}: EditSlotDialogProps) {
  const t = useTranslations("academics.timetable.editSlot");
  const tTransfer = useTranslations("academics.timetable.transfer");
  const tGrid = useTranslations("academics.timetable.grid");

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
      setRoomSource(entry.roomId ? "MANUAL" : null);
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
    locale,
    open,
    selectedClassroomId,
    selectedSectionId,
    subjects,
    teacherAllocations,
    teachers,
  ]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const unavailableSubjectSelected = Boolean(
    subjectId && !subjects.some((subject) => subject.id === subjectId),
  );
  const originalSubjectUnavailable = Boolean(
    entry?.subjectId && !subjects.some((subject) => subject.id === entry.subjectId),
  );
  const subjectOptions = [
    { value: "", label: t("noSubject") },
    ...(originalSubjectUnavailable && entry?.subjectId
      ? [{
          value: entry.subjectId,
          label: `${timetableSubjectName(entry, undefined, locale) || tGrid("unavailableSubject")} — ${tGrid("unavailableSubject")}`,
          disabled: true,
        }]
      : []),
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

  const roomSuggestions = subjectId ? getRoomSuggestions(subjectId) : [];
  const suggestionRanks = new Map(roomSuggestions.map(({ room }, index) => [room.id, index]));
  const roomOptions = [
    { value: "", label: t("noRoom") },
    ...rooms
      .map((room) => {
        const eligibility = evaluateRoomEligibility(room, {
          capacity: selectedClassroomCapacity,
        });
        const occupied = hasRoomConflict(room.id);
        const reason = eligibility.eligible
          ? occupied ? t("roomOccupied") : undefined
          : eligibility.reason === "inactive"
            ? t("roomInactive")
            : t("roomCapacityInsufficient", {
                  roomCapacity: eligibility.roomCapacity ?? "",
                  classroomCapacity: eligibility.classroomCapacity ?? "",
              });
        const roomName = locale === "ar" ? room.nameAr : room.nameEn;

        return {
          value: room.id,
          label: reason ? `${roomName} — ${reason}` : roomName,
          disabled: !eligibility.eligible || occupied,
          ariaLabel: reason ? `${roomName}: ${reason}` : roomName,
        };
      })
      .sort((left, right) => Number(left.disabled) - Number(right.disabled) ||
        (suggestionRanks.get(left.value) ?? Infinity) - (suggestionRanks.get(right.value) ?? Infinity)),
  ];

  const getRoomSourceLabel = (source: RoomAssignmentSource | null) => {
    switch (source) {
      case "RECOMMENDED":
        return t("roomSourceRecommended");
      case "MANUAL":
        return t("roomSourceManual");
      default:
        return null;
    }
  };

  const selectManualRoom = (selectedRoomId: string) => {
    setRoomId(selectedRoomId);
    setRoomSource(selectedRoomId ? "MANUAL" : null);
    setAutoFilledRoom(false);
  };

  const selectSuggestedRoom = (selectedSubjectId: string) => {
    const [suggestion] = getRoomSuggestions(selectedSubjectId);
    setRoomId(suggestion?.room.id ?? "");
    setRoomSource(suggestion ? "RECOMMENDED" : null);
    setAutoFilledRoom(Boolean(suggestion));
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

    if (roomId && roomSource === "MANUAL") return;
    selectSuggestedRoom(value);
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
      if (!roomId || roomSource !== "MANUAL") {
        selectSuggestedRoom(selectedAllocation.subjectId);
      }
    }
  };

  const roomConflictWarning = roomId ? hasRoomConflict(roomId) : false;
  const missingRoomWarning = subjectId && !roomId;

  const handleSave = () => {
    if (unavailableSubjectSelected) return;
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

  const hasUnsavedLessonEdits = Boolean(
    entry &&
    (subjectId !== entry.subjectId ||
      (teacherId || null) !== entry.teacherId ||
      (roomId || null) !== entry.roomId),
  );
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
          <Button onClick={handleSave} variant="primary" disabled={unavailableSubjectSelected}>
            {t("save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {unavailableSubjectSelected && (
          <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {t("unavailableSubjectWarning")}
          </p>
        )}
        {entry?.subjectId && onTransfer && (
          <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex flex-wrap gap-2">
              {(["copy", "move"] as const).map((mode) => (
                <Button key={mode} variant="secondary" className="min-h-11" disabled={hasUnsavedLessonEdits || originalSubjectUnavailable} onClick={() => onTransfer(mode)} leftIcon={mode === "copy" ? <Copy className="h-4 w-4" /> : <MoveRight className="h-4 w-4 rtl:rotate-180" />}>
                  {tTransfer(mode)}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-600">{hasUnsavedLessonEdits ? tTransfer("saveEditsFirst") : tTransfer("chooseDestination")}</p>
          </div>
        )}

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
                onChange={selectManualRoom}
                options={roomOptions}
                placeholder={t("selectRoom")}
                disabled={!subjectId}
              />
              {subjectId && (
                <RoomSuggestions
                  suggestions={roomSuggestions}
                  selectedRoomId={roomId}
                  locale={locale}
                  onSelect={selectManualRoom}
                />
              )}
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
