"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Modal, TextArea } from "@/components/ui";
import type { Interview } from "@/features/admissions/types/admissions";

interface InterviewRatingModalProps {
  interview: Interview & { studentName: string };
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (interviewId: string, notes?: string) => Promise<void> | void;
}

const FORM_ID = "interview-completion-form";

export default function InterviewRatingModal({
  interview,
  isOpen,
  onClose,
  onSubmit,
}: InterviewRatingModalProps) {
  const t = useTranslations("admissions.interview_rating_modal");
  const [notes, setNotes] = useState(interview.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      void Promise.resolve().then(() => {
        setNotes(interview.notes || "");
        setIsSubmitting(false);
      });
    }
  }, [interview.id, interview.notes, isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(interview.id, notes.trim() || undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      description={t("subtitle", { studentName: interview.studentName })}
      size="lg"
      footer={
        <>
          <Button type="button" onClick={onClose} variant="secondary" disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button type="submit" form={FORM_ID} loading={isSubmitting}>
            {t("save_rating")}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-6 py-4">
        <div className="grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 text-sm md:grid-cols-2">
          <SummaryField label={t("date")} value={formatScheduledDate(interview.scheduledAt)} />
          <SummaryField label={t("time")} value={formatScheduledTime(interview.scheduledAt)} />
          <SummaryField label={t("interviewer")} value={interview.interviewerName || interview.interviewer || interview.interviewerUserId || "—"} />
          <SummaryField label="Status" value={interview.status} />
        </div>

        <TextArea
          label={t("interview_notes")}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={6}
          resize="none"
          placeholder={t("notes_placeholder")}
          helperText={t("notes_help")}
        />
      </form>
    </Modal>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="mt-1 font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function formatScheduledDate(scheduledAt?: string) {
  return scheduledAt ? new Date(scheduledAt).toLocaleDateString() : "—";
}

function formatScheduledTime(scheduledAt?: string) {
  return scheduledAt
    ? new Date(scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "—";
}
