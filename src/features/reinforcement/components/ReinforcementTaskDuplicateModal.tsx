"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import type { DuplicateReinforcementTaskPayload, ReinforcementTask } from "../types";
import { getDefaultReinforcementDueDate } from "./ReinforcementTaskForm";
import { describeReinforcementTaskApiError } from "../utils/reinforcementTaskApiErrors";

interface ReinforcementTaskDuplicateModalProps {
  task: ReinforcementTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: DuplicateReinforcementTaskPayload) => Promise<void>;
}

export default function ReinforcementTaskDuplicateModal({
  task,
  isOpen,
  onClose,
  onSubmit,
}: ReinforcementTaskDuplicateModalProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [dueDate, setDueDate] = useState(getDefaultReinforcementDueDate());
  const [errors, setErrors] = useState<{ title?: string; dueDate?: string; form?: string }>({});
  const [saving, setSaving] = useState(false);

  const clearErrors = () => setErrors({});

  useEffect(() => {
    if (!isOpen) return;
    Promise.resolve().then(() => {
      setTitleEn(task?.titleEn || "");
      setTitleAr(task?.titleAr || "");
      setDueDate(getDefaultReinforcementDueDate());
      setErrors({});
      setSaving(false);
    });
  }, [isOpen, task]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit({
        titleEn: titleEn.trim() || undefined,
        titleAr: titleAr.trim() || undefined,
        dueDate,
      });
    } catch (submissionError) {
      const apiError = describeReinforcementTaskApiError(submissionError);
      const field = apiError.field === "title" || apiError.field === "dueDate"
        ? apiError.field
        : "form";
      setErrors({ [field]: t(apiError.messageKey) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("tasks.duplicateTitle")}
      description={t("tasks.duplicateDescription")}
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button type="button" loading={saving} onClick={handleSubmit}>
            {t("actions.duplicate")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-4" dir={locale === "ar" ? "rtl" : "ltr"}>
        <Input
          label={t("tasks.form.titleEn")}
          value={titleEn}
          error={errors.title}
          maxLength={255}
          onChange={(event) => {
            setTitleEn(event.target.value);
            clearErrors();
          }}
        />
        <Input
          label={t("tasks.form.titleAr")}
          value={titleAr}
          error={errors.title}
          maxLength={255}
          dir="rtl"
          onChange={(event) => {
            setTitleAr(event.target.value);
            clearErrors();
          }}
        />
        <Input
          type="date"
          label={t("tasks.form.dueDate")}
          value={dueDate}
          error={errors.dueDate}
          onChange={(event) => {
            setDueDate(event.target.value);
            clearErrors();
          }}
        />
        {errors.form ? <p className="text-sm text-red-600">{errors.form}</p> : null}
      </div>
    </Modal>
  );
}
