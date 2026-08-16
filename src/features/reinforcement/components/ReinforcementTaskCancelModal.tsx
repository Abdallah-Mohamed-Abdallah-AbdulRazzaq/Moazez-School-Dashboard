"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import TextArea from "@/components/ui/input/TextArea";
import type { CancelReinforcementTaskPayload, ReinforcementTask } from "../types";

interface ReinforcementTaskCancelModalProps {
  task: ReinforcementTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CancelReinforcementTaskPayload) => Promise<void>;
}

export default function ReinforcementTaskCancelModal({
  task,
  isOpen,
  onClose,
  onSubmit,
}: ReinforcementTaskCancelModalProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    Promise.resolve().then(() => {
      setReason("");
      setError("");
      setSaving(false);
    });
  }, [isOpen, task]);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError(t("validation.cancelReasonRequired"));
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        reason: reason.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("tasks.cancelTitle")}
      description={t("tasks.cancelDescription")}
      variant="danger"
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={saving}
            onClick={handleSubmit}
          >
            {t("tasks.confirmCancel")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-4" dir={locale === "ar" ? "rtl" : "ltr"}>
        <TextArea
          label={t("tasks.cancelReason")}
          value={reason}
          error={error}
          onChange={(event) => {
            setReason(event.target.value);
            setError("");
          }}
        />
      </div>
    </Modal>
  );
}
