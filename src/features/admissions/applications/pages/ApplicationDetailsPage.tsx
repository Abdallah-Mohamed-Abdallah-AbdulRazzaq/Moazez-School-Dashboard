"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  ClipboardCheck,
  MessageSquare,
  FileCheck,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import StatusBadge from "@/features/admissions/shared/StatusBadge";
import TabNavigation from "@/features/admissions/shared/TabNavigation";
import ScheduleTestModal from "@/features/admissions/tests/components/ScheduleTestModal";
import ScheduleInterviewModal, {
  type ScheduleInterviewFormData,
} from "@/features/admissions/interviews/components/ScheduleInterviewModal";
import DecisionModal from "@/features/admissions/decisions/components/DecisionModal";
import ApplicationRegistrationWizard from "@/features/admissions/applications/components/registration/ApplicationRegistrationWizard";
import { Button, EmptyState } from "@/components/ui";
import DetailsTab from "@/features/admissions/applications/components/tabs/DetailsTab";
import GuardiansTab from "@/features/admissions/applications/components/tabs/GuardiansTab";
import DocumentsTab from "@/features/admissions/applications/components/tabs/DocumentsTab";
import TestsTab from "@/features/admissions/applications/components/tabs/TestsTab";
import InterviewsTab from "@/features/admissions/applications/components/tabs/InterviewsTab";
import ApplicationReadinessPanel from "@/features/admissions/applications/components/tabs/ApplicationReadinessPanel";
import { useAdmissionsUrlQueryState } from "@/features/admissions/shared/hooks/useAdmissionsUrlQueryState";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import { AdmissionsAccessDenied } from "@/features/admissions/shared/components/AdmissionsAccessGuard";
import { useApplicationRelatedData } from "@/features/admissions/applications/hooks/useApplicationRelatedData";
import { useAdmissionsGradeLabels } from "@/features/admissions/applications/hooks/useAdmissionsGradeLabels";
import type {
  Application,
  ApplicationStatus,
  DecisionType,
} from "@/features/admissions/types/admissions";
import { fetchApplicationById } from "@/features/admissions/applications/services/applicationsApiService";
import { createPlacementTest } from "@/features/admissions/tests/services/testsApiService";
import { createInterview } from "@/features/admissions/interviews/services/interviewsApiService";
import {
  createDecision,
  getDecisionFriendlyErrorMessage,
} from "@/features/admissions/decisions/services/decisionsApiService";
import {
  getApplicationActionBlockers,
  getDecisionActionState,
  getRegistrationActionState,
} from "@/features/admissions/applications/utils/applicationActionReadiness";

interface ApplicationDetailsPageProps {
  applicationId: string;
}

export default function ApplicationDetailsPage({
  applicationId,
}: ApplicationDetailsPageProps) {
  const t = useTranslations("admissions.application360");
  const locale = useLocale();
  const router = useRouter();
  const { showToast } = useToast();
  const { hasPermission, hasAllPermissions } = usePermissions();
  const canViewApplications = hasPermission("admissions.applications.view");
  const canViewDocuments = hasPermission("admissions.documents.view");
  const canViewTests = hasPermission("admissions.tests.view");
  const canViewInterviews = hasPermission("admissions.interviews.view");
  const canManageTests = hasPermission("admissions.tests.manage");
  const canManageInterviews = hasPermission("admissions.interviews.manage");
  const canManageDecisions = hasPermission("admissions.decisions.manage");
  const canRegisterApplication = hasAllPermissions([
    "admissions.applications.manage",
    "students.records.manage",
    "students.guardians.manage",
    "students.enrollments.manage",
  ]);
  const normalizeQueryValues = useCallback((values: Record<"tab", string>) => {
    const validTabs = new Set([
      "details",
      "readiness",
      "documents",
      "tests",
      "interviews",
    ]);

    return validTabs.has(values.tab) ? null : { tab: null };
  }, []);
  const { values, setValue } = useAdmissionsUrlQueryState<{
    tab: string;
  }>({
    defaults: {
      tab: "details",
    },
    normalize: normalizeQueryValues,
  });
  const activeTab = values.tab;

  // Modal states
  const [isScheduleTestOpen, setIsScheduleTestOpen] = useState(false);
  const [isScheduleInterviewOpen, setIsScheduleInterviewOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const needsRegistrationHandoff = activeTab === "guardians";
  const relatedData = useApplicationRelatedData(
    applicationId,
    needsRegistrationHandoff,
  );
  const gradeReferences = useMemo(
    () => (application ? [application] : []),
    [application],
  );
  const gradeLabels = useAdmissionsGradeLabels(gradeReferences, locale);

  const loadApplication = useCallback(async () => {
    if (!canViewApplications) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setApplication(await fetchApplicationById(applicationId));
    } catch (loadError) {
      console.error("Failed to load application:", loadError);
      setApplication(null);
      setError(t("not_found"));
    } finally {
      setIsLoading(false);
    }
  }, [applicationId, canViewApplications, t]);

  useEffect(() => {
    void Promise.resolve().then(loadApplication);
  }, [loadApplication]);

  if (!canViewApplications) {
    return <AdmissionsAccessDenied />;
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-6">
        <EmptyState
          message={error || t("not_found")}
          action={
            <Button
              type="button"
              onClick={() => router.push(`/${locale}/admissions/applications`)}
            >
              {t("header.back_to_applications")}
            </Button>
          }
        />
      </div>
    );
  }

  const tabs = [
    {
      id: "details",
      label: t("tabs.details"),
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: "readiness",
      label: t("tabs.readiness"),
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: "documents",
      label: t("tabs.documents"),
      icon: <FileCheck className="w-4 h-4" />,
    },
    {
      id: "tests",
      label: t("tabs.tests"),
      icon: <ClipboardCheck className="w-4 h-4" />,
    },
    {
      id: "interviews",
      label: t("tabs.interviews"),
      icon: <MessageSquare className="w-4 h-4" />,
    },
  ].filter((tab) => {
    if (tab.id === "documents") return canViewDocuments;
    if (tab.id === "tests") return canViewTests;
    if (tab.id === "interviews") return canViewInterviews;
    return true;
  });

  const finalDecisionStatuses: ApplicationStatus[] = [
    "accepted",
    "waitlisted",
    "rejected",
  ];
  const canScheduleAdmissionsSteps: ApplicationStatus[] = [
    "submitted",
    "under_review",
    "documents_pending",
  ];
  const isFinalDecisionStatus = finalDecisionStatuses.includes(
    application.status,
  );
  const canScheduleAdmissionsStep = canScheduleAdmissionsSteps.includes(
    application.status,
  );
  const { canMakeDecision } = getDecisionActionState(application);
  const actionBlockers = getApplicationActionBlockers(application);
  const registrationAction = getRegistrationActionState(application, {
    canRegisterApplication,
    permissionRequiredMessage: t("registration.permission_required"),
  });
  const finalDecisionMessage =
    application.status === "waitlisted"
      ? t("actions.waitlisted_no_transition")
      : application.status === "rejected"
        ? t("actions.rejected_no_actions")
        : null;

  const handleTabChange = (tabId: string) => {
    setValue("tab", tabId, "push");
  };

  const handleScheduleTest = () => {
    setIsScheduleTestOpen(true);
  };

  const handleScheduleInterview = () => {
    setIsScheduleInterviewOpen(true);
  };

  const handleMakeDecision = () => {
    setIsDecisionOpen(true);
  };

  const handleEnroll = () => {
    setIsEnrollmentOpen(true);
  };

  const handleScheduleTestSubmit = async (data: {
    date: string;
    time: string;
    type: string;
    subjectId: string;
    subjectName: string;
  }) => {
    try {
      await createPlacementTest({
        applicationId: application.id,
        subjectId: data.subjectId,
        type: data.type,
        date: data.date,
        time: data.time,
      });
      setIsScheduleTestOpen(false);
      await loadApplication();
    } catch (scheduleError) {
      console.error("Failed to schedule test:", scheduleError);
      showToast(t("schedule_test_error"), "error");
    }
  };

  const handleScheduleInterviewSubmit = async (
    data: ScheduleInterviewFormData,
  ) => {
    try {
      await createInterview({
        applicationId: application.id,
        date: data.date,
        time: data.time,
        interviewerUserId: data.interviewerUserId,
        notes: data.notes,
      });
      setIsScheduleInterviewOpen(false);
      await loadApplication();
    } catch (scheduleError) {
      console.error("Failed to schedule interview:", scheduleError);
      showToast(t("schedule_interview_error"), "error");
    }
  };

  const handleDecisionSubmit = async (
    decision: DecisionType,
    reason: string,
  ) => {
    try {
      setIsSubmittingDecision(true);
      await createDecision({
        applicationId: application.id,
        decision,
        reason,
      });
      setIsDecisionOpen(false);
      await loadApplication();
    } catch (decisionError) {
      console.error("Failed to create decision:", decisionError);
      showToast(
        getDecisionFriendlyErrorMessage(decisionError) || t("decision_error"),
        "error",
      );
    } finally {
      setIsSubmittingDecision(false);
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
              onClick={() => router.push(`/${locale}/admissions/applications`)}
              variant="ghost"
              size="sm"
              className="mb-4 px-0"
              leftIcon={locale === "ar" ? <ArrowRight /> : <ArrowLeft />}
            >
              {t("header.back_to_applications")}
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t("header.title")}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {[
                    application.studentName,
                    application.requestedGradeId
                      ? gradeLabels.get(application.requestedGradeId)
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" - ")}
                </p>
              </div>
              <StatusBadge status={application.status} size="md" />
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6">
            <TabNavigation
              tabs={tabs}
              activeTab={activeTab}
              onChange={handleTabChange}
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          {activeTab === "details" && <DetailsTab application={application} />}
          {activeTab === "readiness" && (
            <ApplicationReadinessPanel application={application} />
          )}
          {activeTab === "guardians" && (
            <GuardiansTab
              application={application}
              guardians={relatedData.guardians}
              isLoading={relatedData.isLoadingHandoff}
              error={relatedData.handoffError}
              onRetry={relatedData.reloadHandoff}
            />
          )}
          {activeTab === "documents" && (
            <DocumentsTab
              application={application}
              initialDocuments={relatedData.documents}
            />
          )}
          {activeTab === "tests" && (
            <TestsTab
              application={application}
              onScheduleTest={handleScheduleTest}
            />
          )}
          {activeTab === "interviews" && (
            <InterviewsTab
              application={application}
              onScheduleInterview={handleScheduleInterview}
            />
          )}
        </div>

        {/* Sticky Action Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 sticky bottom-4">
          <div className="space-y-4">
            {actionBlockers.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-medium">{t("actions.blocked_title")}</p>
                <ul className="mt-2 list-disc space-y-1 ps-5">
                  {actionBlockers.map((blocker) => (
                    <li key={`${blocker.code}-${blocker.message}`}>
                      {blocker.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              {canScheduleAdmissionsStep && (
                <>
                  {canManageTests && (
                  <Button
                    type="button"
                    onClick={handleScheduleTest}
                    variant="secondary"
                    size="sm"
                  >
                    {t("actions.schedule_test")}
                  </Button>
                  )}
                  {canManageInterviews && (
                  <Button
                    type="button"
                    onClick={handleScheduleInterview}
                    variant="secondary"
                    size="sm"
                  >
                    {t("actions.schedule_interview")}
                  </Button>
                  )}
                </>
              )}
              {canManageDecisions && canMakeDecision && (
                <Button type="button" onClick={handleMakeDecision} size="sm">
                  {t("actions.make_decision")}
                </Button>
              )}
              {registrationAction.isVisible && (
                  <Button
                    type="button"
                    onClick={handleEnroll}
                    disabled={registrationAction.isDisabled}
                    title={registrationAction.title}
                    variant="success"
                    size="sm"
                  >
                    {t("actions.enroll_student")}
                  </Button>
                )}
              {application.registrationState?.registered && (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                  {t("actions.enrolled_status")}
                </p>
              )}
              {isFinalDecisionStatus && finalDecisionMessage && (
                <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700">
                  {finalDecisionMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ScheduleTestModal
        isOpen={isScheduleTestOpen}
        onClose={() => setIsScheduleTestOpen(false)}
        onSubmit={handleScheduleTestSubmit}
        studentName={application.studentName}
        applicationId={application.id}
      />

      <ScheduleInterviewModal
        isOpen={isScheduleInterviewOpen}
        onClose={() => setIsScheduleInterviewOpen(false)}
        onSubmit={handleScheduleInterviewSubmit}
        studentName={application.studentName}
      />

      <DecisionModal
        isOpen={isDecisionOpen}
        onClose={() => {
          if (!isSubmittingDecision) setIsDecisionOpen(false);
        }}
        onSubmit={handleDecisionSubmit}
        application={application}
        isSubmitting={isSubmittingDecision}
      />

      <ApplicationRegistrationWizard
        applicationId={application.id}
        studentName={application.studentName}
        isOpen={isEnrollmentOpen}
        onClose={() => setIsEnrollmentOpen(false)}
        onRegistered={loadApplication}
      />
    </div>
  );
}
