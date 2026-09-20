"use client";

import { AlertTriangle, ArrowRightLeft, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";
import type { PreparedTeacherAllocationReassignment } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import type { TeacherAllocationReassignmentFailure } from "@/features/academics/teacher-allocation/services/teacherAllocationErrors";

export interface ReassignmentPreviewDialogProps {
  open: boolean;
  reassignments: PreparedTeacherAllocationReassignment[];
  isSubmitting: boolean;
  error: TeacherAllocationReassignmentFailure | null;
  onCancel: () => void;
  onConfirm: () => void;
}

const actionTranslationKeys = {
  timetable: "reassignment.actions.handoff.timetable",
  lesson_plans: "reassignment.actions.handoff.lessonPlans",
  homework: "reassignment.actions.handoff.homework",
} as const;

const historyTranslationKeys = {
  timetable: "reassignment.history.timetable",
  lesson_plans: "reassignment.history.lessonPlans",
  homework: "reassignment.history.homework",
  reinforcement: "reassignment.history.reinforcement",
  announcements: "reassignment.history.announcements",
} as const;

const blockerTranslationKeys = {
  target_is_current_teacher: "reassignment.blockers.targetIsCurrentTeacher",
  target_already_allocated: "reassignment.blockers.targetAlreadyAllocated",
  target_teacher_conflict: "reassignment.blockers.targetTeacherConflict",
  active_reinforcement_tasks: "reassignment.blockers.activeReinforcementTasks",
  mutable_teacher_announcements:
    "reassignment.blockers.mutableTeacherAnnouncements",
} as const;

const failureTranslationKeys = {
  target_not_found: "reassignment.errors.targetNotFound",
  target_ineligible: "reassignment.errors.targetIneligible",
  blocked: "reassignment.errors.blocked",
  stale_preview: "reassignment.errors.stalePreview",
  concurrent_change: "reassignment.errors.concurrentChange",
  unknown: "reassignment.errors.unknown",
} as const;

const eligibilityTranslationKeys: Record<string, string> = {
  incompatible_identity: "reassignment.eligibility.incompatibleIdentity",
  account_status_ineligible: "reassignment.eligibility.accountStatusIneligible",
  membership_ineligible: "reassignment.eligibility.membershipIneligible",
  profile_missing: "reassignment.eligibility.profileMissing",
  employment_inactive: "reassignment.eligibility.employmentInactive",
  profile_incomplete: "reassignment.eligibility.profileIncomplete",
};

export default function ReassignmentPreviewDialog({
  open,
  reassignments,
  isSubmitting,
  error,
  onCancel,
  onConfirm,
}: ReassignmentPreviewDialogProps) {
  const t = useTranslations("academics.teacherAllocation");
  const allReady =
    reassignments.length > 0 &&
    reassignments.every(({ preview }) => preview.canReassign);

  return (
    <Modal
      isOpen={open}
      onClose={onCancel}
      title={t("reassignment.title")}
      description={t("reassignment.description")}
      icon={<ArrowRightLeft className="h-6 w-6" />}
      size="xl"
      closeOnOverlayClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
      showCloseButton={!isSubmitting}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t("reassignment.actions.cancel")}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            loading={isSubmitting}
            disabled={!allReady}
          >
            {t(
              isSubmitting
                ? "reassignment.actions.confirming"
                : "reassignment.actions.confirm",
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-4">
        {error && <ReassignmentError failure={error} />}
        {reassignments.map((reassignment) => (
          <ReassignmentSummary
            key={reassignment.originalAllocation.id}
            reassignment={reassignment}
          />
        ))}
      </div>
    </Modal>
  );
}

function ReassignmentError({
  failure,
}: {
  failure: TeacherAllocationReassignmentFailure;
}) {
  const t = useTranslations("academics.teacherAllocation");
  const eligibilityKey = failure.reasonCode
    ? eligibilityTranslationKeys[failure.reasonCode]
    : undefined;

  return (
    <div
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      aria-live="polite"
    >
      <p>{t(failureTranslationKeys[failure.kind])}</p>
      {eligibilityKey && <p className="mt-1">{t(eligibilityKey)}</p>}
      {failure.traceId && (
        <p className="mt-1 font-mono text-xs text-red-700">
          {t("reassignment.errors.traceId", { traceId: failure.traceId })}
        </p>
      )}
    </div>
  );
}

function ReassignmentSummary({
  reassignment,
}: {
  reassignment: PreparedTeacherAllocationReassignment;
}) {
  const t = useTranslations("academics.teacherAllocation");
  const { preview } = reassignment;
  const statusClass = preview.canReassign
    ? "bg-emerald-100 text-emerald-800"
    : "bg-red-100 text-red-800";

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <TeacherLabel
            label={t("reassignment.currentTeacher")}
            name={preview.currentTeacher.fullName}
          />
          <ArrowRightLeft className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <TeacherLabel
            label={t("reassignment.targetTeacher")}
            name={preview.targetTeacher.fullName}
          />
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
          {t(
            preview.canReassign
              ? "reassignment.status.ready"
              : "reassignment.status.blocked",
          )}
        </span>
      </div>

      <PreviewDetails preview={preview} />
    </section>
  );
}

function TeacherLabel({ label, name }: { label: string; name: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <h3 className="truncate text-sm font-semibold text-gray-900">{name}</h3>
    </div>
  );
}

function PreviewDetails({
  preview,
}: {
  preview: PreparedTeacherAllocationReassignment["preview"];
}) {
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <ActionList preview={preview} />
      <HistoryList preview={preview} />
      {preview.blockers.length > 0 && <BlockerList preview={preview} />}
      <PolicyList />
    </div>
  );
}

function ActionList({
  preview,
}: {
  preview: PreparedTeacherAllocationReassignment["preview"];
}) {
  const t = useTranslations("academics.teacherAllocation");
  const actions = preview.automaticActions.filter(({ count }) => count > 0);
  if (actions.length === 0) return null;

  return (
    <DetailList
      title={t("reassignment.sections.transfers")}
      items={actions.map(({ domain, count }) =>
        t(actionTranslationKeys[domain], { count }),
      )}
    />
  );
}

function HistoryList({
  preview,
}: {
  preview: PreparedTeacherAllocationReassignment["preview"];
}) {
  const t = useTranslations("academics.teacherAllocation");
  const records = preview.historicalRecords.filter(({ count }) => count > 0);
  if (records.length === 0) return null;

  return (
    <DetailList
      title={t("reassignment.sections.history")}
      items={records.map(({ domain, count }) =>
        t(historyTranslationKeys[domain], { count }),
      )}
    />
  );
}

function BlockerList({
  preview,
}: {
  preview: PreparedTeacherAllocationReassignment["preview"];
}) {
  const t = useTranslations("academics.teacherAllocation");
  return (
    <DetailList
      title={t("reassignment.sections.blockers")}
      tone="danger"
      items={preview.blockers.map(({ code, count }) =>
        t(blockerTranslationKeys[code], { count }),
      )}
    />
  );
}

function PolicyList() {
  const t = useTranslations("academics.teacherAllocation");
  return (
    <DetailList
      title={t("reassignment.sections.policies")}
      items={[
        t("reassignment.policies.assessments"),
        t("reassignment.policies.curriculum"),
        t("reassignment.policies.attendance"),
        t("reassignment.policies.messages"),
      ]}
    />
  );
}

function DetailList({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "danger";
}) {
  const isDanger = tone === "danger";
  return (
    <div
      className={`rounded-xl border p-3 ${
        isDanger ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        {isDanger ? (
          <AlertTriangle className="h-4 w-4 text-red-600" aria-hidden="true" />
        ) : (
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
        )}
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      </div>
      <ul className="space-y-1 text-sm text-gray-700">
        {items.map((description) => (
          <li key={description}>• {description}</li>
        ))}
      </ul>
    </div>
  );
}
