"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Application, Interview } from "@/features/admissions/types/admissions";
import { StatusBadge } from "@/features/admissions/shared";
import {
  fetchInterviews,
  completeInterview,
} from "@/features/admissions/interviews/services/interviewsApiService";
import InterviewRatingModal from "@/features/admissions/interviews/components/InterviewRatingModal";
import { useToast } from "@/components/ui/toast/Toast";
import { fetchAllAdmissionsPages } from "@/features/admissions/shared/services/admissionsApiUtils";
import { usePermissions } from "@/hooks/usePermissions";
import { AdmissionsAccessDenied } from "@/features/admissions/shared/components/AdmissionsAccessGuard";

interface InterviewsTabProps {
  application: Application;
  onScheduleInterview?: () => void;
}

export default function InterviewsTab({
  application,
  onScheduleInterview,
}: InterviewsTabProps) {
  const t = useTranslations("admissions.application360");
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const canViewInterviews = hasPermission("admissions.interviews.view");
  const canManageInterviews = hasPermission("admissions.interviews.manage");
  const [interviews, setInterviews] = useState<Interview[]>(
    canViewInterviews ? application.interviews : [],
  );
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(
    null,
  );
  const latestRequestId = useRef(0);

  const loadInterviews = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    if (!canViewInterviews) return;
    try {
      const nextInterviews = await fetchAllAdmissionsPages((page, limit) =>
        fetchInterviews({ page, limit }),
      );
      if (requestId !== latestRequestId.current) return;
      setInterviews(
        nextInterviews.filter(
          (interview) => interview.applicationId === application.id,
        ),
      );
    } catch (error) {
      console.error("Failed to load interviews:", error);
    }
  }, [application.id, canViewInterviews]);

  useEffect(() => {
    void Promise.resolve().then(loadInterviews);
    return () => {
      latestRequestId.current += 1;
    };
  }, [loadInterviews]);

  const handleCompleteInterview = async (
    interviewId: string,
    notes?: string,
  ) => {
    try {
      await completeInterview(interviewId, {
        status: "completed",
        notes,
      });
      showToast(t("interviews.completed"), "success");
      setSelectedInterview(null);
      await loadInterviews();
    } catch (err) {
      console.error("Failed to complete interview:", err);
      showToast(t("interviews.complete_failed"), "error");
    }
  };

  if (!canViewInterviews) {
    return <AdmissionsAccessDenied />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{t("interviews.title")}</h3>
        {onScheduleInterview && canManageInterviews ? (
          <button
            onClick={onScheduleInterview}
            className="px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            {t("interviews.schedule_interview")}
          </button>
        ) : null}
      </div>
      {interviews.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          {t("interviews.no_interviews")}
        </p>
      ) : (
        <div className="space-y-2">
          {interviews.map((interview) => (
            <div
              key={interview.id}
              onClick={() => {
                if (canManageInterviews && interview.status !== "cancelled") {
                  setSelectedInterview(interview);
                }
              }}
              className={`p-4 border border-gray-200 rounded-lg transition-colors ${
                canManageInterviews && interview.status !== "cancelled"
                  ? "cursor-pointer hover:border-primary hover:bg-gray-50"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t("interviews.interview_with")}{" "}
                    {interview.interviewerName || interview.interviewer}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {interview.scheduledAt
                      ? new Date(interview.scheduledAt).toLocaleString()
                      : `${interview.date} ${interview.time}`}
                  </p>
                  {interview.notes && (
                    <p className="text-sm text-gray-600 mt-2">
                      {interview.notes}
                    </p>
                  )}
                </div>
                <StatusBadge status={interview.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedInterview && (
        <InterviewRatingModal
          isOpen={true}
          onClose={() => setSelectedInterview(null)}
          onSubmit={handleCompleteInterview}
          interview={{
            ...selectedInterview,
            studentName: application.studentName,
          }}
        />
      )}
    </div>
  );
}
