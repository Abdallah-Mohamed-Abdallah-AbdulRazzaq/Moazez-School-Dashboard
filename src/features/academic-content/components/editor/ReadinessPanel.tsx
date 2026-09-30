"use client";

import { useState } from "react";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { academicContentUiError } from "../../services/academicContentErrors";
import type { AcademicContentReadinessResponse } from "../../types/contracts";

interface ReadinessPanelProps {
  readiness: AcademicContentReadinessResponse | null;
  onRefresh: () => Promise<unknown>;
}

export default function ReadinessPanel({
  readiness,
  onRefresh,
}: ReadinessPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await onRefresh();
    } catch (refreshError) {
      setError(academicContentUiError(refreshError).message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isReady = readiness?.canAdvance === true;

  return (
    <section
      id="readiness"
      aria-labelledby="readiness-heading"
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="readiness-heading" className="text-lg font-semibold text-gray-900">
            Readiness
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Server-authoritative checks for whether this content can advance.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={isRefreshing}
          leftIcon={<RefreshCw aria-hidden="true" className="size-4" />}
          onClick={() => void refresh()}
        >
          Refresh readiness
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div
        role="status"
        className={`mt-5 flex items-center gap-3 rounded-lg border px-4 py-3 ${
          isReady
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        {isReady ? (
          <CheckCircle2 aria-hidden="true" className="size-5 shrink-0" />
        ) : (
          <XCircle aria-hidden="true" className="size-5 shrink-0" />
        )}
        <span className="font-medium">
          {isReady ? "Ready" : readiness ? "Incomplete" : "Readiness unavailable"}
        </span>
      </div>

      {readiness && readiness.blockingReasons.length > 0 && (
        <ul className="mt-4 space-y-3" aria-live="polite">
          {readiness.blockingReasons.map((reason, index) => (
            <li
              key={`${reason.code}:${index}`}
              className="rounded-lg border border-gray-200 px-4 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {reason.code}
              </p>
              <p className="mt-1 text-sm text-gray-800">{reason.message}</p>
              {reason.details !== undefined && (
                <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-600">
                  {JSON.stringify(reason.details, null, 2)}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
