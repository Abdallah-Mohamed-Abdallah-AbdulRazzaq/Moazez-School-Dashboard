"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, RefreshCw, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { buildLocalePath } from "@/lib/routing/localePath";
import type { Decision } from "@/features/admissions/types/admissions";
import { fetchDecisionById } from "@/features/admissions/decisions/services/decisionsApiService";

interface DecisionDetailsDrawerProps {
  decisionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function getStatus(error: unknown): number | undefined {
  return error && typeof error === "object" && "status" in error
    ? (error as { status?: number }).status
    : undefined;
}

export default function DecisionDetailsDrawer({
  decisionId,
  isOpen,
  onClose,
}: DecisionDetailsDrawerProps) {
  const t = useTranslations("admissions.decisions.details");
  const locale = useLocale();
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    if (!isOpen || !decisionId) return;

    let active = true;

    void Promise.resolve()
      .then(() => {
        if (!active) return;
        setDecision(null);
        setErrorStatus(null);
        setIsLoading(true);
        return fetchDecisionById(decisionId);
      })
      .then((result) => {
        if (active && result) setDecision(result);
      })
      .catch((error: unknown) => {
        if (active) setErrorStatus(getStatus(error) ?? 0);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [decisionId, isOpen, requestVersion]);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !decisionId) return null;

  const statusStyles = {
    accept: "bg-green-100 text-green-700",
    waitlist: "bg-amber-100 text-amber-700",
    reject: "bg-red-100 text-red-700",
  };
  const errorKey =
    errorStatus === 403
      ? "errors.forbidden"
      : errorStatus === 404
        ? "errors.not_found"
        : "errors.generic";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        className={`absolute inset-y-0 flex w-full max-w-lg flex-col bg-white shadow-2xl ${locale === "ar" ? "left-0" : "right-0"}`}
        dir={locale === "ar" ? "rtl" : "ltr"}
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2
            id="decision-details-title"
            className="text-xl font-bold text-gray-900"
          >
            {t("title")}
          </h2>
          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 text-gray-500"
            aria-label={t("close")}
          >
            <X className="h-5 w-5" />
          </Button>
        </header>

        <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
          {isLoading && (
            <div
              className="flex flex-1 items-center justify-center gap-3 text-gray-500"
              role="status"
            >
              <PartialLoader size={28} />
              <span>{t("loading")}</span>
            </div>
          )}

          {!isLoading && errorStatus !== null && (
            <div
              className="flex flex-1 flex-col items-center justify-center gap-4 text-center"
              role="alert"
            >
              <p className="text-gray-700">{t(errorKey)}</p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setRequestVersion((value) => value + 1)}
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                {t("retry")}
              </Button>
            </div>
          )}

          {!isLoading && decision && (
            <>
              <dl className="space-y-5">
                <Detail
                  label={t("student_name")}
                  value={decision.studentName || t("not_available")}
                />
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    {t("decision")}
                  </dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusStyles[decision.decision]}`}
                    >
                      {t(`statuses.${decision.decision}`)}
                    </span>
                  </dd>
                </div>
                {decision.applicationStatus && (
                  <Detail
                    label={t("application_status")}
                    value={decision.applicationStatus}
                  />
                )}
                <Detail
                  label={t("reason")}
                  value={decision.reason || t("no_reason")}
                />
                <Detail
                  label={t("decided_by")}
                  value={decision.decidedBy || t("not_available")}
                />
                <Detail
                  label={t("decision_date")}
                  value={
                    decision.decisionDate
                      ? new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(decision.decisionDate))
                      : t("not_available")
                  }
                />
              </dl>

              <Button
                type="button"
                onClick={() =>
                  router.push(
                    buildLocalePath(
                      locale,
                      "admissions",
                      "applications",
                      decision.applicationId,
                    ),
                  )
                }
                className="mt-auto"
                rightIcon={
                  <ArrowRight
                    className={`h-4 w-4 ${locale === "ar" ? "rotate-180" : ""}`}
                  />
                }
              >
                {t("open_application")}
              </Button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
        {value}
      </dd>
    </div>
  );
}
