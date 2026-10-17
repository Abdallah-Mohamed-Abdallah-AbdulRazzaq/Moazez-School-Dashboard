"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, BookOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import Modal from "@/components/ui/modal/Modal";
import type { TimetableConflictDisplay } from "../services/timetableConflictNormalization";
import type {
  BackendTimetableEntryDto,
  TimetableDashboardConfigSummaryDto,
} from "../services/timetableApiTypes";
import {
  loadConflictLessons,
  weekdayName,
} from "../services/timetableConflictInspection";
import { formatTimetableTimeRange } from "../services/timetableTimeFormat";
import ConflictClassroomPreview from "./ConflictClassroomPreview";
import ConflictTimetableDetails from "./ConflictTimetableDetails";

interface TimetableConflictDialogProps {
  conflict: TimetableConflictDisplay;
  termId: string;
  academicYearId: string;
  hasUnsavedLessons: boolean;
  onFocusCurrent: () => void;
  onClose: () => void;
}

export default function TimetableConflictDialog({
  conflict,
  termId,
  academicYearId,
  hasUnsavedLessons,
  onFocusCurrent,
  onClose,
}: TimetableConflictDialogProps) {
  const t = useTranslations("academics.timetable.conflictInspection");
  const locale = useLocale();
  const [lessons, setLessons] = useState<Awaited<
    ReturnType<typeof loadConflictLessons>
  > | null>(null);
  const [selectedLesson, setSelectedLesson] =
    useState<BackendTimetableEntryDto | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.focus();
  }, [selectedLesson, lessons, loadFailed]);

  useEffect(() => {
    let active = true;
    loadConflictLessons(conflict, termId)
      .then((loaded) => {
        if (active) setLessons(loaded);
      })
      .catch(() => {
        if (active) setLoadFailed(true);
      });
    return () => {
      active = false;
    };
  }, [conflict, retryCount, termId]);

  const retry = () => {
    setLoadFailed(false);
    setLessons(null);
    setRetryCount((count) => count + 1);
  };
  const previewClassroom = selectedLesson
    ? locale === "ar"
      ? selectedLesson.classroom.nameAr || selectedLesson.classroom.nameEn
      : selectedLesson.classroom.nameEn || selectedLesson.classroom.nameAr
    : "";

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={
        selectedLesson
          ? t("classroomTimetable", { classroom: previewClassroom })
          : t("title")
      }
      description={t(selectedLesson ? "previewDescription" : "description")}
      icon={<AlertTriangle className="h-6 w-6" aria-hidden="true" />}
      size={selectedLesson ? "full" : "lg"}
      closeOnOverlayClick={false}
      className="mx-0! motion-reduce:animate-none!"
      footer={
        <div className="flex w-full flex-wrap justify-end gap-3">
          {selectedLesson && (
            <Button
              variant="secondary"
              className="min-h-11 min-w-0 flex-1 focus-visible:ring-2 focus-visible:ring-primary sm:flex-none"
              onClick={() => setSelectedLesson(null)}
            >
              {t("back")}
            </Button>
          )}
          <Button
            variant="secondary"
            className="min-h-11 min-w-0 flex-1 focus-visible:ring-2 focus-visible:ring-primary sm:flex-none"
            onClick={onClose}
          >
            {t("close")}
          </Button>
        </div>
      }
    >
      <div ref={contentRef} tabIndex={-1} className="focus:outline-none">
        {selectedLesson ? (
          <ConflictClassroomPreview
            key={selectedLesson.id}
            lesson={selectedLesson}
            conflict={conflict}
            academicYearId={academicYearId}
            termId={termId}
          />
        ) : (
          <div className="space-y-4 pb-4 text-start">
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
              {conflict.message}
            </p>
            <p className="text-sm leading-relaxed text-gray-600">
              {t("savedHint")}
            </p>
            {lessons === null && !loadFailed && (
              <p role="status" className="py-6 text-sm text-gray-600">
                {t("loading")}
              </p>
            )}
            {(loadFailed || (lessons && lessons.unavailableCount > 0)) && (
              <div
                role="alert"
                className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
              >
                <p>{t("unavailable")}</p>
                <Button
                  variant="secondary"
                  className="min-h-11"
                  leftIcon={
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  }
                  onClick={retry}
                >
                  {t("retry")}
                </Button>
              </div>
            )}
            {lessons?.entries.map((lesson) => (
              <ConflictLessonCard
                key={lesson.id}
                lesson={lesson}
                configuration={lessons.configurations[lesson.id]}
                academicYearId={academicYearId}
                termId={termId}
                onOpen={() => setSelectedLesson(lesson)}
              />
            ))}
            {lessons &&
              lessons.entries.length === 0 &&
              lessons.unavailableCount === 0 && (
                <p className="rounded-xl border border-dashed border-gray-300 p-5 text-sm text-gray-600">
                  {t("noLinkedLessons")}
                </p>
              )}
            {hasUnsavedLessons && (
              <section className="space-y-3 rounded-xl border border-primary-200 bg-primary-50 p-4">
                <h3 className="font-semibold text-gray-900">
                  {t("unsavedTitle")}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {t("unsavedDescription")}
                </p>
                <Button
                  variant="secondary"
                  className="min-h-11"
                  onClick={onFocusCurrent}
                >
                  {t("showUnsaved")}
                </Button>
              </section>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function ConflictLessonCard({
  lesson,
  configuration,
  termId,
  academicYearId,
  onOpen,
}: {
  lesson: BackendTimetableEntryDto;
  configuration: TimetableDashboardConfigSummaryDto | null;
  termId: string;
  academicYearId: string;
  onOpen: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("academics.timetable.conflictInspection");
  const classroomName =
    locale === "ar"
      ? lesson.classroom.nameAr || lesson.classroom.nameEn
      : lesson.classroom.nameEn || lesson.classroom.nameAr;
  const subjectName = lesson.subject
    ? locale === "ar"
      ? lesson.subject.nameAr || lesson.subject.nameEn
      : lesson.subject.nameEn || lesson.subject.nameAr
    : t("unknownSubject");
  return (
    <article
      className="space-y-3 rounded-xl border border-gray-200 p-4"
      aria-label={classroomName}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-semibold text-gray-900">
            {classroomName}
          </h3>
          <p className="mt-1 break-words text-sm text-gray-700">
            {subjectName}
          </p>
          {lesson.teacher && (
            <p className="mt-1 text-sm text-gray-600">
              {lesson.teacher.fullName}
            </p>
          )}
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
          {t(`status.${lesson.status}`)}
        </span>
      </div>
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600">
        <span>{weekdayName(lesson.dayOfWeek, locale)}</span>
        <span>{lesson.period.label}</span>
        <bdi dir="ltr">
          {formatTimetableTimeRange(
            lesson.period.startTime,
            lesson.period.endTime,
          )}
        </bdi>
      </p>
      <ConflictTimetableDetails
        lesson={lesson}
        configuration={configuration}
        termId={termId}
        academicYearId={academicYearId}
      >
        <Button
          variant="secondary"
          className="min-h-11 w-full focus-visible:ring-2 focus-visible:ring-primary sm:w-auto"
          leftIcon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
          disabled={lesson.status === "cancelled"}
          onClick={onOpen}
          aria-label={t("openClassroom", { classroom: classroomName })}
        >
          {t("openTimetable")}
        </Button>
      </ConflictTimetableDetails>
    </article>
  );
}
