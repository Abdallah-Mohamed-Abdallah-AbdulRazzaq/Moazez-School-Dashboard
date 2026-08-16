"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import type { BackendTimetableEntryDto } from "@/features/academics/timetable/services/timetableApiTypes";
import type { MoveLessonPlanItemRequestDto, WeekInfo } from "../services/lessonPlansBackendTypes";
import TimetableSlotSelect, {
  activeTimetableDates,
  type TimetableSlotScope,
  useTimetableConfigForScope,
} from "./TimetableSlotSelect";

interface MoveLessonDialogProps extends TimetableSlotScope {
  isOpen: boolean;
  targetWeek: WeekInfo;
  termStartDate?: string;
  termEndDate?: string;
  sortOrder: number;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (payload: MoveLessonPlanItemRequestDto) => void;
}

export default function MoveLessonDialog(props: MoveLessonDialogProps) {
  const t = useTranslations("academics.lessonPlans");
  const locale = useLocale();
  const timetableScope = useMemo(
    () => ({
      academicYearId: props.academicYearId,
      termId: props.termId,
      gradeId: props.gradeId,
      sectionId: props.sectionId,
      classroomId: props.classroomId,
      teacherUserId: props.teacherUserId,
      subjectId: props.subjectId,
      teacherSubjectAllocationId: props.teacherSubjectAllocationId,
    }),
    [
      props.academicYearId,
      props.classroomId,
      props.gradeId,
      props.sectionId,
      props.subjectId,
      props.teacherSubjectAllocationId,
      props.teacherUserId,
      props.termId,
    ],
  );
  const {
    config: timetableConfig,
    isLoading: isTimetableConfigLoading,
    error: timetableConfigError,
    isMissing: isTimetableConfigMissing,
  } = useTimetableConfigForScope(timetableScope, props.isOpen);
  const validDays = useMemo(() => {
    const baseValidDays = props.targetWeek.instructionalDays.filter(
      (date) =>
        date >= props.targetWeek.startDate &&
        date <= props.targetWeek.endDate &&
        (!props.termStartDate || date >= props.termStartDate) &&
        (!props.termEndDate || date <= props.termEndDate),
    );
    return activeTimetableDates(baseValidDays, timetableConfig);
  }, [
    props.targetWeek.endDate,
    props.targetWeek.instructionalDays,
    props.targetWeek.startDate,
    props.termEndDate,
    props.termStartDate,
    timetableConfig,
  ]);
  const [plannedDate, setPlannedDate] = useState(validDays[0] ?? "");
  const [entry, setEntry] = useState<BackendTimetableEntryDto | null>(null);
  useEffect(() => {
    if (plannedDate && validDays.includes(plannedDate)) return;
    void Promise.resolve().then(() => {
      setPlannedDate(validDays[0] ?? "");
      setEntry(null);
    });
  }, [plannedDate, validDays]);
  const formatDate = (date: string) =>
    new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(
      new Date(date),
    );
  const confirm = () => {
    if (!plannedDate || timetableConfigError || isTimetableConfigMissing) return;
    props.onConfirm({
      weekIndex: props.targetWeek.weekIndex,
      plannedDate,
      ...(entry ? { timetableEntryId: entry.id } : {}),
      sortOrder: props.sortOrder,
    });
  };
  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={t("actions.move")}
      size="sm"
      footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={props.onClose} disabled={props.loading}>{t("actions.cancel")}</Button><Button onClick={confirm} disabled={!plannedDate || isTimetableConfigLoading || Boolean(timetableConfigError) || isTimetableConfigMissing} loading={props.loading}>{t("actions.confirmMove")}</Button></div>}
    >
      <div className="space-y-4">
        <Select
          label={t("plannedDay")}
          value={plannedDate}
          onChange={(date) => { setPlannedDate(date); setEntry(null); }}
          options={validDays.map((date) => ({ value: date, label: formatDate(date) }))}
          disabled={isTimetableConfigLoading || Boolean(timetableConfigError) || isTimetableConfigMissing || validDays.length === 0}
          error={
            timetableConfigError
              ? t("timetableSlotOptions.loadError")
              : isTimetableConfigMissing
                ? t("timetableSlotOptions.noConfig")
                : timetableConfig && validDays.length === 0
                  ? t("validation.no_instructional_days")
                  : undefined
          }
        />
        {plannedDate && <TimetableSlotSelect {...props} plannedDate={plannedDate} value={entry?.id ?? ""} onChange={setEntry} label={t("timetableSlotOptions.label")} emptyOptionLabel={t("moveWithoutSlot")} noSlotsMessage={t("timetableSlotOptions.noSlots")} loadingMessage={t("timetableSlotOptions.loading")} loadErrorMessage={t("timetableSlotOptions.loadError")} />}
      </div>
    </Modal>
  );
}
