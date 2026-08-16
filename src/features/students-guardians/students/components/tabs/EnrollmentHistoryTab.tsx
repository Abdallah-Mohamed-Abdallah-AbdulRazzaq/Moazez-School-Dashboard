"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  Student,
  StudentEnrollment,
} from "@/features/students-guardians/students/types";
import {
  fetchCurrentEnrollment,
  fetchEnrollmentHistory,
} from "@/features/students-guardians/enrollments/services/enrollmentsApiService";
import { useTranslations } from "next-intl";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import StudentTabSkeleton from "@/features/students-guardians/students/components/StudentTabSkeleton";

interface EnrollmentHistoryTabProps {
  student: Student;
}

export default function EnrollmentHistoryTab({
  student,
}: EnrollmentHistoryTabProps) {
  const t = useTranslations("students_guardians.profile.enrollment_history");
  const [enrollment, setEnrollment] = useState<StudentEnrollment | null>(null);
  const [enrollmentHistory, setEnrollmentHistory] = useState<
    StudentEnrollment[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [current, history] = await Promise.all([
          fetchCurrentEnrollment({ studentId: student.id }),
          fetchEnrollmentHistory(student.id),
        ]);
        if (isCancelled) return;
        setEnrollment(current);
        setEnrollmentHistory(history);
      } catch (loadError) {
        if (isCancelled) return;
        setEnrollment(null);
        setEnrollmentHistory([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load enrollment.",
        );
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [student.id]);

  const getStatusIcon = (status: StudentEnrollment["status"]) => {
    switch (status) {
      case "active":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "withdrawn":
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: StudentEnrollment["status"]) => {
    const statusConfig = {
      active: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      withdrawn: "bg-red-100 text-red-700",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const currentPlacement = [
    enrollment?.grade,
    enrollment?.section,
    enrollment?.classroom,
  ]
    .filter(Boolean)
    .join(" • ");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return <StudentTabSkeleton variant="timeline" />;
  }

  if (enrollmentHistory.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 shadow-sm text-center">
        <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">{t("no_history")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("summary")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICardV2
            title={t("total_years")}
            value={enrollmentHistory.length}
            icon={Calendar}
            iconColor="#3b82f6"
            iconBgColor="#dbeafe"
            showChart={false}
          />
          <KPICardV2
            title={t("completed")}
            value={
              enrollmentHistory.filter((item) => item.status === "completed")
                .length
            }
            icon={CheckCircle}
            iconColor="#10b981"
            iconBgColor="#d1fae5"
            showChart={false}
          />
          <KPICardV2
            title={t("current_grade")}
            value={currentPlacement || t("na")}
            icon={GraduationCap}
            iconColor="#8b5cf6"
            iconBgColor="#ede9fe"
            showChart={false}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {t("timeline")}
        </h3>
        <div className="space-y-6">
          {enrollmentHistory.map((historyEntry, index) => (
            <div key={historyEntry.enrollmentId} className="relative">
              {index < enrollmentHistory.length - 1 && (
                <div className="absolute left-[18px] top-12 bottom-0 w-0.5 bg-gray-200" />
              )}

              <div className="flex gap-4">
                <div className="relative z-10 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                    {getStatusIcon(historyEntry.status)}
                  </div>
                </div>

                <div className="flex-1 pb-8">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base font-semibold text-gray-900">
                            {historyEntry.academicYear}
                          </h4>
                          {historyEntry.status === "active" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {t("current")}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {t("enrollment_id")}: {historyEntry.enrollmentId}
                        </p>
                      </div>
                      {getStatusBadge(historyEntry.status)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          {t("grade")}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {historyEntry.grade}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          {t("section")}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {historyEntry.section}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          {t("classroom")}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {historyEntry.classroom || t("na")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          {t("enrollment_date")}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(historyEntry.enrollmentDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("grade_progression")}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {enrollmentHistory.map((historyEntry, index) => (
            <div key={historyEntry.enrollmentId} className="flex items-center">
              <div className="px-4 py-2 rounded-lg font-medium text-sm bg-primary text-white">
                {historyEntry.grade}
                <span className="text-xs ml-1 opacity-75">
                  ({historyEntry.academicYear.split("-")[0]})
                </span>
              </div>
              {index < enrollmentHistory.length - 1 && (
                <div className="mx-2 text-gray-400">→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
