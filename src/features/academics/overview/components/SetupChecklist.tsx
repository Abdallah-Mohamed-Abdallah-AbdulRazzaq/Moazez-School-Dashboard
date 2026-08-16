"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { CheckCircle2, AlertCircle, XCircle, ArrowRight } from "lucide-react";
import Button from "@/components/ui/button/Button";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import type { ChecklistItem } from "../services/overviewService";
import type { AcademicsOverviewResponse } from "../services/overviewApiAdapter";

interface SetupChecklistProps {
  items: ChecklistItem[];
  response?: AcademicsOverviewResponse;
  isLoading?: boolean;
}

export default function SetupChecklist({ items, response, isLoading }: SetupChecklistProps) {
  const t = useTranslations();

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex min-h-[220px] items-center justify-center">
          <PartialLoader />
        </div>
      </div>
    );
  }

  if (!response) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case "warning":
        return <AlertCircle className="w-6 h-6 text-amber-600" />;
      case "error":
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-50 border-green-200 hover:bg-green-100";
      case "warning":
        return "bg-amber-50 border-amber-200 hover:bg-amber-100";
      case "error":
        return "bg-red-50 border-red-200 hover:bg-red-100";
      default:
        return "bg-gray-50 border-gray-200 hover:bg-gray-100";
    }
  };

  const doneCount = items.filter((i) => i.status === "done").length;
  const totalCount = items.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t("academics.overview.checklist.title")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t("academics.overview.checklist.progress", { done: doneCount, total: totalCount })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0}%</div>
            <div className="text-xs text-gray-500">{t("academics.overview.checklist.complete")}</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
            style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-start gap-3 p-4 border rounded-lg transition-all ${getStatusBg(
              item.status
            )}`}
          >
            <div className="flex-shrink-0 mt-0.5">{getStatusIcon(item.status)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium text-gray-900 text-sm">{t(item.titleKey)}</p>
                {item.status !== "done" && (
                  <Link href={item.link}>
                    <Button variant="secondary" size="sm" className="h-7 px-2 text-xs" leftIcon={<ArrowRight className="w-3 h-3 ml-1" />}> 
                      {t("academics.overview.checklist.fix")}
                    </Button>
                  </Link>
                )}
              </div>
              <p className="text-xs text-gray-600">{t(item.descriptionKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
