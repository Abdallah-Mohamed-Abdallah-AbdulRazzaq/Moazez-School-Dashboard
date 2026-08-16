"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import { Input, Select, TextArea } from "@/components/ui/input";
import type { BackendTimetableEntryDto } from "@/features/academics/timetable/services/timetableApiTypes";
import type { LessonPlanItem, UpdateLessonPlanItemRequest, WeekInfo } from "../services/lessonPlansBackendTypes";
import TimetableSlotSelect, {
  activeTimetableDates,
  dayOfWeekFromDateOnly,
  type TimetableSlotScope,
  useTimetableConfigForScope,
} from "./TimetableSlotSelect";

interface Props extends TimetableSlotScope {
  item: LessonPlanItem;
  week: WeekInfo;
  termStartDate?: string;
  termEndDate?: string;
  onClose: () => void;
  onSave: (payload: UpdateLessonPlanItemRequest) => void;
  loading: boolean;
}

export default function EditLessonPlanItemDialog(props: Props) {
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
  } = useTimetableConfigForScope(timetableScope, true);
  const validDays = useMemo(() => {
    const baseValidDays = props.week.instructionalDays.filter(
      (date) =>
        date >= props.week.startDate &&
        date <= props.week.endDate &&
        (!props.termStartDate || date >= props.termStartDate) &&
        (!props.termEndDate || date <= props.termEndDate),
    );
    return activeTimetableDates(baseValidDays, timetableConfig);
  }, [
    props.termEndDate,
    props.termStartDate,
    props.week.endDate,
    props.week.instructionalDays,
    props.week.startDate,
    timetableConfig,
  ]);
  const [title, setTitle] = useState(props.item.title ?? "");
  const [notes, setNotes] = useState(props.item.notes ?? "");
  const [plannedDate, setPlannedDate] = useState(
    validDays.includes(props.item.plannedDate ?? "")
      ? props.item.plannedDate!
      : (validDays[0] ?? ""),
  );
  const [slot, setSlot] = useState<BackendTimetableEntryDto | null>(null);
  useEffect(() => {
    if (plannedDate && validDays.includes(plannedDate)) return;
    void Promise.resolve().then(() => {
      setPlannedDate(
        validDays.includes(props.item.plannedDate ?? "")
          ? props.item.plannedDate!
          : (validDays[0] ?? ""),
      );
      setSlot(null);
    });
  }, [plannedDate, props.item.plannedDate, validDays]);
  const formatDate = (date: string) =>
    new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(
      new Date(date),
    );
  const save = () => {
    if (
      !plannedDate ||
      !validDays.includes(plannedDate) ||
      timetableConfigError ||
      isTimetableConfigMissing
    ) return;
    props.onSave({
      title: title.trim() || null,
      notes: notes.trim() || null,
      plannedDate,
      dayOfWeek: slot?.dayOfWeek ?? dayOfWeekFromDateOnly(plannedDate),
      timetableEntryId: slot?.id ?? null,
      periodId: slot?.periodId ?? null,
      periodLabel: slot?.period.label ?? null,
    });
  };
  return (
    <Modal
      isOpen
      onClose={props.onClose}
      title={t("editItem.title")}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={props.onClose}>
            {t("editItem.cancel")}
          </Button>
          <Button
            onClick={save}
            disabled={
              !plannedDate ||
              isTimetableConfigLoading ||
              Boolean(timetableConfigError) ||
              isTimetableConfigMissing
            }
            loading={props.loading}
          >
            {t("editItem.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label={t("editItem.titleLabel")} value={title} onChange={(event) => setTitle(event.target.value)} />
        <TextArea label={t("editItem.notesLabel")} value={notes} onChange={(event) => setNotes(event.target.value)} />
        <Select
          label={t("editItem.plannedDay")}
          value={plannedDate}
          onChange={(date) => { setPlannedDate(date); setSlot(null); }}
          options={validDays.map((date) => ({ value: date, label: formatDate(date) }))}
          disabled={
            isTimetableConfigLoading ||
            Boolean(timetableConfigError) ||
            isTimetableConfigMissing ||
            validDays.length === 0
          }
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
        {plannedDate && (
          <TimetableSlotSelect
            {...props}
            plannedDate={plannedDate}
            value={slot?.id ?? ""}
            onChange={setSlot}
            label={t("timetableSlotOptions.label")}
            emptyOptionLabel={t("addWithoutSlot")}
            noSlotsMessage={t("timetableSlotOptions.noSlots")}
            loadingMessage={t("timetableSlotOptions.loading")}
            loadErrorMessage={t("timetableSlotOptions.loadError")}
          />
        )}
      </div>
    </Modal>
  );
}
