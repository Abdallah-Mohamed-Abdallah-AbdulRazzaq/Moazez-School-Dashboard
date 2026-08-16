"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Input, Modal, TextArea } from "@/components/ui";
import type { Test } from "@/features/admissions/types/admissions";

interface TestScoreModalProps {
  test: Test & { studentName: string };
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (testId: string, score: number, result?: string) => Promise<void> | void;
}

const FORM_ID = "test-score-form";

export default function TestScoreModal({ test, isOpen, onClose, onSubmit }: TestScoreModalProps) {
  const t = useTranslations("admissions.test_score_modal");
  const [score, setScore] = useState(test.score?.toString() || "");
  const [result, setResult] = useState(test.notes || "");
  const [scoreError, setScoreError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      void Promise.resolve().then(() => {
        setScore(test.score?.toString() || "");
        setResult(test.notes || "");
        setScoreError(undefined);
        setIsSubmitting(false);
      });
    }
  }, [isOpen, test.id, test.notes, test.score]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const numericScore = Number(score);
    if (!score.trim() || !Number.isFinite(numericScore) || numericScore < 0) {
      setScoreError(t("errors.score_must_be_number"));
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(test.id, numericScore, result.trim() || undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      description={t("subtitle", { studentName: test.studentName })}
      size="lg"
      footer={
        <>
          <Button type="button" onClick={onClose} variant="secondary" disabled={isSubmitting}>{t("cancel")}</Button>
          <Button type="submit" form={FORM_ID} loading={isSubmitting}>{t("save_score")}</Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-6 py-4">
        <div className="grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 text-sm md:grid-cols-2">
          <SummaryField label={t("test_type")} value={test.type} />
          <SummaryField label={t("subject")} value={test.subjectName || test.subject || "—"} />
          <SummaryField label={t("date")} value={test.scheduledAt ? new Date(test.scheduledAt).toLocaleDateString() : "—"} />
          <SummaryField label={t("time")} value={test.scheduledAt ? new Date(test.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"} />
        </div>

        <Input
          label={t("test_score")}
          type="number"
          value={score}
          onChange={(event) => {
            setScore(event.target.value);
            setScoreError(undefined);
          }}
          min="0"
          step="0.5"
          error={scoreError}
          required
        />

        <TextArea
          label={t("notes")}
          value={result}
          onChange={(event) => setResult(event.target.value)}
          rows={4}
          resize="none"
          placeholder={t("notes_placeholder")}
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
