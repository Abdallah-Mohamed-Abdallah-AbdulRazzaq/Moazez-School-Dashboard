"use client";

import { useEffect } from "react";
import { FileClock } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import Modal from "@/components/ui/modal/Modal";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { AcademicContentUiError } from "../../services/academicContentErrors";
import type { AcademicContentPublication } from "../../types/contracts";
import PublicationStatusBadge from "./PublicationStatusBadge";

interface PublicationDetailModalProps {
  isOpen: boolean;
  publicationId: string | null;
  detail: AcademicContentPublication | null;
  error: AcademicContentUiError | null;
  isLoading: boolean;
  onLoad: (publicationId: string) => Promise<unknown> | unknown;
  onClose: () => void;
}

interface DetailItemProps {
  label: string;
  children: React.ReactNode;
}

function DetailItem({ label, children }: DetailItemProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-gray-900">{children}</dd>
    </div>
  );
}

export default function PublicationDetailModal({
  isOpen,
  publicationId,
  detail,
  error,
  isLoading,
  onLoad,
  onClose,
}: PublicationDetailModalProps) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("publication");
  const contentT = useAcademicContentTranslations();
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const formatInstant = (value: string | null) =>
    value ? (
      <time dateTime={value}>{formatter.format(new Date(value))}</time>
    ) : (
      t("not_available")
    );

  useEffect(() => {
    if (isOpen && publicationId) void onLoad(publicationId);
  }, [isOpen, onLoad, publicationId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("detail_title")}
      icon={<FileClock aria-hidden="true" className="size-6" />}
      size="lg"
    >
      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center">
          <PartialLoader />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="my-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <p>{error.message || t("detail_unavailable")}</p>
          {publicationId ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={() => void onLoad(publicationId)}
            >
              {t("retry")}
            </Button>
          ) : null}
        </div>
      ) : detail ? (
        <div className="space-y-5 py-2">
          <dl className="grid gap-3 sm:grid-cols-2">
            <DetailItem label={t("publication_id")}>
              {detail.publicationId}
            </DetailItem>
            <DetailItem label={t("revision")}>{detail.revisionId}</DetailItem>
            <DetailItem label={t("publication_status")}>
              <PublicationStatusBadge status={detail.status} />
            </DetailItem>
            <DetailItem label={t("source_status")}>
              {contentT(`statuses.${detail.sourceContentStatus}`)}
            </DetailItem>
            <DetailItem label={t("publish_at")}>
              {formatInstant(detail.publishAt)}
            </DetailItem>
            <DetailItem label={t("visible_from")}>
              {formatInstant(detail.visibleFrom)}
            </DetailItem>
            <DetailItem label={t("visible_until")}>
              {formatInstant(detail.visibleUntil)}
            </DetailItem>
            <DetailItem label={t("created_at")}>
              {formatInstant(detail.createdAt)}
            </DetailItem>
            <DetailItem label={t("published_at")}>
              {formatInstant(detail.publishedAt)}
            </DetailItem>
            <DetailItem label={t("expired_at")}>
              {formatInstant(detail.expiredAt)}
            </DetailItem>
            <DetailItem label={t("cancelled_at")}>
              {formatInstant(detail.cancelledAt)}
            </DetailItem>
            <DetailItem label={t("cancellation_reason")}>
              {detail.cancellationReason
                ? t(`cancellation_reasons.${detail.cancellationReason}`)
                : t("not_available")}
            </DetailItem>
            <DetailItem label={t("supersedes_publication_id")}>
              {detail.supersedesPublicationId ?? t("not_available")}
            </DetailItem>
            <DetailItem label={t("change_significance")}>
              {detail.changeSignificance
                ? t(`change_significance_values.${detail.changeSignificance}`)
                : t("not_available")}
            </DetailItem>
            <DetailItem label={t("notify_minor_update_audit")}>
              {t(detail.notifyMinorUpdate ? "yes" : "no")}
            </DetailItem>
            <DetailItem label={t("created_by")}>
              {detail.createdByUserId}
            </DetailItem>
          </dl>

          <section
            aria-labelledby="publication-recipient-counts-heading"
            className="rounded-xl border border-blue-200 bg-blue-50 p-4"
          >
            <h3
              id="publication-recipient-counts-heading"
              className="text-sm font-semibold text-blue-900"
            >
              {t("recipient_counts")}
            </h3>
            <p className="mt-1 text-xs leading-5 text-blue-800">
              {t("historical_snapshot_disclaimer")}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs text-blue-700">{t("students")}</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums text-blue-950">
                  {detail.studentRecipientCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-blue-700">
                  {t("guardian_contexts")}
                </dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums text-blue-950">
                  {detail.guardianRecipientContextCount}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-gray-500">
          {t("detail_unavailable")}
        </p>
      )}
    </Modal>
  );
}
