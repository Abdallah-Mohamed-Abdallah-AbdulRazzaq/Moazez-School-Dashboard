"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { AccessDenied, Button } from "@/components/ui";
import type { TimetableSetupStatus } from "@/features/academics/timetable/services/timetableSetupStatus";

export function TimetableSetupLoadError({
  onRetry,
}: {
  onRetry: () => Promise<void>;
}) {
  const t = useTranslations("academics.timetable");
  return (
    <div className="flex min-h-[24rem] items-center justify-center p-6">
      <div role="alert" className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-600" aria-hidden="true" />
        <p className="mt-3 text-sm text-gray-700">{t("setup.loadError")}</p>
        <Button className="mt-5" onClick={() => void onRetry()}>
          {t("setup.retry")}
        </Button>
      </div>
    </div>
  );
}

export function TimetableSetupBlocker({
  status,
}: {
  status: Extract<TimetableSetupStatus, { kind: "read_only" }>;
}) {
  const t = useTranslations("academics.timetable");
  const message = t(
    status.reason === "closed_term"
      ? "setup.readOnly.closedTerm"
      : "setup.readOnly.missingPermission",
  );

  if (status.reason === "missing_permission") {
    return (
      <AccessDenied
        className="max-w-xl"
        title={t("setup.title")}
        description={message}
        requiredPermissions={["academics.structure.manage"]}
      />
    );
  }

  return (
    <div className="flex min-h-[24rem] items-center justify-center p-6">
      <div role="alert" className="max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-950">
        <AlertTriangle className="mx-auto h-8 w-8" aria-hidden="true" />
        <p className="mt-3 text-sm">{message}</p>
      </div>
    </div>
  );
}
