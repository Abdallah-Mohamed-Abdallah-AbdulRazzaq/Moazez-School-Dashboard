"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  HardDrive,
  Mail,
  Radio,
  RefreshCw,
  Server,
  XCircle,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import MainLoader from "@/components/ui/loaders/MainLoader";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import { fetchHealthReport } from "@/features/settings/health/services/healthService";
import type {
  HealthCheckKey,
  HealthCheckStatus,
  HealthDependencyCheck,
  HealthQueueReadiness,
  HealthReport,
} from "@/features/settings/health/types";

const checkOrder: HealthCheckKey[] = [
  "db",
  "redis",
  "storage",
  "queues",
  "email",
  "push",
];

const statusStyles: Record<HealthCheckStatus, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
  degraded: "border-amber-200 bg-amber-50 text-amber-700",
  error: "border-red-200 bg-red-50 text-red-700",
  skipped: "border-gray-200 bg-gray-50 text-gray-600",
};

const statusIcons = {
  ok: CheckCircle2,
  degraded: AlertTriangle,
  error: XCircle,
  skipped: Clock3,
};

const checkIcons = {
  db: Database,
  redis: Server,
  storage: HardDrive,
  queues: Activity,
  email: Mail,
  push: Radio,
};

const detailLabels = {
  en: {
    email: {
      activeConnections: "Active",
      readyConnections: "Ready",
      invalidConnections: "Invalid",
    },
    push: {
      mode: "Delivery mode",
      send_enabled: "Sending enabled",
      unknown: "Unknown",
    },
  },
  ar: {
    email: {
      activeConnections: "نشطة",
      readyConnections: "جاهزة",
      invalidConnections: "غير صالحة",
    },
    push: {
      mode: "وضع الإرسال",
      send_enabled: "الإرسال مفعّل",
      unknown: "غير معروف",
    },
  },
} as const;

function StatusBadge({
  status,
  label,
}: {
  status: HealthCheckStatus;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {label}
    </span>
  );
}

function getQueueDetails(
  details: HealthDependencyCheck["details"],
): HealthQueueReadiness[] {
  const queues = details?.queues;
  return Array.isArray(queues) ? (queues as HealthQueueReadiness[]) : [];
}

function getNumericDetail(
  details: HealthDependencyCheck["details"],
  key: string,
) {
  const value = details?.[key];
  return typeof value === "number" ? value : 0;
}

function HealthCheckDetails({
  checkKey,
  details,
  isArabic,
  translate,
}: {
  checkKey: HealthCheckKey;
  details: HealthDependencyCheck["details"];
  isArabic: boolean;
  translate: ReturnType<typeof useTranslations>;
}) {
  if (!details) return null;

  if (checkKey === "queues") {
    const queues = getQueueDetails(details);

    return (
      <div className="mt-4 space-y-2">
        {queues.map((queue) => (
          <div
            key={queue.name}
            className="rounded-lg border border-gray-100 bg-gray-50 p-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-[11px] text-gray-700">
                {queue.name}
              </span>
              <StatusBadge
                status={queue.status}
                label={translate(`status.${queue.status}`)}
              />
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px] text-gray-500">
              {(["waiting", "active", "delayed", "failed"] as const).map(
                (countKey) => (
                  <div key={countKey}>
                    <span className="block font-semibold text-gray-800">
                      {queue.counts?.[countKey] ?? 0}
                    </span>
                    {translate(`queues.${countKey}`)}
                  </div>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (checkKey === "email") {
    return (
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        {(
          [
            "activeConnections",
            "readyConnections",
            "invalidConnections",
          ] as const
        ).map((detailKey) => (
          <div key={detailKey} className="rounded-lg bg-gray-50 p-2">
            <dt className="text-[10px] text-gray-500">
              {detailLabels[isArabic ? "ar" : "en"].email[detailKey]}
            </dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900">
              {getNumericDetail(details, detailKey)}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  if (checkKey === "push") {
    const mode = typeof details.mode === "string" ? details.mode : "unknown";
    return (
      <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
        <span className="text-xs text-gray-500">
          {detailLabels[isArabic ? "ar" : "en"].push.mode}
        </span>
        <span className="mt-1 block font-semibold text-gray-900">
          {detailLabels[isArabic ? "ar" : "en"].push[
            mode as "send_enabled" | "unknown"
          ] ?? mode}
        </span>
      </div>
    );
  }

  return null;
}

export default function SettingsHealthPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const t = useTranslations("settings.health");
  const [report, setReport] = useState<HealthReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        setReport(await fetchHealthReport());
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : t("messages.load_failed"),
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [t],
  );

  useEffect(() => {
    void Promise.resolve().then(() => loadReport());
  }, [loadReport]);

  const queueDetails = useMemo(
    () => (report ? getQueueDetails(report.checks.queues.details) : []),
    [report],
  );

  if (isLoading) {
    return <MainLoader />;
  }

  return (
    <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
      <SettingsPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <Button
            variant="secondary"
            leftIcon={
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            }
            onClick={() => void loadReport("refresh")}
            disabled={isRefreshing}
          >
            {t("refresh")}
          </Button>
        }
      />

      {error ? (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {report ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t("summary.title")}
                  </h2>
                  <StatusBadge
                    status={report.status === "ok" ? "ok" : "degraded"}
                    label={t(`status.${report.status}`)}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {t("summary.description")}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm text-gray-600 sm:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500">
                    {t("summary.version")}
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {report.version}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500">
                    {t("summary.timestamp")}
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {new Date(report.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {checkOrder.map((key) => {
              const check = report.checks[key];
              const Icon = checkIcons[key];
              const StatusIcon = statusIcons[check.status];

              return (
                <section
                  key={key}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-gray-50 p-2 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {t(`checks.${key}`)}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {t("duration", { ms: check.durationMs })}
                        </p>
                      </div>
                    </div>
                    <StatusIcon
                      className={`h-5 w-5 ${
                        check.status === "ok"
                          ? "text-emerald-600"
                          : check.status === "degraded"
                            ? "text-amber-600"
                            : check.status === "error"
                              ? "text-red-600"
                              : "text-gray-500"
                      }`}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={check.status}
                      label={t(`status.${check.status}`)}
                    />
                    {check.message ? (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        {check.message}
                      </span>
                    ) : null}
                  </div>

                  <HealthCheckDetails
                    checkKey={key}
                    details={check.details}
                    isArabic={isArabic}
                    translate={t}
                  />
                </section>
              );
            })}
          </div>

          {queueDetails.length > 0 ? (
            <SettingsSectionCard
              title={t("queues.title")}
              description={t("queues.description")}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-center">
                        {t("queues.name")}
                      </th>
                      <th className="px-4 py-3 text-center">
                        {t("queues.status")}
                      </th>
                      <th className="px-4 py-3 text-center">
                        {t("queues.waiting")}
                      </th>
                      <th className="px-4 py-3 text-center">
                        {t("queues.active")}
                      </th>
                      <th className="px-4 py-3 text-center">
                        {t("queues.delayed")}
                      </th>
                      <th className="px-4 py-3 text-center">
                        {t("queues.failed")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {queueDetails.map((queue) => (
                      <tr key={queue.name}>
                        <td className="px-4 py-3 font-medium text-gray-900 text-center">
                          {queue.name}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge
                            status={queue.status}
                            label={t(`status.${queue.status}`)}
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-center">
                          {queue.counts?.waiting ?? 0}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-center">
                          {queue.counts?.active ?? 0}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-center">
                          {queue.counts?.delayed ?? 0}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-center">
                          {queue.counts?.failed ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SettingsSectionCard>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
