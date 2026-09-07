"use client";

import Button from "@/components/ui/button/Button";
import { Input, TextArea } from "@/components/ui";
import { useTranslations } from "next-intl";
import type { SubmissionReviewDraft, SubmissionReviewValidation } from "../utils/submissionReviewDrafts";

interface SubmissionAnswerReviewFieldsProps {
  draft: SubmissionReviewDraft;
  maxPoints: number;
  validation: SubmissionReviewValidation;
  dirty: boolean;
  readOnly: boolean;
  saving: boolean;
  bulkSaving: boolean;
  onChange: (draft: SubmissionReviewDraft) => void;
  onSave: () => void;
}

export default function SubmissionAnswerReviewFields({
  draft, maxPoints, validation, dirty, readOnly, saving, bulkSaving, onChange, onSave,
}: SubmissionAnswerReviewFieldsProps) {
  const t = useTranslations("academics.grades.submissions");
  const disabled = readOnly || saving || bulkSaving;
  const update = (updates: Partial<SubmissionReviewDraft>) => onChange({ ...draft, ...updates });

  return (
    <div className="mt-4 grid gap-3 border-t border-[var(--border-color)] pt-4 md:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)]">
      <Input label={t("awardedPoints")} type="number" min={0} max={maxPoints} value={draft.awardedPoints} disabled={disabled}
        error={validation.awardedPoints ? t(`reviewValidation.${validation.awardedPoints}`) : undefined}
        onChange={(event) => update({ awardedPoints: event.target.value })} />
      <TextArea label={t("reviewCommentEn")} maxLength={2000} value={draft.reviewerComment} disabled={disabled}
        error={validation.reviewerComment ? t("reviewValidation.too_long") : undefined}
        onChange={(event) => update({ reviewerComment: event.target.value })} />
      <TextArea label={t("reviewCommentAr")} dir="rtl" maxLength={2000} value={draft.reviewerCommentAr} disabled={disabled}
        error={validation.reviewerCommentAr ? t("reviewValidation.too_long") : undefined}
        onChange={(event) => update({ reviewerCommentAr: event.target.value })} />
      {!readOnly ? <div className="md:col-span-3 flex justify-end"><Button size="sm" variant="primary" loading={saving} disabled={!dirty || Object.keys(validation).length > 0 || bulkSaving} onClick={onSave}>{t("saveReview")}</Button></div> : null}
    </div>
  );
}
