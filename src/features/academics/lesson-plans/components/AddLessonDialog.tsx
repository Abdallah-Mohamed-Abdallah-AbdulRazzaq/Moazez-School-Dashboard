"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import { Lesson } from "@/features/academics/curriculum/services/curriculumService";
import { WeekInfo } from "@/features/academics/lesson-plans/services/lessonPlansService";
import type {
  BackendTimetableConfigDto,
  BackendTimetableEntryDto,
} from "@/features/academics/timetable/services/timetableApiTypes";
import TimetableSlotSelect, {
  activeTimetableDates,
  type TimetableSlotScope,
  useTimetableConfigForScope,
} from "./TimetableSlotSelect";

interface AddLessonDialogProps extends TimetableSlotScope {
  isOpen: boolean;
  lesson: Lesson | null;
  weeks: WeekInfo[];
  preselectedWeekIndex?: number;
  termStartDate?: string;
  termEndDate?: string;
  onClose: () => void;
  onConfirm: (
    lessonId: string,
    weekIndex: number,
    plannedDate: string,
    timetableEntry: BackendTimetableEntryDto | null,
  ) => Promise<void> | void;
}

function getAvailableInstructionalDays(
  week: WeekInfo | undefined,
  termStartDate?: string,
  termEndDate?: string,
  config?: Pick<BackendTimetableConfigDto, "activeDays" | "weekStartDay"> | null,
) {
  if (!week) return [];
  const dates = week.instructionalDays.filter(
    (date) =>
      date >= week.startDate &&
      date <= week.endDate &&
      (!termStartDate || date >= termStartDate) &&
      (!termEndDate || date <= termEndDate),
  );
  return activeTimetableDates(dates, config ?? null);
}

export default function AddLessonDialog({
  isOpen,
  lesson,
  weeks,
  preselectedWeekIndex,
  termStartDate,
  termEndDate,
  onClose,
  onConfirm,
  academicYearId,
  termId,
  gradeId,
  sectionId,
  classroomId,
  teacherUserId,
  subjectId,
  teacherSubjectAllocationId,
}: AddLessonDialogProps) {
  const t = useTranslations("academics.lessonPlans.mobile");
  const tLessonPlans = useTranslations("academics.lessonPlans");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [selectedWeekIndex, setSelectedWeekIndex] = useState<string>(
    preselectedWeekIndex?.toString() || "",
  );
  const [selectedPlannedDate, setSelectedPlannedDate] = useState("");
  const [selectedTimetableEntry, setSelectedTimetableEntry] =
    useState<BackendTimetableEntryDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const timetableScope = useMemo(
    () => ({
      academicYearId,
      termId,
      gradeId,
      sectionId,
      classroomId,
      teacherUserId,
      subjectId,
      teacherSubjectAllocationId,
    }),
    [
      academicYearId,
      classroomId,
      gradeId,
      sectionId,
      subjectId,
      teacherSubjectAllocationId,
      teacherUserId,
      termId,
    ],
  );
  const {
    config: timetableConfig,
    isLoading: isTimetableConfigLoading,
    error: timetableConfigError,
    isMissing: isTimetableConfigMissing,
  } = useTimetableConfigForScope(timetableScope, isOpen);

  const selectedWeek = weeks.find(
    (week) => week.weekIndex.toString() === selectedWeekIndex,
  );
  const availableInstructionalDays = getAvailableInstructionalDays(
    selectedWeek,
    termStartDate,
    termEndDate,
    timetableConfig,
  );

  useEffect(() => {
    if (isOpen) {
      const initialWeekIndex = preselectedWeekIndex?.toString() || "";
      const initialWeek = weeks.find(
        (week) => week.weekIndex.toString() === initialWeekIndex,
      );
      void Promise.resolve().then(() => {
        setSelectedWeekIndex(initialWeekIndex);
        setSelectedPlannedDate(
          getAvailableInstructionalDays(
            initialWeek,
            termStartDate,
            termEndDate,
            timetableConfig,
          )[0] || "",
        );
      });
    }
  }, [isOpen, preselectedWeekIndex, termEndDate, termStartDate, timetableConfig, weeks]);

  const handleConfirm = async () => {
    if (
      lesson &&
      selectedWeekIndex &&
      selectedPlannedDate &&
      !timetableConfigError &&
      !isTimetableConfigMissing
    ) {
      setSubmitting(true);
      try {
        await onConfirm(
          lesson.id,
          parseInt(selectedWeekIndex, 10),
          selectedPlannedDate,
          selectedTimetableEntry,
        );
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleWeekChange = (value: string) => {
    const week = weeks.find(
      (candidate) => candidate.weekIndex.toString() === value,
    );
    setSelectedWeekIndex(value);
    setSelectedPlannedDate(
      getAvailableInstructionalDays(
        week,
        termStartDate,
        termEndDate,
        timetableConfig,
      )[0] || "",
    );
    setSelectedTimetableEntry(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("addToWeek")}
      size="sm"
      footer={
        <div className="flex gap-2 justify-end">
          <Button onClick={onClose} variant="secondary" disabled={submitting}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            variant="primary"
            loading={submitting}
            disabled={
              !lesson ||
              !selectedWeekIndex ||
              !selectedPlannedDate ||
              availableInstructionalDays.length === 0 ||
              isTimetableConfigLoading ||
              Boolean(timetableConfigError) ||
              isTimetableConfigMissing
            }
          >
            {t("confirm")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Lesson Info */}
        {lesson && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
          </div>
        )}

        {/* Week Selection */}
        {weeks.length === 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {isRTL
              ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0623\u0633\u0627\u0628\u064a\u0639 \u0645\u062a\u0627\u062d\u0629 \u0644\u0644\u062a\u062e\u0637\u064a\u0637 \u0641\u064a \u0647\u0630\u0627 \u0627\u0644\u0641\u0635\u0644."
              : "No teaching weeks are available for planning in this term."}
          </div>
        ) : (
          <Select
            label={t("selectWeek")}
            value={selectedWeekIndex}
            onChange={handleWeekChange}
            options={[
              { value: "", label: t("chooseWeek") },
              ...weeks.map((week) => ({
                value: week.weekIndex.toString(),
                label: `${t("week")} ${week.weekIndex} (${formatDate(week.startDate)} - ${formatDate(week.endDate)})`,
              })),
            ]}
          />
        )}

        {selectedWeekIndex && (
          <Select
            label={t("selectPlannedDay")}
            value={selectedPlannedDate}
            onChange={setSelectedPlannedDate}
            options={availableInstructionalDays.map((date) => ({
              value: date,
              label: formatDate(date),
            }))}
            disabled={
              isTimetableConfigLoading ||
              Boolean(timetableConfigError) ||
              isTimetableConfigMissing ||
              availableInstructionalDays.length === 0
            }
            error={
              timetableConfigError
                ? tLessonPlans("timetableSlotOptions.loadError")
                : isTimetableConfigMissing
                  ? tLessonPlans("timetableSlotOptions.noConfig")
                  : timetableConfig &&
                      availableInstructionalDays.length === 0
                    ? tLessonPlans("validation.no_instructional_days")
                    : undefined
            }
          />
        )}
        {selectedPlannedDate && (
          <TimetableSlotSelect
            academicYearId={academicYearId}
            termId={termId}
            gradeId={gradeId}
            sectionId={sectionId}
            classroomId={classroomId}
            teacherUserId={teacherUserId}
            subjectId={subjectId}
            teacherSubjectAllocationId={teacherSubjectAllocationId}
            plannedDate={selectedPlannedDate}
            value={selectedTimetableEntry?.id ?? ""}
            onChange={setSelectedTimetableEntry}
            label={tLessonPlans("timetableSlotOptions.label")}
            emptyOptionLabel={tLessonPlans("addWithoutSlot")}
            noSlotsMessage={tLessonPlans("timetableSlotOptions.noSlots")}
            loadingMessage={tLessonPlans("timetableSlotOptions.loading")}
            loadErrorMessage={tLessonPlans("timetableSlotOptions.loadError")}
          />
        )}
      </div>
    </Modal>
  );
}
