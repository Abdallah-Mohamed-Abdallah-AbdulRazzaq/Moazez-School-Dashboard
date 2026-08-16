"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import { Input, Select, TextArea } from "@/components/ui/input";
import Modal from "@/components/ui/modal/Modal";
import type { Assessment, GradeItemStatus } from "../types";

interface EditGradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { score: number | null; status: GradeItemStatus; comment?: string }) => Promise<void>;
  assessment: Assessment | null;
  studentName: string;
  initialScore: number | null;
  initialStatus: GradeItemStatus;
  initialComment?: string;
  isSubmitting: boolean;
  apiError?: { field?: string; message: string } | null;
}

export default function EditGradeDialog({
  isOpen,
  onClose,
  onSubmit,
  assessment,
  studentName,
  initialScore,
  initialStatus,
  initialComment,
  isSubmitting,
  apiError = null,
}: EditGradeDialogProps) {
  const t = useTranslations("academics.grades.dialogs.editGrade");
  const [score, setScore] = useState(initialScore == null ? "" : String(initialScore));
  const [status, setStatus] = useState<GradeItemStatus>(initialStatus);
  const [comment, setComment] = useState(initialComment || "");
  const scoreNumber = Number(score);
  const scoreError = status === "entered" && score === ""
    ? t("errors.scoreRequired")
    : status === "entered" && (!Number.isFinite(scoreNumber) || scoreNumber < 0 || scoreNumber > (assessment?.maxScore ?? 0))
      ? t("errors.scoreRange", { maxScore: assessment?.maxScore ?? 0 })
      : status === "entered" && !/^\d+(\.\d{1,2})?$/.test(score)
        ? t("errors.scorePrecision")
        : undefined;
  const commentError = comment.length > 500 ? t("errors.commentLength") : undefined;
  const isInvalid = !!scoreError || !!commentError;

  const statusOptions = useMemo(
    () => [
      { value: "entered", label: t("statuses.entered") },
      { value: "missing", label: t("statuses.missing") },
      { value: "absent", label: t("statuses.absent") },
    ],
    [t],
  );

  const handleSubmit = async () => {
    if (isInvalid) return;
    await onSubmit({
      score: status === "entered" && score !== "" ? Number(score) : null,
      status,
      comment,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      description={t("description", {
        student: studentName,
        assessment: assessment?.title || "-",
      })}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={isSubmitting} disabled={isInvalid}>
            {t("save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select label={t("status")} value={status} onChange={(value) => setStatus(value as GradeItemStatus)} options={statusOptions} error={apiError?.field === "status" ? apiError.message : undefined} />
        <Input
          label={t("score")}
          type="number"
          min="0"
          max={assessment?.maxScore || 100}
          value={score}
          onChange={(event) => setScore(event.target.value)}
          disabled={status !== "entered"}
          helperText={assessment ? t("scoreHelp", { maxScore: assessment.maxScore }) : undefined}
          error={apiError?.field === "score" ? apiError.message : scoreError}
        />
        <TextArea label={t("comment")} value={comment} onChange={(event) => setComment(event.target.value)} rows={4} maxLength={501} error={apiError?.field === "comment" ? apiError.message : commentError} />
      </div>
    </Modal>
  );
}
