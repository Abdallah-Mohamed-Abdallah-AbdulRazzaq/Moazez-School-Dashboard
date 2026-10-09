"use client";

import { CalendarClock, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import { publicationBlockingReasonKey } from "../../model/academicContentPublicationPolicy";
import type { AcademicContentUiError } from "../../services/academicContentErrors";
import type { AcademicContentPublicationReadinessResponse } from "../../types/contracts";

interface PublicationReadinessCardProps {
  readiness: AcademicContentPublicationReadinessResponse | null;
  error: AcademicContentUiError | null;
  canMutate: boolean;
  isMutating: boolean;
  onPublishNow: () => void;
  onSchedule: () => void;
  onRetry: () => void;
}

interface CapabilityStateProps {
  available: boolean;
  availableLabel: string;
  unavailableLabel: string;
}

function CapabilityState({
  available,
  availableLabel,
  unavailableLabel,
}: CapabilityStateProps) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg border px-4 py-3 ${
        available
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      {available ? (
        <CheckCircle2 aria-hidden="true" className="size-5 shrink-0" />
      ) : (
        <XCircle aria-hidden="true" className="size-5 shrink-0" />
      )}
      <span className="text-sm font-medium">
        {available ? availableLabel : unavailableLabel}
      </span>
    </div>
  );
}

export default function PublicationReadinessCard({
  readiness,
  error,
  canMutate,
  isMutating,
  onPublishNow,
  onSchedule,
  onRetry,
}: PublicationReadinessCardProps) {
  const t = useAcademicContentTranslations("publication");
  const canPublish = readiness?.canPublish === true;
  const canSchedule = readiness?.canSchedule === true;

  return (
    <section
      aria-labelledby="publication-readiness-heading"
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3
            id="publication-readiness-heading"
            className="text-base font-semibold text-gray-900"
          >
            {t("readiness_title")}
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            {t("readiness_description")}
          </p>
        </div>
        {canMutate ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!canPublish || isMutating}
              loading={isMutating}
              onClick={onPublishNow}
            >
              {t("publish_now")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!canSchedule || isMutating}
              leftIcon={<CalendarClock aria-hidden="true" className="size-4" />}
              onClick={onSchedule}
            >
              {t("schedule")}
            </Button>
          </div>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error.message}</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw aria-hidden="true" className="size-4" />}
            onClick={onRetry}
          >
            {t("retry")}
          </Button>
        </div>
      ) : null}

      {readiness ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <CapabilityState
            available={canPublish}
            availableLabel={t("publish_available")}
            unavailableLabel={t("publish_unavailable")}
          />
          <CapabilityState
            available={canSchedule}
            availableLabel={t("schedule_available")}
            unavailableLabel={t("schedule_unavailable")}
          />
        </div>
      ) : null}

      {readiness?.blockingReasons.length ? (
        <ul className="mt-4 space-y-2">
          {readiness.blockingReasons.map((reason, index) => (
            <li
              key={`${reason}:${index}`}
              className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
            >
              {t(`reasons.${publicationBlockingReasonKey(reason)}`)}
            </li>
          ))}
        </ul>
      ) : null}

      {!canMutate ? (
        <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
          {t("publish_permission_missing")}
        </p>
      ) : null}
    </section>
  );
}
