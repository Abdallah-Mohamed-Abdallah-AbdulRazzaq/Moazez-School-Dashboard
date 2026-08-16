"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/ui/input/TextArea";
import type { MessageReportStatus } from "@/features/communication/types/safety.types";

export interface ReportStatusActionsLabels {
  title: string;
  markInReview: string;
  resolve: string;
  resolutionNote: string;
  resolutionPlaceholder: string;
  noteRequired: string;
  resolved: string;
}

export interface ReportStatusActionsProps {
  status?: string;
  isSubmitting?: boolean;
  labels: ReportStatusActionsLabels;
  onUpdateStatus: (
    status: MessageReportStatus,
    resolutionNote?: string,
  ) => Promise<void> | void;
}

export default function ReportStatusActions({
  isSubmitting,
  labels,
  onUpdateStatus,
  status,
}: ReportStatusActionsProps) {
  const [resolutionNote, setResolutionNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleResolve = async () => {
    if (!resolutionNote.trim()) {
      setError(labels.noteRequired);
      return;
    }
    setError(null);
    await onUpdateStatus("resolved", resolutionNote);
  };

  if (status === "resolved") {
    return (
      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          {labels.resolved}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">{labels.title}</h2>
      <div className="flex flex-wrap gap-2">
        {status === "open" ? (
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            leftIcon={
              isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : undefined
            }
            onClick={() => void onUpdateStatus("in_review")}
          >
            {labels.markInReview}
          </Button>
        ) : null}
      </div>
      <TextArea
        label={labels.resolutionNote}
        placeholder={labels.resolutionPlaceholder}
        value={resolutionNote}
        error={error ?? undefined}
        rows={4}
        onChange={(event) => setResolutionNote(event.target.value)}
      />
      <div className="flex justify-end">
        <Button
          type="button"
          loading={isSubmitting}
          onClick={() => void handleResolve()}
        >
          {labels.resolve}
        </Button>
      </div>
    </section>
  );
}
