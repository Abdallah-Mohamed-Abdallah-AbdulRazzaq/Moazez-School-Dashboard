"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import StatusBadge from "@/features/admissions/shared/StatusBadge";
import InterviewRatingModal from "@/features/admissions/interviews/components/InterviewRatingModal";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { Button, EmptyState } from "@/components/ui";
import {
  fetchInterviewById,
  completeInterview,
  updateInterview,
} from "@/features/admissions/interviews/services/interviewsApiService";
import type { Interview } from "@/features/admissions/types/admissions";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import { AdmissionsAccessDenied } from "@/features/admissions/shared/components/AdmissionsAccessGuard";

interface InterviewDetailsPageProps {
  interviewId: string;
}

export default function InterviewDetailsPage({
  interviewId,
}: InterviewDetailsPageProps) {
  const t = useTranslations("admissions.interviews");
  const locale = useLocale();
  const router = useRouter();
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const canViewInterviews = hasPermission("admissions.interviews.view");
  const canManageInterviews = hasPermission("admissions.interviews.manage");

  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const loadInterview = useCallback(async () => {
    if (!canViewInterviews) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await fetchInterviewById(interviewId);
      setInterview(data);
    } catch (err) {
      console.error("Failed to load interview:", err);
      setInterview(null);
    } finally {
      setIsLoading(false);
    }
  }, [canViewInterviews, interviewId]);

  useEffect(() => {
    void Promise.resolve().then(loadInterview);
  }, [loadInterview]);

  if (!canViewInterviews) {
    return <AdmissionsAccessDenied />;
  }

  if (isLoading) {
    return <MainLoader />;
  }

  if (!interview) {
    return (
      <div className="p-6">
        <EmptyState
          message="Interview not found"
          action={
            <Button
              type="button"
              onClick={() => router.push(`/${locale}/admissions/interviews`)}
            >
              Back to Interviews
            </Button>
          }
        />
      </div>
    );
  }

  const studentName = interview.studentName || "";

  const handleComplete = () => {
    setIsRatingModalOpen(true);
  };

  const handleRatingSubmit = async (
    _interviewId: string,
    notes?: string,
  ) => {
    try {
      await completeInterview(interviewId, {
        status: "completed",
        notes,
      });
      showToast("Interview completed successfully!", "success");
      setIsRatingModalOpen(false);
      await loadInterview();
    } catch (err) {
      console.error("Failed to complete interview:", err);
      showToast("Failed to complete interview.", "error");
    }
  };

  const handleReschedule = async () => {
    // For now, just update status to rescheduled
    try {
      await updateInterview(interviewId, { status: "rescheduled" });
      showToast("Interview marked as rescheduled.", "success");
      await loadInterview();
    } catch (err) {
      console.error("Failed to reschedule interview:", err);
      showToast("Failed to reschedule interview.", "error");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "scheduled":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "rescheduled":
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div>
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200 px-6 py-4">
            <Button
              type="button"
              onClick={() => router.push(`/${locale}/admissions/interviews`)}
              variant="ghost"
              size="sm"
              className="mb-4 px-0"
              leftIcon={locale === "ar" ? <ArrowRight /> : <ArrowLeft />}
            >
              {t("details.back_to_interviews")}
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t("details.title")} {interview.id}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {studentName}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusIcon(interview.status)}
                <StatusBadge status={interview.status} size="md" />
              </div>
            </div>
          </div>
        </div>

        {/* Interview Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            {t("details.interview_information")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date & Time */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t("details.date_time")}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">{t("details.date")}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {interview.scheduledAt
                      ? new Date(interview.scheduledAt).toLocaleDateString(locale, {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t("details.time")}</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {interview.scheduledAt
                      ? new Date(interview.scheduledAt).toLocaleTimeString(locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Interviewer */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                {t("details.interviewer")}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">{t("details.interviewer")}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {interview.interviewerName || interview.interviewer || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Application</p>
                  <Button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/${locale}/admissions/applications/${interview.applicationId}`,
                      )
                    }
                    variant="ghost"
                    size="sm"
                    className="px-0 text-primary"
                  >
                    {t("actions.view_application")}
                  </Button>
                </div>
              </div>
            </div>

            {/* Student */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                {t("details.student_information")}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">{t("details.student_name")}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {studentName || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              {t("details.notes")}
            </h2>
            {canManageInterviews &&
              interview.status !== "cancelled" &&
              interview.status !== "completed" && (
              <Button
                type="button"
                onClick={handleComplete}
                size="sm"
                leftIcon={<Edit className="w-4 h-4" />}
              >
                {t("complete")}
              </Button>
            )}
          </div>

          {interview.notes ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-2">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                <p className="text-xs text-gray-500">{t("details.notes")}</p>
              </div>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {interview.notes}
              </p>
            </div>
          ) : (
            <EmptyState
              icon={<FileText className="w-12 h-12 text-gray-300" />}
              message="No notes yet"
            />
          )}
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 sticky bottom-4">
          <div className="flex items-center gap-3 flex-wrap">
            {canManageInterviews &&
              (interview.status === "scheduled" ||
                interview.status === "rescheduled") && (
              <>
                <Button
                  type="button"
                  onClick={handleReschedule}
                  variant="secondary"
                  size="sm"
                >
                  {t("actions.reschedule")}
                </Button>
                <Button
                  type="button"
                  onClick={handleComplete}
                  size="sm"
                >
                  {t("complete")}
                </Button>
              </>
            )}
            <Button
              type="button"
              onClick={() =>
                router.push(
                  `/${locale}/admissions/applications/${interview.applicationId}`,
                )
              }
              variant="secondary"
              size="sm"
            >
              {t("actions.view_application")}
            </Button>
          </div>
        </div>
      </div>

      {/* Rating/Complete Modal */}
      {interview && canManageInterviews && (
        <InterviewRatingModal
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          onSubmit={handleRatingSubmit}
          interview={{
            ...interview,
            studentName,
          }}
        />
      )}
    </div>
  );
}
