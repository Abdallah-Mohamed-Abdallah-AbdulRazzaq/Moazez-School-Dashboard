"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import { DatePicker, Input, TextArea } from "@/components/ui/input";
import type {
  LessonPlan,
  UpdateLessonPlanRequest,
} from "../services/lessonPlansService";
import {
  formatDateOnly,
  lessonPlanRangeErrors,
  parseDateOnly,
} from "../services/lessonPlanDates";

export default function EditLessonPlanDialog({
  plan,
  termStartDate,
  termEndDate,
  onClose,
  onSave,
  loading,
}: {
  plan: LessonPlan;
  termStartDate?: string;
  termEndDate?: string;
  onClose: () => void;
  onSave: (payload: UpdateLessonPlanRequest) => void;
  loading: boolean;
}) {
  const t = useTranslations("academics.lessonPlans");
  const [title, setTitle] = useState(plan.title);
  const [description, setDescription] = useState(plan.description ?? "");
  const [start, setStart] = useState<Date | null>(() =>
    parseDateOnly(plan.weekStartDate),
  );
  const [end, setEnd] = useState<Date | null>(() =>
    parseDateOnly(plan.weekEndDate),
  );
  const startValue = start ? formatDateOnly(start) : undefined;
  const endValue = end ? formatDateOnly(end) : undefined;
  const errors = useMemo(
    () =>
      lessonPlanRangeErrors(startValue, endValue, termStartDate, termEndDate),
    [endValue, startValue, termEndDate, termStartDate],
  );
  const valid = Boolean(
    title.trim() && startValue && endValue && !errors.start && !errors.end,
  );
  const save = () => {
    if (!valid || !startValue || !endValue) return;
    onSave({
      title: title.trim(),
      description: description || null,
      weekStartDate: startValue,
      weekEndDate: endValue,
    });
  };
  const range =
    termStartDate && termEndDate
      ? t("labels.term_range", { start: termStartDate, end: termEndDate })
      : undefined;
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t("actions.editPlan")}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button onClick={save} disabled={!valid} loading={loading}>
            {t("actions.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input
          label={t("labels.title")}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
        <TextArea
          label={t("labels.description")}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <DatePicker
            label={t("labels.week_start_date")}
            value={start}
            onChange={setStart}
            minDate={parseDateOnly(termStartDate) ?? undefined}
            maxDate={parseDateOnly(termEndDate) ?? undefined}
            error={errors.start ? t(`validation.${errors.start}`) : undefined}
            helperText={range}
            required
          />
          <DatePicker
            label={t("labels.week_end_date")}
            value={end}
            onChange={setEnd}
            minDate={parseDateOnly(termStartDate) ?? undefined}
            maxDate={parseDateOnly(termEndDate) ?? undefined}
            error={errors.end ? t(`validation.${errors.end}`) : undefined}
            helperText={range}
            required
          />
        </div>
      </div>
    </Modal>
  );
}
