"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import { TextArea } from "@/components/ui/input";

export default function SkipCancelReasonDialog({
  action,
  onClose,
  onConfirm,
  loading,
}: {
  action: "skip" | "cancel" | null;
  onClose: () => void;
  onConfirm: (note: string) => void;
  loading: boolean;
}) {
  const t = useTranslations("academics.lessonPlans");
  const [note, setNote] = useState("");
  return (
    <Modal
      isOpen={Boolean(action)}
      onClose={onClose}
      title={action === "skip" ? t("actions.skip") : t("actions.cancelLesson")}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("actions.back")}
          </Button>
          <Button onClick={() => onConfirm(note)} loading={loading}>
            {t("actions.confirm")}
          </Button>
        </>
      }
    >
      <TextArea
        label={t("labels.reason_optional")}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={4}
      />
    </Modal>
  );
}
