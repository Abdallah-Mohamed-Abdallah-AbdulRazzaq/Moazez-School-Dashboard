"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DndContext } from "@dnd-kit/core";
import { Button } from "@/components/ui";
import type { BackendTimetableEntryDto } from "../services/timetableApiTypes";
import type { TimetableConflictDisplay } from "../services/timetableConflictNormalization";
import {
  loadConflictClassroomTimetable,
  type ConflictClassroomSnapshot,
} from "../services/timetableConflictInspection";
import { dayIndexToKey } from "../services/timetableMappers";
import TimetableGrid from "./TimetableGrid";
import ConflictTimetableDetails from "./ConflictTimetableDetails";

export default function ConflictClassroomPreview({
  lesson,
  conflict,
  termId,
  academicYearId,
}: {
  lesson: BackendTimetableEntryDto;
  conflict: TimetableConflictDisplay;
  termId: string;
  academicYearId: string;
}) {
  const locale = useLocale();
  const t = useTranslations("academics.timetable.conflictInspection");
  const [snapshot, setSnapshot] = useState<ConflictClassroomSnapshot | null>(
    null,
  );
  const [failed, setFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  useEffect(() => {
    let active = true;
    loadConflictClassroomTimetable(lesson, termId)
      .then((loaded) => {
        if (active) setSnapshot(loaded);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [lesson, retryCount, termId]);

  if (failed)
    return (
      <div role="alert" className="space-y-3 p-4">
        <p className="text-sm text-red-800">{t("timetableUnavailable")}</p>
        <Button
          variant="secondary"
          className="min-h-11"
          onClick={() => {
            setFailed(false);
            setRetryCount((count) => count + 1);
          }}
        >
          {t("retry")}
        </Button>
      </div>
    );
  if (!snapshot)
    return (
      <p role="status" className="p-6 text-sm text-gray-600">
        {t("loadingTimetable")}
      </p>
    );
  const classroomName =
    locale === "ar"
      ? snapshot.classroom.nameAr || snapshot.classroom.nameEn
      : snapshot.classroom.nameEn || snapshot.classroom.nameAr;
  const focusedConflict = {
    ...conflict,
    entryIds: [lesson.id],
    proposedIndexes: [],
    dayKey: dayIndexToKey(snapshot.selectedEntry.dayOfWeek),
    periodId: snapshot.selectedEntry.periodId,
    periodIndex: snapshot.selectedEntry.period.index,
  };
  return (
    <section
      className="space-y-4 pb-4 text-start"
      aria-label={t("classroomTimetable", { classroom: classroomName })}
    >
      <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
        <h3 className="font-semibold text-gray-900">{classroomName}</h3>
        <ConflictTimetableDetails
          lesson={lesson}
          configuration={snapshot.configuration}
          termId={termId}
          academicYearId={academicYearId}
        />
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          {t("readOnlyHint")}
        </p>
      </div>
      <DndContext>
        <TimetableGrid
          entries={snapshot.entries}
          subjects={snapshot.subjects}
          teachers={snapshot.teachers}
          rooms={snapshot.rooms}
          conflicts={[focusedConflict]}
          focusedConflict={focusedConflict}
          onSlotClick={() => {}}
          isHolidayDay={() => false}
          locale={locale}
          isReadOnly
          classroomId={lesson.classroom.id}
          resolvedConfig={snapshot.resolvedConfig}
        />
      </DndContext>
    </section>
  );
}
