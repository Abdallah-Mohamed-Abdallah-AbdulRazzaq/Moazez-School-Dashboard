"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import { Input, TextArea } from "@/components/ui/input";
import Modal from "@/components/ui/modal/Modal";
import type {
  AssessmentQuestion,
  AssessmentSubmissionReview,
  QuestionOption,
} from "../../shared/types";

interface ReviewAssessmentSubmissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  review: AssessmentSubmissionReview | null;
  onSubmit: (payload: Array<{ answerId: string; awardedPoints: number | null; teacherComment?: string }>) => Promise<void>;
  isSubmitting: boolean;
}

interface DraftAnswerState {
  answerId: string;
  awardedPoints: string;
  teacherComment: string;
}

const formatStudentAnswer = (
  question: AssessmentQuestion,
  reviewItem: AssessmentSubmissionReview["questions"][number],
  locale: string,
  t: (key: string) => string,
) => {
  const { answer } = reviewItem;
  if (!answer) return "-";

  if (question.questionType === "MCQ_SINGLE" || question.questionType === "MCQ_MULTI") {
    const labels = (answer.selectedOptionIds || [])
      .map((optionId) => question.options?.find((option) => option.id === optionId))
      .filter((option): option is QuestionOption => Boolean(option))
      .map((option) => (locale === "ar" ? option.textAr : option.textEn))
      .filter(Boolean);

    return labels.length > 0 ? labels.join(", ") : "-";
  }

  if (question.questionType === "TRUE_FALSE") {
    if (typeof answer.booleanAnswer !== "boolean") return "-";
    return answer.booleanAnswer ? t("trueLabel") : t("falseLabel");
  }

  if (question.questionType === "MATCHING") {
    return t("matchingStudentAnswerPlaceholder");
  }

  if (question.questionType === "MEDIA") {
    return t("mediaStudentAnswerPlaceholder");
  }

  return answer.answerText?.trim() || "-";
};

const formatReferenceAnswer = (
  question: AssessmentQuestion,
  locale: string,
  t: (key: string) => string,
) => {
  if (question.questionType === "MCQ_SINGLE" || question.questionType === "MCQ_MULTI") {
    const labels = (question.options || [])
      .filter((option) => option.isCorrect)
      .map((option) => (locale === "ar" ? option.textAr : option.textEn))
      .filter(Boolean);
    return labels.length > 0 ? labels.join(", ") : "-";
  }

  if (question.questionType === "TRUE_FALSE") {
    if (typeof question.correctAnswer !== "boolean") return "-";
    return question.correctAnswer ? t("trueLabel") : t("falseLabel");
  }

  if (question.questionType === "FILL_IN_BLANK") {
    const acceptedAnswers =
      locale === "ar" ? question.acceptedAnswersAr || [] : question.acceptedAnswersEn || [];
    return acceptedAnswers.length > 0
      ? acceptedAnswers.join(", ")
      : t("manualReviewPlaceholder");
  }

  if (question.questionType === "MATCHING") {
    return t("matchingReferencePlaceholder");
  }

  if (question.questionType === "MEDIA") {
    return question.mediaFileName || question.mediaTitle || question.mediaUrl || t("mediaReferencePlaceholder");
  }

  return locale === "ar" ? question.sampleAnswerAr || "-" : question.sampleAnswerEn || "-";
};

export default function ReviewAssessmentSubmissionDialog({
  isOpen,
  onClose,
  review,
  onSubmit,
  isSubmitting,
}: ReviewAssessmentSubmissionDialogProps) {
  const t = useTranslations("academics.grades.dialogs.reviewSubmission");
  const locale = useLocale();
  const [draftAnswers, setDraftAnswers] = useState<Record<string, DraftAnswerState>>({});

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!review) {
      setDraftAnswers({});
      return;
    }

    setDraftAnswers(
      Object.fromEntries(
        review.questions
          .filter(
            (
              item,
            ): item is AssessmentSubmissionReview["questions"][number] & {
              answer: NonNullable<AssessmentSubmissionReview["questions"][number]["answer"]>;
            } => Boolean(item.answer),
          )
          .map((item) => [
            item.answer!.id,
            {
              answerId: item.answer!.id,
              awardedPoints:
                item.answer!.awardedPoints == null ? "" : String(item.answer!.awardedPoints),
              teacherComment: item.answer!.teacherComment || "",
            },
          ]),
      ),
    );
  }, [review]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const runningTotal = useMemo(
    () =>
      Object.values(draftAnswers).reduce(
        (sum, item) => sum + (item.awardedPoints === "" ? 0 : Number(item.awardedPoints)),
        0,
      ),
    [draftAnswers],
  );

  const handleSubmit = async () => {
    await onSubmit(
      Object.values(draftAnswers).map((item) => ({
        answerId: item.answerId,
        awardedPoints: item.awardedPoints === "" ? null : Number(item.awardedPoints),
        teacherComment: item.teacherComment,
      })),
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      description={
        review
          ? t("description", {
              student: locale === "ar" ? review.studentNameAr : review.studentNameEn,
              assessment: locale === "ar" ? review.assessment.titleAr : review.assessment.title,
            })
          : ""
      }
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
            {t("save")}
          </Button>
        </>
      }
    >
      {!review ? null : (
        <div className="space-y-4 pb-4">
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-secondary)" }}
          >
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
              <div>
                <div style={{ color: "var(--text-secondary)" }}>{t("submissionStatus")}</div>
                <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                  {t(`submissionStatuses.${review.submission.status}`)}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--text-secondary)" }}>{t("submittedAt")}</div>
                <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                  {review.submission.submittedAt || "-"}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--text-secondary)" }}>{t("runningTotal")}</div>
                <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                  {runningTotal}/{review.submission.maxScore}
                </div>
              </div>
            </div>
          </div>

          {review.questions.map((item, index) => {
            const draft = item.answer ? draftAnswers[item.answer.id] : null;
            return (
              <div
                key={item.question.id}
                className="rounded-xl border p-4"
                style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {t("questionLabel", { number: index + 1 })}
                    </div>
                    <div className="mt-1 text-sm" style={{ color: "var(--text-primary)" }}>
                      {(locale === "ar" ? item.question.questionTextAr : item.question.questionTextEn) ||
                        item.question.mediaTitle ||
                        item.question.mediaFileName ||
                        t("mediaReferencePlaceholder")}
                    </div>
                  </div>
                  <div className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    {item.question.points} {t("points")}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>
                      {t("studentAnswer")}
                    </div>
                    <div className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--border-color)" }}>
                      {formatStudentAnswer(item.question, item, locale, t)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>
                      {t("referenceAnswer")}
                    </div>
                    <div className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--border-color)" }}>
                      {formatReferenceAnswer(item.question, locale, t)}
                    </div>
                  </div>
                </div>

                {draft ? (
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Input
                      label={t("awardedPoints")}
                      type="number"
                      min="0"
                      max={item.question.points}
                      value={draft.awardedPoints}
                      onChange={(event) =>
                        setDraftAnswers((current) => ({
                          ...current,
                          [draft.answerId]: { ...draft, awardedPoints: event.target.value },
                        }))
                      }
                      helperText={t("pointsHelp", { max: item.question.points })}
                    />
                    <TextArea
                      label={t("teacherComment")}
                      value={draft.teacherComment}
                      rows={3}
                      onChange={(event) =>
                        setDraftAnswers((current) => ({
                          ...current,
                          [draft.answerId]: { ...draft, teacherComment: event.target.value },
                        }))
                      }
                    />
                  </div>
                ) : (
                  <div className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {t("noAnswer")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
