"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { Classroom } from "@/features/academics/academic-structure-tree/services/structureService";
import type { TimetableDropDecision } from "@/features/academics/timetable/components/TimetableSlotControl";
import {
  applyTimetableDrop,
  buildTimetableLibraryItems,
  mergeTimetableEntriesForValidation,
  type BuildTimetableLibraryItemsInput,
  type TimetableDropEffect,
  type TimetableDropTarget,
  type TimetableLibraryItem,
} from "@/features/academics/timetable/services/timetableDragDrop";
import type { TimetableEntry } from "@/features/academics/timetable/types/timetable";

interface UseTimetableSchedulingInput {
  termId: string;
  locale: string;
  gradeId: string;
  stageId: string;
  sectionId: string;
  classroomId: string;
  selectedClassroom?: Classroom;
  classrooms: Classroom[];
  subjects: BuildTimetableLibraryItemsInput["subjects"];
  subjectAllocations: BuildTimetableLibraryItemsInput["subjectAllocations"];
  teachers: BuildTimetableLibraryItemsInput["teachers"];
  teacherAllocations: BuildTimetableLibraryItemsInput["teacherAllocations"];
  rooms: BuildTimetableLibraryItemsInput["rooms"];
  timetableEntries: TimetableEntry[];
  allTermEntries: TimetableEntry[];
  periods: Array<{ index: number; isInstructional?: boolean }>;
  canEdit: boolean;
  isDirty: boolean;
  isHolidayDay: (dayKey: string) => boolean;
  setTimetableEntries: (entries: TimetableEntry[]) => void;
  onDirtyChange: (dirty: boolean) => void;
  showToast: (message: string, type: "success" | "error") => void;
  translate: (key: string) => string;
}

interface SchedulingLibrarySelection {
  scopeKey: string;
  item: TimetableLibraryItem;
}

interface TimetableUndoPlacement {
  scopeKey: string;
  entries: TimetableEntry[];
  wasDirty: boolean;
  effect: TimetableDropEffect;
}

export function useTimetableScheduling(input: UseTimetableSchedulingInput) {
  const {
    allTermEntries,
    canEdit,
    classroomId,
    classrooms,
    gradeId,
    isDirty,
    isHolidayDay,
    locale,
    onDirtyChange,
    periods,
    rooms,
    sectionId,
    selectedClassroom,
    setTimetableEntries,
    showToast,
    stageId,
    subjectAllocations,
    subjects,
    teacherAllocations,
    teachers,
    termId,
    timetableEntries,
    translate,
  } = input;
  const [desktopLibraryOpen, setDesktopLibraryOpen] = useState(true);
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false);
  const [librarySelection, setLibrarySelection] =
    useState<SchedulingLibrarySelection | null>(null);
  const [activeDragItem, setActiveDragItem] =
    useState<TimetableLibraryItem | null>(null);
  const [undoPlacement, setUndoPlacement] =
    useState<TimetableUndoPlacement | null>(null);
  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );
  const libraryScopeKey = selectedClassroom
    ? `${gradeId}:${selectedClassroom.sectionId}:${selectedClassroom.id}`
    : null;
  const interactionScopeKey = [stageId, gradeId, sectionId, classroomId].join(
    ":",
  );
  const selectedLibraryItem =
    librarySelection?.scopeKey === libraryScopeKey
      ? librarySelection.item
      : null;
  const activeUndoPlacement =
    undoPlacement?.scopeKey === interactionScopeKey ? undoPlacement : null;
  const libraryItems = useMemo(
    () =>
      selectedClassroom && gradeId
        ? buildTimetableLibraryItems({
            subjects,
            subjectAllocations,
            teachers,
            teacherAllocations,
            rooms,
            gradeId,
            sectionId: selectedClassroom.sectionId,
            classroom: selectedClassroom,
            entries: timetableEntries,
            locale,
          })
        : [],
    [
      gradeId,
      locale,
      rooms,
      selectedClassroom,
      subjectAllocations,
      subjects,
      teacherAllocations,
      teachers,
      timetableEntries,
    ],
  );
  const entriesForValidation = useMemo(
    () => mergeTimetableEntriesForValidation(allTermEntries, timetableEntries),
    [allTermEntries, timetableEntries],
  );

  const evaluateDrop = useCallback(
    (
      item: TimetableLibraryItem,
      target: TimetableDropTarget,
      createEntryId: () => string = previewEntryId,
    ) => {
      const targetClassroom = classrooms.find(
        (classroom) => classroom.id === target.classroomId,
      );
      if (!targetClassroom) return null;

      return applyTimetableDrop({
        item,
        target,
        termId,
        editableEntries: timetableEntries,
        allEntries: entriesForValidation,
        readOnly: !canEdit,
        holiday: isHolidayDay(target.dayKey),
        instructional:
          periods.find((period) => period.index === target.periodIndex)
            ?.isInstructional !== false,
        rooms,
        classroom: targetClassroom,
        createEntryId,
      });
    },
    [
      canEdit,
      classrooms,
      entriesForValidation,
      isHolidayDay,
      periods,
      rooms,
      termId,
      timetableEntries,
    ],
  );

  const canDropOnSlot = useCallback(
    (
      item: TimetableLibraryItem,
      target: TimetableDropTarget,
    ): TimetableDropDecision => {
      const result = evaluateDrop(item, target);
      if (!result) return { allowed: false, tone: "INVALID" };
      if (result.status === "REJECTED") {
        return { allowed: false, tone: "INVALID", reason: result.reason };
      }
      return {
        allowed: true,
        tone: dropNeedsAttention(result.entries, target)
          ? "WARNING"
          : "VALID",
      };
    },
    [evaluateDrop],
  );

  const placeItem = useCallback(
    (item: TimetableLibraryItem, target: TimetableDropTarget) => {
      const result = evaluateDrop(item, target, createTemporaryEntryId);
      if (!result) return;
      if (result.status === "REJECTED") {
        showToast(
          translate(`schedulingLibrary.rejections.${result.reason}`),
          "error",
        );
        return;
      }

      setTimetableEntries(result.entries);
      setUndoPlacement({
        scopeKey: interactionScopeKey,
        entries: result.undoEntries,
        wasDirty: isDirty,
        effect: result.effect,
      });
      setLibrarySelection(null);
      onDirtyChange(true);
      showToast(
        translate(`schedulingLibrary.effects.${result.effect.toLowerCase()}`),
        "success",
      );
    },
    [
      evaluateDrop,
      interactionScopeKey,
      isDirty,
      onDirtyChange,
      setTimetableEntries,
      showToast,
      translate,
    ],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const item = event.active.data.current?.item as
      | TimetableLibraryItem
      | undefined;
    setActiveDragItem(item ?? null);
  }, []);
  const handleDragCancel = useCallback(() => setActiveDragItem(null), []);
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const item = event.active.data.current?.item as
        | TimetableLibraryItem
        | undefined;
      const target = event.over?.data.current?.target as
        | TimetableDropTarget
        | undefined;
      setActiveDragItem(null);
      if (item && target) placeItem(item, target);
    },
    [placeItem],
  );
  const undo = useCallback(() => {
    if (!activeUndoPlacement) return;
    setTimetableEntries(activeUndoPlacement.entries);
    onDirtyChange(activeUndoPlacement.wasDirty);
    setUndoPlacement(null);
    showToast(translate("schedulingLibrary.undoComplete"), "success");
  }, [
    activeUndoPlacement,
    onDirtyChange,
    setTimetableEntries,
    showToast,
    translate,
  ]);
  const resetInteraction = useCallback(() => {
    setLibrarySelection(null);
    setActiveDragItem(null);
    setUndoPlacement(null);
    setMobileLibraryOpen(false);
  }, []);
  const dismissUndo = useCallback(() => setUndoPlacement(null), []);
  const selectLibraryItem = useCallback(
    (item: TimetableLibraryItem | null) =>
      setLibrarySelection(
        item && libraryScopeKey ? { scopeKey: libraryScopeKey, item } : null,
      ),
    [libraryScopeKey],
  );

  useEffect(() => {
    const cancelSelection = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setLibrarySelection(null);
      setActiveDragItem(null);
    };
    window.addEventListener("keydown", cancelSelection);
    return () => window.removeEventListener("keydown", cancelSelection);
  }, []);

  return {
    activeDragItem,
    canDropOnSlot,
    desktopLibraryOpen,
    dismissUndo,
    dragSensors,
    handleDragCancel,
    handleDragEnd,
    handleDragStart,
    libraryItems,
    mobileLibraryOpen,
    placeItem,
    resetInteraction,
    selectLibraryItem,
    selectedLibraryItem,
    setDesktopLibraryOpen,
    setMobileLibraryOpen,
    undo,
    undoEffect: activeUndoPlacement?.effect ?? null,
  };
}

let temporaryEntrySequence = 0;

function previewEntryId(): string {
  return "preview-entry";
}

function createTemporaryEntryId(): string {
  temporaryEntrySequence += 1;
  return `temp-${Date.now()}-${temporaryEntrySequence}`;
}

function dropNeedsAttention(
  entries: TimetableEntry[],
  target: TimetableDropTarget,
): boolean {
  const entry = entries.find(
    (candidate) =>
      candidate.classroomId === target.classroomId &&
      candidate.dayKey === target.dayKey &&
      candidate.periodIndex === target.periodIndex,
  );
  return Boolean(entry?.subjectId && (!entry.teacherId || !entry.roomId));
}
