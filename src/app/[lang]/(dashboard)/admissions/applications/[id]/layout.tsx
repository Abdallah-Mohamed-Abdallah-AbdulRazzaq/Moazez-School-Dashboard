"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  ShieldCheck,
  ClipboardCheck,
  MessageSquare,
  FileCheck,
} from "lucide-react";
import StatusBadge from "@/features/admissions/shared/StatusBadge";
import ScheduleTestModal from "@/features/admissions/tests/components/ScheduleTestModal";
import ScheduleInterviewModal from "@/features/admissions/interviews/components/ScheduleInterviewModal";
import DecisionModal from "@/features/admissions/decisions/components/DecisionModal";
import ApplicationRegistrationWizard from "@/features/admissions/applications/components/registration/ApplicationRegistrationWizard";
import { useSectionTabs } from "@/hooks/useSectionTabs";
import { buildLocalePath } from "@/lib/routing/localePath";
import { AdmissionsAccessDenied } from "@/features/admissions/shared/components/AdmissionsAccessGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/components/ui/toast/Toast";
import type {
  Application,
  ApplicationStatus,
  DecisionType,
} from "@/features/admissions/types/admissions";
import {
  fetchApplicationById,
  submitApplication,
} from "@/features/admissions/applications/services/applicationsApiService";
import { createPlacementTest } from "@/features/admissions/tests/services/testsApiService";
import { createInterview } from "@/features/admissions/interviews/services/interviewsApiService";
import { useAdmissionsGradeLabels } from "@/features/admissions/applications/hooks/useAdmissionsGradeLabels";
import {
  getApplicationActionBlockers,
  getDecisionActionState,
  getRegistrationActionState,
} from "@/features/admissions/applications/utils/applicationActionReadiness";
import {
  createDecision,
  getDecisionFriendlyErrorMessage,
} from "@/features/admissions/decisions/services/decisionsApiService";

const tabs = [
  { key: "details", labelKey: "tabs.details", icon: FileText },
  { key: "readiness", labelKey: "tabs.readiness", icon: ShieldCheck },
  { key: "documents", labelKey: "tabs.documents", icon: FileCheck },
  { key: "tests", labelKey: "tabs.tests", icon: ClipboardCheck },
  { key: "interviews", labelKey: "tabs.interviews", icon: MessageSquare },
];

export default function ApplicationProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("admissions.application360");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const { showToast } = useToast();
  const { hasPermission, hasAllPermissions } = usePermissions();
  const canViewApplications = hasPermission("admissions.applications.view");
  const canViewDocuments = hasPermission("admissions.documents.view");
  const canViewTests = hasPermission("admissions.tests.view");
  const canViewInterviews = hasPermission("admissions.interviews.view");
  const canManageApplications = hasPermission("admissions.applications.manage");
  const canManageTests = hasPermission("admissions.tests.manage");
  const canManageInterviews = hasPermission("admissions.interviews.manage");
  const canManageDecisions = hasPermission("admissions.decisions.manage");
  const canRegisterApplication = hasAllPermissions([
    "admissions.applications.manage",
    "students.records.manage",
    "students.guardians.manage",
    "students.enrollments.manage",
  ]);
  const visibleTabs = tabs.filter((tab) => {
    if (tab.key === "documents") return canViewDocuments;
    if (tab.key === "tests") return canViewTests;
    if (tab.key === "interviews") return canViewInterviews;
    return true;
  });

  const [isScheduleTestOpen, setIsScheduleTestOpen] = useState(false);
  const [isScheduleInterviewOpen, setIsScheduleInterviewOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);

  const {
    activeTab,
    entityId: applicationId,
    handleTabClick,
  } = useSectionTabs({
    basePath: ["admissions", "applications"],
    idParam: "id",
    tabs: visibleTabs,
    defaultTab: "details",
  });

  const [application, setApplication] = useState<Application | null>(null);
  const [isLoadingApplication, setIsLoadingApplication] = useState(true);

  useEffect(() => {
    if (!canViewApplications) return;
    if (!applicationId) return;
    let cancelled = false;
    void fetchApplicationById(applicationId)
      .then((nextApplication) => {
        if (!cancelled) setApplication(nextApplication);
      })
      .catch((error) => {
        console.error("Failed to load application:", error);
        if (!cancelled) setApplication(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingApplication(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applicationId, canViewApplications]);

  const refreshApplication = async () => {
    if (!applicationId) return;
    setApplication(await fetchApplicationById(applicationId));
  };

  const gradeReferences = useMemo(
    () => (application ? [application] : []),
    [application],
  );
  const gradeLabels = useAdmissionsGradeLabels(gradeReferences, locale);
  const displayGrade = application?.requestedGradeId
    ? gradeLabels.get(application.requestedGradeId)
    : null;

  if (!canViewApplications) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        <AdmissionsAccessDenied />
      </div>
    );
  }

  if (isLoadingApplication) {
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
        <div className="text-center py-12">
          <p className="text-gray-500">{t("not_found")}</p>
          <button
            onClick={() =>
              router.push(buildLocalePath(lang, "admissions", "applications"))
            }
            className="mt-4 px-4 py-2 bg-[#036b80] text-white rounded-lg"
          >
            {t("header.back_to_applications")}
          </button>
        </div>
      </div>
    );
  }

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

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div>
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200 px-6 py-4">
            <button
              onClick={() =>
                router.push(buildLocalePath(lang, "admissions", "applications"))
              }
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              {locale === "ar" ? <ArrowRight /> : <ArrowLeft />}
              <span className="text-sm font-medium">
                {t("header.back_to_applications")}
              </span>
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t("header.title")}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {[application.studentName, displayGrade]
                    .filter(Boolean)
                    .join(" - ")}
                </p>
              </div>
              <StatusBadge status={application.status} size="md" />
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex min-w-max px-6">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabClick(tab.key)}
                    className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? "border-[#036b80] text-[#036b80]"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t(tab.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">{children}</div>

        {/* Sticky Action Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 sticky bottom-4">
          {application.registrationState?.registered ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-emerald-600" />
                {t("actions.enrolled_status")}
              </div>
            </div>
          ) : (
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
                {application.status === "documents_pending" && (
                  <button
                    disabled={!canManageApplications}
                    onClick={async () => {
                      try {
                        await submitApplication(application.id);
                        await refreshApplication();
                      } catch (err) {
                        console.error("Failed to submit application:", err);
                        showToast(t("submit_error"), "error");
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("actions.submit_application")}
                  </button>
                )}
                {canScheduleAdmissionsStep && (
                  <>
                    {canManageTests && (
                    <button
                      onClick={() => setIsScheduleTestOpen(true)}
                      className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {t("actions.schedule_test")}
                    </button>
                    )}
                    {canManageInterviews && (
                    <button
                      onClick={() => setIsScheduleInterviewOpen(true)}
                      className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {t("actions.schedule_interview")}
                    </button>
                    )}
                  </>
                )}
                {canManageDecisions && canMakeDecision && (
                  <button
                    onClick={() => setIsDecisionOpen(true)}
                    className="px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("actions.make_decision")}
                  </button>
                )}
                {registrationAction.isVisible && (
                  <button
                    disabled={registrationAction.isDisabled}
                    title={registrationAction.title}
                    onClick={() => setIsEnrollmentOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("actions.enroll_student")}
                  </button>
                )}
                {isFinalDecisionStatus && finalDecisionMessage && (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700">
                    {finalDecisionMessage}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ScheduleTestModal
        isOpen={isScheduleTestOpen}
        onClose={() => setIsScheduleTestOpen(false)}
        onSubmit={async (data) => {
          await createPlacementTest({
            applicationId: application.id,
            subjectId: data.subjectId,
            type: data.type,
            date: data.date,
            time: data.time,
          });
          await refreshApplication();
          setIsScheduleTestOpen(false);
        }}
        studentName={application.studentName}
        applicationId={application.id}
      />

      <ScheduleInterviewModal
        isOpen={isScheduleInterviewOpen}
        onClose={() => setIsScheduleInterviewOpen(false)}
        onSubmit={async (data) => {
          await createInterview({
            applicationId: application.id,
            date: data.date,
            time: data.time,
            interviewerUserId: data.interviewerUserId,
            notes: data.notes,
          });
          await refreshApplication();
          setIsScheduleInterviewOpen(false);
        }}
        studentName={application.studentName}
      />

      <DecisionModal
        isOpen={isDecisionOpen}
        onClose={() => {
          if (!isSubmittingDecision) setIsDecisionOpen(false);
        }}
        onSubmit={async (decision: DecisionType, reason: string) => {
          try {
            setIsSubmittingDecision(true);
            await createDecision({
              applicationId: application.id,
              decision,
              reason,
            });
            await refreshApplication();
            setIsDecisionOpen(false);
          } catch (error) {
            showToast(
              getDecisionFriendlyErrorMessage(error) || t("decision_error"),
              "error",
            );
          } finally {
            setIsSubmittingDecision(false);
          }
        }}
        application={application}
        isSubmitting={isSubmittingDecision}
      />

      <ApplicationRegistrationWizard
        applicationId={application.id}
        studentName={application.studentName}
        isOpen={isEnrollmentOpen}
        onClose={() => setIsEnrollmentOpen(false)}
        onRegistered={refreshApplication}
      />
    </div>
  );
}
