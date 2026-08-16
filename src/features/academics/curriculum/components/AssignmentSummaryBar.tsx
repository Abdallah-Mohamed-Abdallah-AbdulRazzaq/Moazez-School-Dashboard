"use client";

import { useTranslations } from "next-intl";
import { CheckCircle, AlertCircle, Zap } from "lucide-react";
import Button from "@/components/ui/button/Button";

interface AssignmentSummaryBarProps {
  maxScore: number | undefined;
  totalPoints: number;
  difference: number;
  isMatch: boolean;
  canAutoDistribute: boolean;
  onAutoDistribute: () => void;
  isReadOnly: boolean;
}

export default function AssignmentSummaryBar({
  maxScore,
  totalPoints,
  difference,
  isMatch,
  canAutoDistribute,
  onAutoDistribute,
}: AssignmentSummaryBarProps) {
  const t = useTranslations("academics.curriculum.assignments");

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Metrics */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Max Score */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">{t("summary.maxScore")}:</span>
            <span className="text-sm font-semibold text-gray-900">
              {maxScore ?? "—"}
            </span>
          </div>

          {/* Total Points */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">{t("summary.sumPoints")}:</span>
            <span className="text-sm font-semibold text-gray-900">
              {totalPoints}
            </span>
          </div>

          {/* Difference */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">{t("summary.difference")}:</span>
            <span
              className={`text-sm font-semibold ${
                isMatch ? "text-green-600" : "text-orange-600"
              }`}
            >
              {difference > 0 ? "+" : ""}
              {difference}
            </span>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-1.5">
            {isMatch ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-600 px-2 py-1 bg-green-50 rounded-full">
                  {t("pointsMatch")}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-medium text-orange-600 px-2 py-1 bg-orange-50 rounded-full">
                  {t("pointsMismatch")}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Auto Distribute Button */}
        {canAutoDistribute && !isMatch && (
          <Button
            onClick={onAutoDistribute}
            variant="primary"
            size="sm"
            leftIcon={<Zap className="w-4 h-4" />}
          >
            {t("auto_distribute")}
          </Button>
        )}
      </div>
    </div>
  );
}
