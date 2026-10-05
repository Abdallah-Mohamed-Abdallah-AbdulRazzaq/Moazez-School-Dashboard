"use client";

import { useState } from "react";
import { RefreshCw, Send } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import { useAcademicContentPublication } from "../../hooks/useAcademicContentPublication";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { PublicationDraft } from "../../model/academicContentPublicationPolicy";
import type { AcademicContentDetail } from "../../types/contracts";
import AudiencePreviewCard from "./AudiencePreviewCard";
import PublicationDetailModal from "./PublicationDetailModal";
import PublicationDialog from "./PublicationDialog";
import PublicationHistoryPanel from "./PublicationHistoryPanel";
import PublicationReadinessCard from "./PublicationReadinessCard";
import PublicationStatusBadge from "./PublicationStatusBadge";

interface AcademicContentPublicationPanelProps {
  content: AcademicContentDetail;
  canMutate: boolean;
  onContentChanged: () => Promise<unknown>;
}

function isImmediatePublication(publishAt: string, createdAt: string): boolean {
  return new Date(publishAt).getTime() - new Date(createdAt).getTime() <= 30_000;
}

export default function AcademicContentPublicationPanel({
  content,
  canMutate,
  onContentChanged,
}: AcademicContentPublicationPanelProps) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("publication");
  const publication = useAcademicContentPublication(
    content.id,
    onContentChanged,
  );
  const [dialogMode, setDialogMode] = useState<PublicationDraft["mode"] | null>(
    null,
  );
  const [selectedPublicationId, setSelectedPublicationId] = useState<
    string | null
  >(null);
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const submitPublication = async (draft: PublicationDraft) => {
    const createdPublication = await publication.create(draft);
    if (createdPublication) setDialogMode(null);
  };

  const closeDetail = () => {
    setSelectedPublicationId(null);
    publication.clearDetail();
  };

  const tracked = publication.trackedPublication;
  const isProcessing =
    tracked?.status === "SCHEDULED" &&
    isImmediatePublication(tracked.publishAt, tracked.createdAt);

  return (
    <section id="publication" aria-labelledby="publication-heading" className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Send aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h2
              id="publication-heading"
              className="text-lg font-semibold text-gray-900"
            >
              {t("title")}
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              {t("description")}
            </p>
          </div>
        </div>

        {tracked ? (
          <div
            role="status"
            className={`mt-5 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
              tracked.status === "PUBLISHED"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            <PublicationStatusBadge status={tracked.status} />
            <span>
              {isProcessing
                ? t("processing")
                : tracked.status === "SCHEDULED"
                  ? t("scheduled_for", {
                      date: dateFormatter.format(new Date(tracked.publishAt)),
                    })
                  : t(`statuses.${tracked.status}`)}
            </span>
          </div>
        ) : null}

        {publication.pollTimedOut ? (
          <div
            role="alert"
            className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            <span>{t("poll_timeout")}</span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              leftIcon={<RefreshCw aria-hidden="true" className="size-4" />}
              onClick={() => void publication.reload()}
            >
              {t("refresh")}
            </Button>
          </div>
        ) : null}

        {publication.errors.mutation ? (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {publication.errors.mutation.message}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PublicationReadinessCard
          readiness={publication.readiness}
          error={publication.errors.readiness}
          canMutate={canMutate}
          isMutating={publication.isMutating}
          onPublishNow={() => setDialogMode("now")}
          onSchedule={() => setDialogMode("schedule")}
          onRetry={() => void publication.reload()}
        />
        <AudiencePreviewCard
          preview={publication.audiencePreview}
          error={publication.errors.audiencePreview}
          onRetry={() => void publication.reload()}
        />
      </div>

      <PublicationHistoryPanel
        history={publication.history}
        error={publication.errors.history}
        canMutate={canMutate}
        isMutating={publication.isMutating}
        onPageChange={publication.setHistoryPage}
        onRetry={() => void publication.reload()}
        onViewDetail={setSelectedPublicationId}
        onUnschedule={publication.unschedule}
        onCancel={publication.cancel}
        onStartRevision={publication.startRevision}
      />

      <PublicationDialog
        isOpen={dialogMode !== null}
        mode={dialogMode ?? "now"}
        contentType={content.type}
        showMinorUpdateOption={
          content.latestPublicationId !== null && content.status === "DRAFT"
        }
        isMutating={publication.isMutating}
        onClose={() => setDialogMode(null)}
        onSubmit={(draft) => void submitPublication(draft)}
      />

      <PublicationDetailModal
        isOpen={selectedPublicationId !== null}
        publicationId={selectedPublicationId}
        detail={publication.detail}
        error={publication.errors.detail}
        isLoading={publication.isDetailLoading}
        onLoad={publication.loadDetail}
        onClose={closeDetail}
      />
    </section>
  );
}
