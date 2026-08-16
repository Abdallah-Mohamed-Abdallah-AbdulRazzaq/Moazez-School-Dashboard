"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import TextArea from "@/components/ui/input/TextArea";
import type { ReviewReinforcementSubmissionPayload } from "../types";

interface ReinforcementReviewActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ReviewReinforcementSubmissionPayload) => Promise<void>;
  actionType: "approve" | "reject";
  loading?: boolean;
}

export default function ReinforcementReviewActionModal({
  isOpen,
  onClose,
  onSubmit,
  actionType,
  loading = false,
}: ReinforcementReviewActionModalProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const [note, setNote] = useState("");
  const [noteAr, setNoteAr] = useState("");

  // Reset form fields when modal opens
  useEffect(() => {
    if (isOpen) {
    void Promise.resolve().then(() => setNote(""));
    void Promise.resolve().then(() => setNoteAr(""));
    }
  }, [isOpen]);

  const isApprove = actionType === "approve";

  const handleSubmit = async () => {
    await onSubmit({
      note: note.trim() || undefined,
      noteAr: noteAr.trim() || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isApprove
          ? t("reviews.detail.approveTitle")
          : t("reviews.detail.rejectTitle")
      }
      description={
        isApprove
          ? t("reviews.detail.approveDescription")
          : t("reviews.detail.rejectDescription")
      }
      variant={isApprove ? "confirm" : "danger"}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t("actions.cancel")}
          </Button>
          <Button
            variant={isApprove ? "primary" : "danger"}
            loading={loading}
            onClick={handleSubmit}
          >
            {isApprove
              ? t("reviews.actions.approve")
              : t("reviews.actions.reject")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-2" dir={locale === "ar" ? "rtl" : "ltr"}>
        <TextArea
          label={t("reviews.detail.noteEn")}
          placeholder={t("reviews.detail.notePlaceholder")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <TextArea
          label={t("reviews.detail.noteAr")}
          placeholder={t("reviews.detail.notePlaceholderAr")}
          value={noteAr}
          dir="rtl"
          onChange={(e) => setNoteAr(e.target.value)}
        />
      </div>
    </Modal>
  );
}
