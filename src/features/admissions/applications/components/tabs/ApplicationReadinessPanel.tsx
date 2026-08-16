"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";
import type { Application } from "@/features/admissions/types/admissions";
import StatusBadge from "../../../shared/StatusBadge";

interface ApplicationReadinessPanelProps {
  application: Application;
}

interface ActionStateCardProps {
  icon: ReactNode;
  title: string;
  enabled: boolean;
  reason?: string;
  enabledLabel: string;
  blockedLabel: string;
}

function ActionStateCard({
  icon,
  title,
  enabled,
  reason,
  enabledLabel,
  blockedLabel,
}: ActionStateCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 rounded-md p-2 ${
            enabled ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p
            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
              enabled ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            {enabled ? enabledLabel : blockedLabel}
          </p>
          {reason && <p className="mt-2 break-words text-xs text-gray-500">{reason}</p>}
          <button
            type="button"
            disabled={!enabled}
            className={`mt-3 inline-flex min-h-9 items-center rounded-md px-3 text-sm font-semibold transition-colors ${
              enabled
                ? "cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                : "cursor-not-allowed bg-gray-100 text-gray-500"
            }`}
          >
            {title}
          </button>
        </div>
      </div>
    </div>
  );
}

interface WorkflowRequirementRowProps {
  label: string;
  required: boolean;
  satisfied: boolean;
  requiredLabel: string;
  optionalLabel: string;
  satisfiedLabel: string;
  notSatisfiedLabel: string;
  completedLabel: string;
}

function WorkflowRequirementRow({
  label,
  required,
  satisfied,
  requiredLabel,
  optionalLabel,
  satisfiedLabel,
  notSatisfiedLabel,
  completedLabel,
}: WorkflowRequirementRowProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{completedLabel}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
          {required ? requiredLabel : optionalLabel}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            satisfied ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
          }`}
        >
          {satisfied ? satisfiedLabel : notSatisfiedLabel}
        </span>
      </div>
    </div>
  );
}

export default function ApplicationReadinessPanel({
  application,
}: ApplicationReadinessPanelProps) {
  const t = useTranslations("admissions.application360");
  const dashboardState = application.dashboardState;
  const documentsSummary = application.documentsSummary;

  if (!dashboardState) return null;

  const getBlockerMessage = (code: string) =>
    dashboardState.blockers.find((blocker) => blocker.code === code)?.message ?? code;

  return (
    <section className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-white p-2 text-indigo-700 shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-950">
              {t("details.readiness_title")}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {t("details.readiness_subtitle")}
            </p>
          </div>
        </div>
        <StatusBadge status={application.status} size="md" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ActionStateCard
          icon={<ClipboardCheck className="h-4 w-4" />}
          title={t("details.decision_action")}
          enabled={dashboardState.canProceedToDecision}
          reason={getBlockerMessage(dashboardState.decisionState.reason)}
          enabledLabel={t("details.enabled")}
          blockedLabel={t("details.blocked")}
        />
        <ActionStateCard
          icon={<UserCheck className="h-4 w-4" />}
          title={t("details.registration_action")}
          enabled={dashboardState.canRegister}
          reason={getBlockerMessage(dashboardState.registrationState)}
          enabledLabel={t("details.enabled")}
          blockedLabel={t("details.blocked")}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {documentsSummary && (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-700" />
              <h4 className="text-sm font-semibold text-gray-900">
                {t("details.document_summary")}
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md bg-emerald-50 p-3">
                <p className="text-lg font-semibold text-emerald-800">
                  {documentsSummary.completeCount}
                </p>
                <p className="text-xs text-emerald-700">
                  {t("details.documents_complete")}
                </p>
              </div>
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-lg font-semibold text-red-800">
                  {documentsSummary.missingCount}
                </p>
                <p className="text-xs text-red-700">
                  {t("details.documents_missing")}
                </p>
              </div>
              <div className="rounded-md bg-amber-50 p-3">
                <p className="text-lg font-semibold text-amber-800">
                  {documentsSummary.pendingReviewCount}
                </p>
                <p className="text-xs text-amber-700">
                  {t("details.documents_pending_review")}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {t("details.documents_total", { total: documentsSummary.totalCount })}
            </p>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-4 xl:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-indigo-700" />
            <h4 className="text-sm font-semibold text-gray-900">
              {t("details.workflow_readiness")}
            </h4>
          </div>
          <div className="space-y-2">
            <WorkflowRequirementRow
              label={t("details.placement_test")}
              required={dashboardState.workflowReadiness.placementTests.required}
              satisfied={dashboardState.workflowReadiness.placementTests.satisfied}
              requiredLabel={t("details.required")}
              optionalLabel={t("details.optional")}
              satisfiedLabel={t("details.satisfied")}
              notSatisfiedLabel={t("details.not_satisfied")}
              completedLabel={t("details.completed_count", {
                completed: dashboardState.workflowReadiness.placementTests.completed,
                total: dashboardState.workflowReadiness.placementTests.total,
              })}
            />
            <WorkflowRequirementRow
              label={t("details.interview")}
              required={dashboardState.workflowReadiness.interviews.required}
              satisfied={dashboardState.workflowReadiness.interviews.satisfied}
              requiredLabel={t("details.required")}
              optionalLabel={t("details.optional")}
              satisfiedLabel={t("details.satisfied")}
              notSatisfiedLabel={t("details.not_satisfied")}
              completedLabel={t("details.completed_count", {
                completed: dashboardState.workflowReadiness.interviews.completed,
                total: dashboardState.workflowReadiness.interviews.total,
              })}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
              {t("details.policy_source")}: {dashboardState.workflowReadiness.policy.source}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 font-medium ${
                dashboardState.workflowReadiness.policy.allowDirectAcceptance
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {t("details.direct_acceptance")}:{" "}
              {dashboardState.workflowReadiness.policy.allowDirectAcceptance
                ? t("details.allowed")
                : t("details.not_allowed")}
            </span>
          </div>
        </div>
      </div>

      {dashboardState.blockers.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <h4 className="text-sm font-semibold text-amber-950">
              {t("details.blockers")}
            </h4>
          </div>
          <ul className="space-y-2">
            {dashboardState.blockers.map((blocker) => (
              <li key={`${blocker.code}-${blocker.message}`} className="flex gap-2">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <div>
                  <p className="text-sm font-medium text-amber-950">
                    {blocker.message}
                  </p>
                  <p className="text-xs text-amber-800">{blocker.code}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
