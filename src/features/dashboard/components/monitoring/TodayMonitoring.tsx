"use client";

import { Clock, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DashboardMonitoringItem } from "@/features/dashboard/utils/dashboardStatsCalculator";

interface TodayMonitoringProps {
  classes: DashboardMonitoringItem[];
  exams: DashboardMonitoringItem[];
}

export default function TodayMonitoring({
  classes,
  exams,
}: TodayMonitoringProps) {
  const t = useTranslations("monitoring");
  return (
    <div className="bg-white rounded-xl border border-border p-4 shadow-(--main-box-shadow) h-full">
      <h3 className="text-base font-bold text-gray-900 mb-4">{t("title")}</h3>

      <div className="space-y-4">
        {/* Classes */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary-600" />
            <h4 className="text-sm font-semibold text-gray-700">
              {t("classes")}
            </h4>
          </div>
          <div className="space-y-2">
            {classes.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50"
              >
                <span className="text-xs font-medium text-gray-500 w-12">
                  {item.time}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500">{item.subtitle}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    item.status === "ongoing"
                      ? "bg-emerald-100 text-emerald-600"
                      : item.status === "completed"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {t("status." + item.status)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Exams */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-primary-600" />
            <h4 className="text-sm font-semibold text-gray-700">
              {t("exams")}
            </h4>
          </div>
          <div className="space-y-2">
            {exams.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50"
              >
                <span className="text-xs font-medium text-gray-500 w-12">
                  {item.time}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500">{item.subtitle}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    item.status === "ongoing"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {t("status." + item.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
