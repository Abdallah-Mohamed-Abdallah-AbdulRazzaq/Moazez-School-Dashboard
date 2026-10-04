"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Eye, History, RotateCcw, X } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import {
  canCancelPublication,
  canUnschedulePublication,
} from "../../model/academicContentPublicationPolicy";
import type { AcademicContentUiError } from "../../services/academicContentErrors";
import type {
  AcademicContentPublication,
  AcademicContentPublicationHistoryResponse,
} from "../../types/contracts";
import PublicationStatusBadge from "./PublicationStatusBadge";

interface PublicationHistoryPanelProps {
  history: AcademicContentPublicationHistoryResponse | null;
  error: AcademicContentUiError | null;
  canMutate: boolean;
  isMutating: boolean;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onViewDetail: (publicationId: string) => void;
  onUnschedule: (publicationId: string) => Promise<unknown> | unknown;
  onCancel: (publicationId: string) => Promise<unknown> | unknown;
}

interface PendingLifecycleAction {
  kind: "unschedule" | "cancel";
  publicationId: string;
}

interface PublicationHistoryItemProps {
  publication: AcademicContentPublication;
  canMutate: boolean;
  isMutating: boolean;
  formatDate: (value: string) => string;
  onViewDetail: (publicationId: string) => void;
  onLifecycleAction: (action: PendingLifecycleAction) => void;
}

function PublicationHistoryItem({
  publication,
  canMutate,
  isMutating,
  formatDate,
  onViewDetail,
  onLifecycleAction,
}: PublicationHistoryItemProps) {
  const t = useAcademicContentTranslations("publication");
  const showUnschedule =
    canMutate && canUnschedulePublication(publication.status);
  const showCancel = canMutate && canCancelPublication(publication.status);

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <PublicationStatusBadge status={publication.status} />
          <p className="mt-2 text-sm text-gray-700">
            <span className="font-medium">{t("publish_at")}:</span>{" "}
            <time dateTime={publication.publishAt}>
              {formatDate(publication.publishAt)}
            </time>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            leftIcon={<Eye aria-hidden="true" className="size-4" />}
            onClick={() => onViewDetail(publication.publicationId)}
          >
            {t("view_detail")}
          </Button>
          {showUnschedule ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isMutating}
              leftIcon={<RotateCcw aria-hidden="true" className="size-4" />}
              onClick={() =>
                onLifecycleAction({
                  kind: "unschedule",
                  publicationId: publication.publicationId,
                })
              }
            >
              {t("unschedule")}
            </Button>
          ) : null}
          {showCancel ? (
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={isMutating}
              leftIcon={<X aria-hidden="true" className="size-4" />}
              onClick={() =>
                onLifecycleAction({
                  kind: "cancel",
                  publicationId: publication.publicationId,
                })
              }
            >
              {t("cancel_publication")}
            </Button>
          ) : null}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-gray-500">{t("visible_from")}</dt>
          <dd className="mt-1 text-sm text-gray-800">
            <time dateTime={publication.visibleFrom}>
              {formatDate(publication.visibleFrom)}
            </time>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">{t("visible_until")}</dt>
          <dd className="mt-1 text-sm text-gray-800">
            {publication.visibleUntil ? (
              <time dateTime={publication.visibleUntil}>
                {formatDate(publication.visibleUntil)}
              </time>
            ) : (
              t("no_visibility_end")
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">{t("students")}</dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums text-gray-900">
            {publication.studentRecipientCount}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">{t("guardian_contexts")}</dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums text-gray-900">
            {publication.guardianRecipientContextCount}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export default function PublicationHistoryPanel({
  history,
  error,
  canMutate,
  isMutating,
  onPageChange,
  onRetry,
  onViewDetail,
  onUnschedule,
  onCancel,
}: PublicationHistoryPanelProps) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("publication");
  const commonT = useAcademicContentTranslations("common");
  const [pendingAction, setPendingAction] =
    useState<PendingLifecycleAction | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const totalPages = history
    ? Math.max(1, Math.ceil(history.total / history.limit))
    : 1;
  const confirmationLocked = isMutating || isConfirming;

  const closeConfirmation = () => {
    if (!confirmationLocked) setPendingAction(null);
  };

  const confirmLifecycleAction = async () => {
    if (!pendingAction) return;
    setIsConfirming(true);
    try {
      if (pendingAction.kind === "unschedule") {
        await onUnschedule(pendingAction.publicationId);
      } else {
        await onCancel(pendingAction.publicationId);
      }
      setPendingAction(null);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <section
      aria-labelledby="publication-history-heading"
      className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <History aria-hidden="true" className="mt-0.5 size-5 text-primary" />
        <div>
          <h3
            id="publication-history-heading"
            className="text-base font-semibold text-gray-900"
          >
            {t("history_title")}
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            {t("history_description")}
          </p>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error.message}</span>
          <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
            {t("retry")}
          </Button>
        </div>
      ) : null}

      {!history && !error ? (
        <div className="flex min-h-36 items-center justify-center">
          <PartialLoader />
        </div>
      ) : history?.items.length ? (
        <div className="mt-5 space-y-3">
          {history.items.map((publication) => (
            <PublicationHistoryItem
              key={publication.publicationId}
              publication={publication}
              canMutate={canMutate}
              isMutating={isMutating}
              formatDate={(value) => formatter.format(new Date(value))}
              onViewDetail={onViewDetail}
              onLifecycleAction={setPendingAction}
            />
          ))}
        </div>
      ) : history ? (
        <EmptyState
          icon={<History aria-hidden="true" className="size-9" />}
          message={t("history_empty")}
          className="mt-4 rounded-lg border border-dashed border-gray-300 bg-white"
        />
      ) : null}

      {history && history.total > history.limit ? (
        <div className="mt-5 flex items-center justify-between gap-3">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            aria-label={t("previous_page")}
            disabled={history.page <= 1}
            onClick={() => onPageChange(Math.max(1, history.page - 1))}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>
          <span className="text-sm text-gray-600">
            {t("page", { page: history.page, total: totalPages })}
          </span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            aria-label={t("next_page")}
            disabled={history.page >= totalPages}
            onClick={() => onPageChange(history.page + 1)}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={pendingAction?.kind === "unschedule"}
        onClose={closeConfirmation}
        onConfirm={() => void confirmLifecycleAction()}
        title={t("unschedule_title")}
        description={t("unschedule_description")}
        confirmLabel={t("confirm_unschedule")}
        cancelLabel={commonT("cancel")}
        loading={confirmationLocked}
        severity="warning"
      />
      <ConfirmDialog
        isOpen={pendingAction?.kind === "cancel"}
        onClose={closeConfirmation}
        onConfirm={() => void confirmLifecycleAction()}
        title={t("cancel_title")}
        description={t("cancel_description")}
        confirmLabel={t("confirm_cancel")}
        cancelLabel={commonT("cancel")}
        loading={confirmationLocked}
        severity="danger"
      />
    </section>
  );
}
