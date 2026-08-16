"use client";

import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import type { Student } from "@/features/students-guardians/students/types";

interface AttendanceTabProps {
  student: Student;
}

export default function AttendanceTab({ student }: AttendanceTabProps) {
  const t = useTranslations("students_guardians.profile.attendance");
  const attendanceRate = student.attendance_percentage;

  if (attendanceRate === undefined || attendanceRate === null) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm">
        <p className="text-gray-500">{t("empty_state")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICardV2
        title={t("attendance_rate")}
        value={`${attendanceRate}%`}
        subtitle={t("this_semester")}
        icon={TrendingUp}
        iconColor="#10b981"
        iconBgColor="#d1fae5"
        showChart={false}
      />
    </div>
  );
}
