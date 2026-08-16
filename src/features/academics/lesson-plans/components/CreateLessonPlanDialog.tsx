"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import { Input, Select, TextArea } from "@/components/ui/input";
import Modal from "@/components/ui/modal/Modal";
import type { LessonPlan, WeekInfo } from "../services/lessonPlansService";

export interface CreateLessonPlanDialogPayload {
  title: string;
  description: string | null;
  weekStartDate: string;
  weekEndDate: string;
}

interface CreateLessonPlanDialogProps {
  isOpen: boolean;
  weeks: WeekInfo[];
  plans: LessonPlan[];
  preselectedWeekIndex?: number;
  termStartDate?: string;
  termEndDate?: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateLessonPlanDialogPayload) => Promise<void> | void;
}

export default function CreateLessonPlanDialog({
  isOpen,
  weeks,
  plans,
  preselectedWeekIndex,
  termStartDate,
  termEndDate,
  loading = false,
  onClose,
  onSubmit,
}: CreateLessonPlanDialogProps) {
  const t = useTranslations("academics.lessonPlans");
  const initialWeekIndex = preselectedWeekIndex?.toString() || "";
  const [weekIndex, setWeekIndex] = useState(initialWeekIndex);
  const [title, setTitle] = useState(
    initialWeekIndex
      ? t("createPlan.defaultTitle", { index: Number(initialWeekIndex) })
      : "",
  );
  const [description, setDescription] = useState("");
  const [weekError, setWeekError] = useState("");
  const [titleError, setTitleError] = useState("");

  const selectWeek = (value: string) => {
    setWeekIndex(value);
    setWeekError("");
    if (!title.trim() && value) {
      setTitle(t("createPlan.defaultTitle", { index: Number(value) }));
    }
  };

  const submit = async () => {
    const week = weeks.find((candidate) => candidate.weekIndex.toString() === weekIndex);
    setWeekError("");
    setTitleError("");
    if (!week) return setWeekError(t("createPlan.validation.weekRequired"));
    if (!title.trim()) return setTitleError(t("createPlan.validation.titleRequired"));
    if (plans.some((plan) => plan.weekIndex === week.weekIndex && plan.status !== "ARCHIVED")) {
      return setWeekError(t("createPlan.validation.weekAlreadyHasPlan"));
    }
    if (week.startDate > week.endDate) return setWeekError(t("createPlan.validation.invalidWeekRange"));
    if ((termStartDate && week.startDate < termStartDate) || (termEndDate && week.endDate > termEndDate)) {
      return setWeekError(t("createPlan.validation.weekOutsideTerm"));
    }
    await onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      weekStartDate: week.startDate,
      weekEndDate: week.endDate,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("createPlan.title")}
      description={t("createPlan.description")}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>{t("createPlan.cancel")}</Button>
          <Button onClick={submit} loading={loading}>{t("createPlan.submit")}</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Select
          label={t("createPlan.weekLabel")}
          placeholder={t("createPlan.weekPlaceholder")}
          value={weekIndex}
          onChange={selectWeek}
          options={weeks.map((week) => {
            const unavailable = plans.some((plan) => plan.weekIndex === week.weekIndex && plan.status !== "ARCHIVED");
            return {
              value: week.weekIndex.toString(),
              disabled: unavailable,
              label: `${t("week.label", { index: week.weekIndex })} · ${week.startDate} - ${week.endDate}${unavailable ? ` · ${t("createPlan.alreadyHasPlan")}` : ""}`,
            };
          })}
          error={weekError || undefined}
        />
        <Input label={t("createPlan.titleLabel")} value={title} onChange={(event) => { setTitle(event.target.value); setTitleError(""); }} error={titleError || undefined} maxLength={255} required />
        <TextArea label={t("createPlan.descriptionLabel")} value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
      </div>
    </Modal>
  );
}
