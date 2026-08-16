"use client";

import { AlertTriangle, Award, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import type {
  RiskFlag,
  Student,
} from "@/features/students-guardians/students/types";
import { getRiskFlagColor } from "@/features/students-guardians/students/utils/studentUtils";

interface OverviewTabProps {
  student: Student;
}

export default function OverviewTab({ student }: OverviewTabProps) {
  const t = useTranslations("students_guardians.profile.overview");
  const attendanceRate = student.attendance_percentage;
  const currentAverage = student.current_average;
  const hasSummary =
    attendanceRate != null ||
    currentAverage != null ||
    Boolean(student.risk_flags?.length);

  const getRiskLabel = (flag: string) => {
    switch (flag) {
      case "attendance":
        return t("risk_flags.low_attendance");
      case "grades":
        return t("risk_flags.low_grades");
      case "behavior":
        return t("risk_flags.behavior_issues");
      default:
        return flag;
    }
  };

  if (!hasSummary) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm">
        <p className="text-gray-500">{t("empty_state")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {student.risk_flags && student.risk_flags.length > 0 ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div className="flex-1">
              <h3 className="mb-2 text-sm font-semibold text-red-900">
                {t("risk_flags_alert")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {student.risk_flags.map((flag: RiskFlag) => (
                  <span
                    key={flag}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getRiskFlagColor(flag)}`}
                  >
                    {getRiskLabel(flag)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {attendanceRate != null ? (
          <KPICardV2
            title={t("attendance")}
            value={`${attendanceRate}%`}
            subtitle={
              attendanceRate >= 90
                ? t("excellent")
                : t("needs_attention")
            }
            icon={TrendingUp}
            iconColor={attendanceRate >= 90 ? "#10b981" : "#f59e0b"}
            iconBgColor={attendanceRate >= 90 ? "#d1fae5" : "#fef3c7"}
            showChart={false}
          />
        ) : null}

        {currentAverage != null ? (
          <KPICardV2
            title={t("current_average")}
            value={`${currentAverage}%`}
            subtitle={
              currentAverage >= 85 ? t("good_standing") : t("at_risk")
            }
            icon={Award}
            iconColor={currentAverage >= 85 ? "#3b82f6" : "#ef4444"}
            iconBgColor={currentAverage >= 85 ? "#dbeafe" : "#fee2e2"}
            showChart={false}
          />
        ) : null}
      </div>
    </div>
  );
}
