"use client";

import { useState } from "react";
import { BadgeCheck, Check, RotateCcw } from "lucide-react";
import { AccessDenied } from "@/components/ui/access-denied/AccessDenied";
import { Button } from "@/components/ui/button/Button";
import TextArea from "@/components/ui/input/TextArea";
import { usePermissions } from "@/hooks/usePermissions";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import {
  approveAcademicContent,
  requestAcademicContentChanges,
} from "../../services/academicContentApi";
import { academicContentUiError } from "../../services/academicContentErrors";
import type { AcademicContentTransitionResponse } from "../../types/contracts";

const APPROVE_PERMISSION = "academics.academic_content.approve" as const;
const MAX_NOTE_LENGTH = 4000;

interface ReviewDecisionActionsProps {
  contentId: string;
  revisionNumber: number;
  onDecisionComplete: (result: AcademicContentTransitionResponse) => void;
}

export default function ReviewDecisionActions({
  contentId,
  revisionNumber,
  onDecisionComplete,
}: ReviewDecisionActionsProps) {
  const { hasPermission, isPermissionsReady } = usePermissions();
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useAcademicContentTranslations("review");

  if (!isPermissionsReady) return null;
  if (!hasPermission(APPROVE_PERMISSION)) {
    return <AccessDenied requiredPermissions={[APPROVE_PERMISSION]} />;
  }

  const runDecision = async (
    decide: () => Promise<AcademicContentTransitionResponse>,
  ) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      onDecisionComplete(await decide());
    } catch (decisionError) {
      setError(academicContentUiError(decisionError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestChanges = () => {
    const normalizedNote = note.trim();
    if (!normalizedNote) {
      setError(t("note_required"));
      return;
    }
    if (normalizedNote.length > MAX_NOTE_LENGTH) {
      setError(t("note_too_long"));
      return;
    }
    void runDecision(() =>
      requestAcademicContentChanges(contentId, normalizedNote),
    );
  };

  return (
    <section
      aria-labelledby="review-decision-heading"
      className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <BadgeCheck aria-hidden="true" className="size-5" />
        </div>
        <div className="min-w-0">
          <h2
            id="review-decision-heading"
            className="text-lg font-bold text-gray-950"
          >
            {t("decision_title")}
          </h2>
          <p className="mt-1 text-sm leading-5 text-gray-600">
            {t("decision_description")}
          </p>
        </div>
      </div>

      <p className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
        {t("reviewing_revision_number", { number: revisionNumber })}
      </p>

      <TextArea
        label={t("change_note")}
        helperText={t("note_help")}
        value={note}
        rows={5}
        maxLength={MAX_NOTE_LENGTH}
        disabled={isSubmitting}
        onChange={(event) => setNote(event.target.value)}
      />

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          leftIcon={<RotateCcw aria-hidden="true" className="size-4" />}
          onClick={requestChanges}
        >
          {t("request_changes")}
        </Button>
        <Button
          type="button"
          variant="success"
          loading={isSubmitting}
          leftIcon={<Check aria-hidden="true" className="size-4" />}
          onClick={() =>
            void runDecision(() => approveAcademicContent(contentId))
          }
        >
          {t("approve")}
        </Button>
      </div>
    </section>
  );
}
