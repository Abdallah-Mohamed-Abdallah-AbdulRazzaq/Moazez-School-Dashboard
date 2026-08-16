"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { DashboardViewAlert } from "@/features/dashboard/mappers/dashboardViewMapper";

interface CriticalAlertsProps {
  alerts: DashboardViewAlert[];
}

export default function CriticalAlerts({ alerts }: CriticalAlertsProps) {
  const t = useTranslations("critical_alerts");
  const locale = useLocale();
  const pathname = usePathname();
  const severityStyles: Record<DashboardViewAlert["severity"], string> = {
    critical: "bg-red-50 border-red-500",
    warning: "bg-amber-50 border-amber-500",
    info: "bg-blue-50 border-blue-500",
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-border shadow-(--main-box-shadow) h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          {t("title")}
        </h3>

        <button className="text-xs text-primary-600 hover:underline">
          {t("view_all")}
        </button>
      </div>

      <div className="space-y-2">
        {alerts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
            <p className="text-sm font-medium text-gray-700">No active alerts</p>
            <p className="mt-1 text-xs text-gray-500">
              Computed operational alerts will appear here when counts are non-zero.
            </p>
          </div>
        ) : null}

        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-3 rounded-lg border-l-4 ${severityStyles[alert.severity]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {alert.title}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {alert.description}
                </p>
              </div>

              {alert.actionLabel && alert.actionTarget ? (
                <Link
                  href={localizedPath(pathname, alert.actionTarget)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                >
                  {alert.actionLabel}
                  {locale === "ar" ? (
                    <ArrowLeft className="h-3 w-3" />
                  ) : (
                    <ArrowRight className="h-3 w-3" />
                  )}
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function localizedPath(pathname: string, targetPath: string) {
  const localePrefix = pathname.split("/")[1];

  if (targetPath.startsWith(`/${localePrefix}/`)) {
    return targetPath;
  }

  return `/${localePrefix}${targetPath.startsWith("/") ? "" : "/"}${targetPath}`;
}
