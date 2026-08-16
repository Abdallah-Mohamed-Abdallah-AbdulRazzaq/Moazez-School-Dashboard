"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import type { DuplicateReinforcementTaskPayload, ReinforcementTask } from "../types";
import { getDefaultReinforcementDueDate } from "./ReinforcementTaskForm";

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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    Promise.resolve().then(() => {
      setTitleEn(task?.titleEn || "");
      setTitleAr(task?.titleAr || "");
      setDueDate(getDefaultReinforcementDueDate());
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
          onChange={(event) => setTitleEn(event.target.value)}
        />
        <Input
          label={t("tasks.form.titleAr")}
          value={titleAr}
          dir="rtl"
          onChange={(event) => setTitleAr(event.target.value)}
        />
        <Input
          type="date"
          label={t("tasks.form.dueDate")}
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
      </div>
    </Modal>
  );
}
