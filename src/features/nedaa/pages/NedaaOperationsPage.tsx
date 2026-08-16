"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  History,
  MapPin,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import { DataTable, type Column } from "@/components/ui/data-table";
import FilterPanel from "@/components/ui/filter-panel/FilterPanel";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import Input from "@/components/ui/input/Input";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import MainLoader from "@/components/ui/loaders/MainLoader";
import Modal from "@/components/ui/modal/Modal";
import { useToast } from "@/components/ui/toast/Toast";
import { useDebounce } from "@/hooks/useDebounce";
import { usePermissions } from "@/hooks/usePermissions";
import { isApiError } from "@/lib/api-error";
import NedaaAccessNotice from "@/features/nedaa/components/NedaaAccessNotice";
import { useNedaaAcademicStructure } from "@/features/nedaa/hooks/useNedaaAcademicStructure";
import {
  confirmDismissalStudentArrival,
  deliverDismissalRequest,
  escalateDismissalRequest,
  fetchDismissalRequest,
  fetchDismissalRequestHistoryItem,
  listActiveDismissalRequests,
  listDismissalGates,
  listDismissalPickupRecipients,
  listDismissalRequestHistory,
  listDismissalWaitingStudents,
  updateDismissalRequestStatus,
} from "@/features/nedaa/services/dismissalApiService";
import type {
  ActiveDismissalRequestSort,
  ActiveDismissalRequest,
  ActiveDismissalRequestDetail,
  ActiveDismissalRequestsSummary,
  DismissalPickupRecipientsResponse,
  DismissalRequestHistoryItem,
  DismissalRequestHistoryDetail,
  DismissalRequestHistoryStatus,
  DismissalRequestHistorySort,
  DismissalRequestHistorySummary,
  DismissalRequestStatus,
  DismissalWaitingStudent,
  DismissalWaitingStudentsSummary,
  ListActiveDismissalRequestsParams,
  ListDismissalRequestHistoryParams,
  ListDismissalWaitingStudentsParams,
  NedaaGate,
  WaitingDismissalStudentSort,
} from "@/features/nedaa/types/nedaa";
import {
  getNedaaAcademicOptions,
  type NedaaAcademicSelection,
} from "@/features/nedaa/utils/nedaaAcademicOptions";
import { getNedaaApiErrorMessage } from "@/features/nedaa/utils/nedaaApiErrors";
import { fetchAllStudents } from "@/features/students-guardians/students/services/studentsService";
import type { Student } from "@/features/students-guardians/students/types";

type OperationsTab = "active" | "waiting" | "history";

interface OperationsFilters {
  search: string;
  gateId: string;
  status: string;
  expanded: boolean;
  stageId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
  sort:
    | ActiveDismissalRequestSort
    | WaitingDismissalStudentSort
    | DismissalRequestHistorySort;
  page: number;
  limit: number;
  statuses: DismissalRequestHistoryStatus[];
  childId: string;
  dateFrom: string;
  dateTo: string;
  activeOnly: boolean;
  terminalOnly: boolean;
  delayedOnly: boolean;
  urgentOnly: boolean;
  escalatedOnly: boolean;
}

interface OperationTableRow extends Record<string, unknown> {
  student: string;
  gate: string;
  status: string;
  wait: string;
  signals: string;
  requestedAt: string;
  requester?: string;
  arrivalState?: string;
  updatedAt?: string;
  activeRequest?: ActiveDismissalRequest;
  waitingStudent?: DismissalWaitingStudent;
  historyItem?: DismissalRequestHistoryItem;
}

interface ActionModalState {
  type:
    | "status"
    | "arrival"
    | "delivery"
    | "delivery_confirm"
    | "escalation"
    | "recipients"
    | "detail"
    | "history";
  requestId: string;
  title: string;
  requestStatus?: DismissalRequestStatus;
  waitingStudent?: DismissalWaitingStudent;
}

interface OperationsFilterGroupProps {
  children: ReactNode;
  columns?: string;
  id: string;
  title: string;
}

interface HistoryDetailContentProps {
  detail: DismissalRequestHistoryDetail;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}

type SignalTone = "normal" | "delayed" | "urgent" | "escalated";

function formatHistoryDateTime(value: string | null, locale: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function requestStatusTone(status: string) {
  if (status === "handed_over") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "cancelled" || status === "expired") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function getSignalTone({
  delayed,
  escalated,
  urgent,
}: {
  delayed: boolean;
  escalated: boolean;
  urgent: boolean;
}): SignalTone {
  if (escalated) return "escalated";
  if (urgent) return "urgent";
  return delayed ? "delayed" : "normal";
}

function SignalBadge({ label, tone }: { label: string; tone: SignalTone }) {
  const styles = {
    normal: "border-emerald-200 bg-emerald-50 text-emerald-800",
    delayed: "border-amber-200 bg-amber-50 text-amber-800",
    urgent: "border-red-200 bg-red-50 text-red-800",
    escalated: "border-rose-200 bg-rose-50 text-rose-800",
  }[tone];
  const Icon = tone === "normal" ? ShieldCheck : tone === "delayed" ? Clock3 : AlertTriangle;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${styles}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}

interface RequestContextContentProps {
  detail: ActiveDismissalRequest | DismissalWaitingStudent;
  locale: string;
  t: ReturnType<typeof useTranslations>;
  timeline?: ActiveDismissalRequestDetail["timeline"];
}

function RequestContextContent({
  detail,
  locale,
  t,
  timeline,
}: RequestContextContentProps) {
  const isWaitingStudent = "arrivalState" in detail;
  const signalLabel = detail.signals.urgent
    ? t("operations_signals.urgent")
    : detail.signals.delayed
      ? t("operations_signals.delayed")
      : t("operations_signals.normal");

  return (
    <div className="space-y-5 py-3">
      <section aria-labelledby="nedaa-request-summary-heading" className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t("operations_history.summary")}
            </p>
            <h3
              id="nedaa-request-summary-heading"
              className="mt-1 text-lg font-bold text-gray-900"
            >
              {detail.child.displayName}
            </h3>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${requestStatusTone(detail.status)}`}
          >
            {t(`operations_status.${detail.status}`)}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
          <HistoryIdentityItem
            icon={UserRound}
            label={t("operations_history.grade_section")}
            value={`${detail.child.grade || "-"} · ${detail.child.section || "-"}`}
          />
          <HistoryIdentityItem
            icon={MapPin}
            label={t("operations_history.gate")}
            value={gateLabel(detail.gate)}
          />
          <HistoryIdentityItem
            label={t("operations_history.classroom")}
            value={detail.child.classroom || "-"}
          />
          <HistoryIdentityItem
            label={t("operations_history.request_id")}
            value={detail.id.slice(0, 8)}
            title={detail.id}
          />
          {"requester" in detail ? (
            <HistoryIdentityItem
              label={t("operations_history.requester")}
              value={detail.requester.displayName || "-"}
            />
          ) : (
            <HistoryIdentityItem
              label={t("operations_history.arrival_state")}
              value={t(`operations_arrival.${detail.arrivalState}`)}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <HistoryMetric
            label={t("operations_history.wait_duration")}
            value={t("operations_history.wait_minutes", {
              minutes: detail.waitMinutes,
            })}
            icon={Clock3}
          />
          <HistoryMetric
            label={t("operations_history.requested_at")}
            value={formatHistoryDateTime(detail.requestedAt, locale)}
            icon={History}
          />
          {isWaitingStudent ? (
            <HistoryMetric
              label={t("operations_history.updated_at")}
              value={formatHistoryDateTime(detail.updatedAt, locale)}
              icon={RefreshCw}
            />
          ) : null}
          <HistoryMetric
            label={t("operations_fields.signals")}
            value={signalLabel}
            icon={detail.signals.urgent ? AlertTriangle : ShieldCheck}
          />
        </div>

        {detail.signals.delayed || detail.signals.urgent ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${detail.signals.urgent ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}
            role="status"
          >
            <p className="font-semibold">{signalLabel}</p>
            <p className="mt-1 text-xs opacity-80">
              {t("operations_history.signal_threshold", {
                waitMinutes: detail.waitMinutes,
                thresholdMinutes: detail.signals.urgent
                  ? detail.signals.urgentThresholdMinutes
                  : detail.signals.delayThresholdMinutes,
              })}
            </p>
          </div>
        ) : null}
      </section>

      {timeline ? (
        <RequestTimeline detail={timeline} locale={locale} t={t} />
      ) : null}
    </div>
  );
}

function RequestTimeline({
  detail,
  locale,
  t,
}: {
  detail: ActiveDismissalRequestDetail["timeline"];
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <section aria-labelledby="nedaa-request-timeline-heading" className="space-y-3">
      <div>
        <h3
          id="nedaa-request-timeline-heading"
          className="text-sm font-bold text-gray-900"
        >
          {t("operations_history.timeline")}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          {t("history.timeline_subtitle")}
        </p>
      </div>
      {detail.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          {t("operations_timeline.no_events")}
        </div>
      ) : (
        <ol className="relative space-y-0 border-s-2 border-gray-200 ps-5">
          {detail.map((event, index) => {
            const isFinalEvent = index === detail.length - 1;
            const isEscalation = event.type === "request_escalated";
            const eventLabel =
              event.type === "request_created"
                ? t("operations_timeline.request_created")
                : isEscalation
                  ? t("operations_timeline.request_escalated")
                : t("operations_timeline.status_changed");
            const statusChange =
              event.type === "request_created"
                ? t("operations_timeline.initial_status", {
                    status: event.statusTo
                      ? t(`operations_status.${event.statusTo}`)
                      : "-",
                  })
                : isEscalation
                  ? t("operations_timeline.escalation_recorded")
                : t("operations_timeline.status_changed_from_to", {
                    from: event.statusFrom
                      ? t(`operations_status.${event.statusFrom}`)
                      : "-",
                    to: event.statusTo
                      ? t(`operations_status.${event.statusTo}`)
                      : "-",
                  });

            return (
              <li
                key={`${event.createdAt}-${event.type}`}
                className="relative pb-5 last:pb-0"
              >
                <span
                  className={`absolute -start-[1.55rem] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${isEscalation ? "bg-amber-500" : isFinalEvent ? "bg-emerald-500" : "bg-primary"}`}
                  aria-hidden="true"
                >
                  {isEscalation ? (
                    <AlertTriangle className="h-3 w-3 text-white" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  )}
                </span>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {eventLabel}
                  </p>
                  <time className="text-xs text-gray-500">
                    {formatHistoryDateTime(event.createdAt, locale)}
                  </time>
                </div>
                <p className="mt-1 text-sm text-gray-600">{statusChange}</p>
                {event.note ? (
                  <div
                    className={`mt-2 rounded-lg border px-3 py-2 text-sm ${isFinalEvent ? "border-amber-200 bg-amber-50 text-amber-900" : "border-gray-200 bg-gray-50 text-gray-700"}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      {t("operations_timeline.note")}
                    </p>
                    <p className="mt-1">{event.note}</p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function HistoryDetailContent({
  detail,
  locale,
  t,
}: HistoryDetailContentProps) {
  const statusLabel = t(`operations_status.${detail.status}`);
  const waitSignal = detail.wait.urgent
    ? t("operations_signals.urgent")
    : detail.wait.delayed
      ? t("operations_signals.delayed")
      : t("operations_signals.normal");
  const lifecycleMilestones = [
    { label: t("operations_history.requested_at"), at: detail.requestedAt },
    { label: t("operations_history.called_at"), at: detail.calledAt },
    { label: t("operations_history.ready_at"), at: detail.readyAt },
    { label: t("operations_history.handed_over_at"), at: detail.handedOverAt },
  ].filter((milestone): milestone is { label: string; at: string } => Boolean(milestone.at));

  return (
    <div className="space-y-5 py-3">
      <section
        aria-labelledby="nedaa-history-summary-heading"
        className="space-y-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t("operations_history.summary")}
            </p>
            <h3
              id="nedaa-history-summary-heading"
              className="mt-1 text-lg font-bold text-gray-900"
            >
              {detail.child.displayName}
            </h3>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${requestStatusTone(detail.status)}`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
          <HistoryIdentityItem
            icon={UserRound}
            label={t("operations_history.grade_section")}
            value={`${detail.child.grade || "-"} · ${detail.child.section || "-"}`}
          />
          <HistoryIdentityItem
            icon={MapPin}
            label={t("operations_history.gate")}
            value={gateLabel(detail.gate)}
          />
          <HistoryIdentityItem
            label={t("operations_history.classroom")}
            value={detail.child.classroom || "-"}
          />
          <HistoryIdentityItem
            label={t("operations_history.request_id")}
            value={detail.id.slice(0, 8)}
            title={detail.id}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <HistoryMetric
            label={t("operations_history.wait_duration")}
            value={t("operations_history.wait_minutes", {
              minutes: detail.wait.minutes,
            })}
            icon={Clock3}
          />
          <HistoryMetric
            label={t("operations_fields.signals")}
            value={waitSignal}
            icon={detail.wait.urgent ? AlertTriangle : ShieldCheck}
          />
          <HistoryMetric
            label={t("operations_history.updated_at")}
            value={formatHistoryDateTime(detail.updatedAt, locale)}
            icon={RefreshCw}
          />
          <HistoryMetric
            label={t("operations_history.escalation")}
            value={
              detail.escalation.escalated
                ? t("operations_history.escalated")
                : t("operations_history.not_escalated")
            }
            icon={detail.escalation.escalated ? AlertTriangle : ShieldCheck}
          />
        </div>

        {detail.wait.delayed || detail.wait.urgent ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${detail.wait.urgent ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}
            role="status"
          >
            <p className="font-semibold">{waitSignal}</p>
            <p className="mt-1 text-xs opacity-80">
              {t("operations_history.signal_threshold", {
                waitMinutes: detail.wait.minutes,
                thresholdMinutes: detail.wait.urgent
                  ? (detail.wait.urgentThresholdMinutes ?? "-")
                  : (detail.wait.thresholdMinutes ?? "-"),
              })}
            </p>
          </div>
        ) : null}
      </section>

      <section
        aria-labelledby="nedaa-history-lifecycle-heading"
        className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
      >
        <h3
          id="nedaa-history-lifecycle-heading"
          className="text-sm font-bold text-gray-900"
        >
          {t("operations_history.lifecycle")}
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {lifecycleMilestones.map((milestone, index) => (
            <div
              key={milestone.label}
              className="relative rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
            >
              <span
                className={`mb-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${index === lifecycleMilestones.length - 1 && detail.status === "handed_over" ? "bg-emerald-600" : "bg-primary"}`}
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <p className="text-xs font-semibold text-gray-500">
                {milestone.label}
              </p>
              <time className="mt-1 block text-sm font-bold text-gray-900">
                {formatHistoryDateTime(milestone.at, locale)}
              </time>
            </div>
          ))}
        </div>
      </section>

      {detail.escalation.escalated ? (
        <section
          aria-labelledby="nedaa-history-escalation-heading"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950"
          role="status"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-100 p-2">
              <AlertTriangle
                className="h-5 w-5 text-amber-700"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                id="nedaa-history-escalation-heading"
                className="text-sm font-bold"
              >
                {t("operations_history.escalated")}
              </h3>
              <p className="mt-1 text-sm text-amber-900">
                {t("operations_history.escalation_status_unchanged", {
                  status: statusLabel,
                })}
              </p>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {detail.escalation.reason ? (
                  <div>
                    <dt className="text-xs font-semibold text-amber-800">
                      {t("operations_history.escalation_reason")}
                    </dt>
                    <dd className="mt-0.5 font-semibold">
                      {t(`operations_reasons.${detail.escalation.reason}`)}
                    </dd>
                  </div>
                ) : null}
                {detail.escalation.escalatedAt ? (
                  <div>
                    <dt className="text-xs font-semibold text-amber-800">
                      {t("operations_history.escalated_at")}
                    </dt>
                    <dd className="mt-0.5 font-semibold">
                      {formatHistoryDateTime(detail.escalation.escalatedAt, locale)}
                    </dd>
                  </div>
                ) : null}
              </dl>
              {detail.escalation.note ? (
                <div className="mt-3 border-t border-amber-200 pt-3 text-sm">
                  <p className="text-xs font-semibold text-amber-800">
                    {t("operations_timeline.note")}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">
                    {detail.escalation.note}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <RequestTimeline detail={detail.timeline} locale={locale} t={t} />
    </div>
  );
}

function HistoryIdentityItem({
  icon: Icon,
  label,
  value,
  title,
}: {
  icon?: typeof UserRound;
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      {Icon ? (
        <Icon
          className="mt-0.5 h-4 w-4 shrink-0 text-gray-500"
          aria-hidden="true"
        />
      ) : null}
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p
          className="truncate text-sm font-semibold text-gray-900"
          title={title}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function HistoryMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Clock3;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      <p className="mt-2 text-[11px] font-semibold leading-tight text-gray-500">
        {label}
      </p>
      <p
        className="mt-1 truncate text-sm font-bold text-gray-900"
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function OperationsFilterGroup({
  children,
  columns = "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  id,
  title,
}: OperationsFilterGroupProps) {
  const headingId = `${id}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-3 border-t border-gray-200 pt-4 first:border-t-0 first:pt-0"
      role="region"
    >
      <h3 id={headingId} className="text-sm font-semibold text-gray-900">
        {title}
      </h3>
      <div className={`grid gap-3 ${columns}`}>{children}</div>
    </section>
  );
}

const OPERATIONS_PAGE_SIZE = 10;
const emptyFilters: OperationsFilters = {
  search: "",
  gateId: "",
  status: "",
  expanded: false,
  stageId: "",
  gradeId: "",
  sectionId: "",
  classroomId: "",
  sort: "urgency_desc",
  page: 1,
  limit: OPERATIONS_PAGE_SIZE,
  statuses: [],
  childId: "",
  dateFrom: "",
  dateTo: "",
  activeOnly: false,
  terminalOnly: false,
  delayedOnly: false,
  urgentOnly: false,
  escalatedOnly: false,
};
const activeStatuses: DismissalRequestStatus[] = [
  "requested",
  "queued",
  "called",
  "moving",
  "at_gate",
  "ready",
];
const waitingStatuses: DismissalRequestStatus[] = [
  "called",
  "moving",
  "at_gate",
  "ready",
];
const historyStatuses: DismissalRequestHistoryStatus[] = [
  ...activeStatuses,
  "handed_over",
  "cancelled",
  "expired",
];
const nextStatusByCurrentStatus: Record<
  DismissalRequestStatus,
  Exclude<DismissalRequestStatus, "requested">[]
> = {
  requested: ["queued", "called"],
  queued: ["called"],
  called: ["moving", "at_gate"],
  moving: ["at_gate"],
  at_gate: ["ready"],
  ready: [],
};
const escalationReasons = [
  "student_not_arrived",
  "gate_congestion",
  "parent_waiting",
  "safety_concern",
  "manual_follow_up",
  "other",
] as const;

function isDeliveryNoLongerReadyError(error: unknown): boolean {
  return isApiError(error) && error.code === "dismissal.delivery.not_ready";
}

function formatStudentOptionLabel(student: Student, locale: string): string {
  const name =
    locale === "ar"
      ? student.full_name_ar || student.full_name_en
      : student.full_name_en || student.full_name_ar;
  const studentEmail = student.contact?.student_email?.trim();

  return studentEmail ? `${name} (${studentEmail})` : name;
}

const emptyActiveSummary: ActiveDismissalRequestsSummary = {
  totalCount: 0,
  requestedCount: 0,
  queuedCount: 0,
  calledCount: 0,
  movingCount: 0,
  atGateCount: 0,
  readyCount: 0,
  delayedCount: 0,
  urgentCount: 0,
};

const emptyWaitingSummary: DismissalWaitingStudentsSummary = {
  totalCount: 0,
  calledCount: 0,
  movingCount: 0,
  atGateCount: 0,
  readyCount: 0,
  arrivedCount: 0,
  notArrivedCount: 0,
  delayedCount: 0,
  urgentCount: 0,
};

const emptyHistorySummary: DismissalRequestHistorySummary = {
  totalCount: 0,
  activeCount: 0,
  terminalCount: 0,
  delayedCount: 0,
  urgentCount: 0,
  escalatedCount: 0,
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function gateLabel(gate: { name: string; code: string } | null) {
  if (!gate) return "-";
  const normalizedName = gate.name.replace(/[\s_-]/g, "");
  const normalizedCode = gate.code.replace(/[\s_-]/g, "");
  return normalizedName === normalizedCode ? gate.name : `${gate.name} (${gate.code})`;
}

function toSnakeCase(value: string) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function createBaseRequestParams(
  q: string,
  gateId: string,
  status: string,
): ListActiveDismissalRequestsParams {
  return {
    ...(q.trim() ? { q: q.trim() } : {}),
    ...(gateId ? { gateId } : {}),
    ...(status ? { status } : {}),
    page: 1,
    limit: OPERATIONS_PAGE_SIZE,
  };
}

function createActiveRequestParams(
  filters: Pick<
    OperationsFilters,
    | "gateId"
    | "status"
    | "stageId"
    | "gradeId"
    | "sectionId"
    | "classroomId"
    | "sort"
    | "page"
    | "limit"
  >,
  debouncedSearch: string,
): ListActiveDismissalRequestsParams {
  return {
    ...createBaseRequestParams(debouncedSearch, filters.gateId, filters.status),
    ...(filters.stageId ? { stageId: filters.stageId } : {}),
    ...(filters.gradeId ? { gradeId: filters.gradeId } : {}),
    ...(filters.sectionId ? { sectionId: filters.sectionId } : {}),
    ...(filters.classroomId ? { classroomId: filters.classroomId } : {}),
    sort: filters.sort as ActiveDismissalRequestSort,
    page: filters.page,
    limit: filters.limit,
  };
}

function createWaitingRequestParams(
  filters: Pick<
    OperationsFilters,
    | "gateId"
    | "status"
    | "stageId"
    | "gradeId"
    | "sectionId"
    | "classroomId"
    | "sort"
    | "page"
    | "limit"
  >,
  debouncedSearch: string,
): ListDismissalWaitingStudentsParams {
  return {
    ...createBaseRequestParams(debouncedSearch, filters.gateId, filters.status),
    ...(filters.stageId ? { stageId: filters.stageId } : {}),
    ...(filters.gradeId ? { gradeId: filters.gradeId } : {}),
    ...(filters.sectionId ? { sectionId: filters.sectionId } : {}),
    ...(filters.classroomId ? { classroomId: filters.classroomId } : {}),
    sort: filters.sort as WaitingDismissalStudentSort,
    page: filters.page,
    limit: filters.limit,
  };
}

function startDateIso(date: string) {
  return `${date}T00:00:00.000Z`;
}

function endDateIso(date: string) {
  return `${date}T23:59:59.999Z`;
}

function createHistoryParams(
  filters: OperationsFilters,
): ListDismissalRequestHistoryParams {
  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.statuses.length
      ? { statuses: filters.statuses.join(",") }
      : {}),
    ...(filters.childId ? { childId: filters.childId } : {}),
    ...(filters.gateId ? { gateId: filters.gateId } : {}),
    ...(filters.stageId ? { stageId: filters.stageId } : {}),
    ...(filters.gradeId ? { gradeId: filters.gradeId } : {}),
    ...(filters.sectionId ? { sectionId: filters.sectionId } : {}),
    ...(filters.classroomId ? { classroomId: filters.classroomId } : {}),
    ...(filters.dateFrom ? { dateFrom: startDateIso(filters.dateFrom) } : {}),
    ...(filters.dateTo ? { dateTo: endDateIso(filters.dateTo) } : {}),
    ...(filters.activeOnly ? { activeOnly: true } : {}),
    ...(filters.terminalOnly ? { terminalOnly: true } : {}),
    ...(filters.delayedOnly ? { delayedOnly: true } : {}),
    ...(filters.urgentOnly ? { urgentOnly: true } : {}),
    ...(filters.escalatedOnly ? { escalatedOnly: true } : {}),
    page: filters.page,
    limit: filters.limit,
    sort: filters.sort as DismissalRequestHistorySort,
  };
}

export default function NedaaOperationsPage() {
  const t = useTranslations("nedaa");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { showSuccess, showError } = useToast();
  const { hasPermission } = usePermissions();
  const canView = hasPermission("dismissal.requests.view");
  const canManage = hasPermission("dismissal.requests.manage");
  const canDeliver = hasPermission("dismissal.requests.deliver");
  const canEscalate = hasPermission("dismissal.requests.escalate");
  const canViewHistory = hasPermission("dismissal.requests.history.view");
  const [activeTab, setActiveTab] = useState<OperationsTab>("active");
  const [activeRequests, setActiveRequests] = useState<
    ActiveDismissalRequest[]
  >([]);
  const [waitingStudents, setWaitingStudents] = useState<
    DismissalWaitingStudent[]
  >([]);
  const [historyItems, setHistoryItems] = useState<
    DismissalRequestHistoryItem[]
  >([]);
  const [activeSummary, setActiveSummary] = useState(emptyActiveSummary);
  const [waitingSummary, setWaitingSummary] = useState(emptyWaitingSummary);
  const [historySummary, setHistorySummary] = useState(emptyHistorySummary);
  const [gateOptionsSource, setGateOptionsSource] = useState<NedaaGate[]>([]);
  const [studentOptionsSource, setStudentOptionsSource] = useState<Student[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filtersByTab, setFiltersByTab] = useState<
    Record<OperationsTab, OperationsFilters>
  >({
    active: { ...emptyFilters },
    waiting: { ...emptyFilters, sort: "arrival_stage_asc" },
    history: { ...emptyFilters, sort: "created_at_desc" },
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [actionModal, setActionModal] = useState<ActionModalState | null>(null);
  const [requestDetail, setRequestDetail] =
    useState<ActiveDismissalRequestDetail | null>(null);
  const [pickupRecipients, setPickupRecipients] =
    useState<DismissalPickupRecipientsResponse | null>(null);
  const [historyDetail, setHistoryDetail] =
    useState<DismissalRequestHistoryDetail | null>(null);
  const [readOnlyModalLoading, setReadOnlyModalLoading] = useState(false);
  const [readOnlyModalError, setReadOnlyModalError] = useState<string | null>(
    null,
  );
  const [selectedStatus, setSelectedStatus] =
    useState<Exclude<DismissalRequestStatus, "requested">>("called");
  const [pickupCode, setPickupCode] = useState("");
  const [pickupRecipientToken, setPickupRecipientToken] = useState("");
  const [escalationReason, setEscalationReason] =
    useState<(typeof escalationReasons)[number]>("parent_waiting");
  const [actionNote, setActionNote] = useState("");
  const [isSavingAction, setIsSavingAction] = useState(false);
  const { tree: academicTree, isLoading: isAcademicTreeLoading } =
    useNedaaAcademicStructure();
  const currentFilters = filtersByTab[activeTab];
  const historyFilters = filtersByTab.history;
  const debouncedSearch = useDebounce(currentFilters.search, 350);
  const activeRequestParams = useMemo(
    () =>
      createActiveRequestParams(
        {
          gateId: currentFilters.gateId,
          status: currentFilters.status,
          stageId: currentFilters.stageId,
          gradeId: currentFilters.gradeId,
          sectionId: currentFilters.sectionId,
          classroomId: currentFilters.classroomId,
          sort: currentFilters.sort,
          page: currentFilters.page,
          limit: currentFilters.limit,
        },
        debouncedSearch,
      ),
    [
      currentFilters.classroomId,
      currentFilters.gateId,
      currentFilters.gradeId,
      currentFilters.limit,
      currentFilters.page,
      currentFilters.sectionId,
      currentFilters.sort,
      currentFilters.stageId,
      currentFilters.status,
      debouncedSearch,
    ],
  );
  const waitingRequestParams = useMemo(
    () =>
      createWaitingRequestParams(
        {
          gateId: currentFilters.gateId,
          status: currentFilters.status,
          stageId: currentFilters.stageId,
          gradeId: currentFilters.gradeId,
          sectionId: currentFilters.sectionId,
          classroomId: currentFilters.classroomId,
          sort: currentFilters.sort,
          page: currentFilters.page,
          limit: currentFilters.limit,
        },
        debouncedSearch,
      ),
    [
      currentFilters.classroomId,
      currentFilters.gateId,
      currentFilters.gradeId,
      currentFilters.limit,
      currentFilters.page,
      currentFilters.sectionId,
      currentFilters.sort,
      currentFilters.stageId,
      currentFilters.status,
      debouncedSearch,
    ],
  );
  const historyRequestParams = useMemo(
    () => createHistoryParams(historyFilters),
    [historyFilters],
  );
  const hasActiveFilters = Boolean(
    currentFilters.search.trim() ||
    currentFilters.gateId ||
    currentFilters.status ||
    currentFilters.stageId ||
    currentFilters.gradeId ||
    currentFilters.sectionId ||
    currentFilters.classroomId ||
    currentFilters.childId ||
    currentFilters.statuses.length ||
    currentFilters.dateFrom ||
    currentFilters.dateTo ||
    currentFilters.activeOnly ||
    currentFilters.terminalOnly ||
    currentFilters.delayedOnly ||
    currentFilters.urgentOnly ||
    currentFilters.escalatedOnly,
  );

  useEffect(() => {
    let cancelled = false;
    if (!canView) return;

    void listDismissalGates({ page: 1, limit: 100 })
      .then((response) => {
        if (!cancelled) setGateOptionsSource(response.data);
      })
      .catch(() => {
        if (!cancelled) setGateOptionsSource([]);
      });

    if (canViewHistory) {
      void fetchAllStudents()
        .then((students) => {
          if (!cancelled) setStudentOptionsSource(students);
        })
        .catch(() => {
          if (!cancelled) setStudentOptionsSource([]);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [canView, canViewHistory]);

  useEffect(() => {
    let cancelled = false;

    if (!canView) {
      void Promise.resolve().then(() => setIsLoading(false));
      return () => {
        cancelled = true;
      };
    }

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        if (activeTab === "active") {
          const response =
            await listActiveDismissalRequests(activeRequestParams);
          if (!cancelled) {
            setActiveRequests(response.data);
            setActiveSummary(response.summary);
            setLastRefreshedAt(new Date());
          }
        } else if (activeTab === "waiting") {
          const response =
            await listDismissalWaitingStudents(waitingRequestParams);
          if (!cancelled) {
            setWaitingStudents(response.data);
            setWaitingSummary(response.summary);
            setLastRefreshedAt(new Date());
          }
        } else if (canViewHistory) {
          const response =
            await listDismissalRequestHistory(historyRequestParams);
          if (!cancelled) {
            setHistoryItems(response.data);
            setHistorySummary(response.summary);
            setLastRefreshedAt(new Date());
          }
        }
      } catch (requestError) {
        if (!cancelled) {
          setLoadError(
            requestError instanceof Error
              ? requestError.message
              : t("messages.load_requests_failed"),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setHasLoaded(true);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    activeTab,
    activeRequestParams,
    canView,
    canViewHistory,
    debouncedSearch,
    currentFilters.gateId,
    refreshKey,
    currentFilters.status,
    historyRequestParams,
    t,
    waitingRequestParams,
  ]);

  const gateOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: t("filters.all_gates") },
      ...gateOptionsSource.map((gate) => ({
        value: gate.id,
        label: gateLabel(gate),
        searchText: `${gate.code} ${gate.name}`,
      })),
    ],
    [gateOptionsSource, t],
  );

  const studentOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: t("operations_filters.all") },
      ...studentOptionsSource.map((student) => ({
        value: student.id,
        label: formatStudentOptionLabel(student, locale),
        searchText: `${student.student_id || ""} ${student.full_name_en} ${student.full_name_ar} ${student.contact?.student_email || ""}`,
      })),
    ],
    [locale, studentOptionsSource, t],
  );

  const statusOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: t("filters.all_statuses") },
      ...(activeTab === "history"
        ? historyStatuses
        : activeTab === "waiting"
          ? waitingStatuses
          : activeStatuses
      ).map((status) => ({
        value: status,
        label: t(`operations_status.${status}`),
      })),
    ],
    [activeTab, t],
  );

  const academicSelection = useMemo<NedaaAcademicSelection>(
    () => ({
      stageId: currentFilters.stageId,
      gradeId: currentFilters.gradeId,
      sectionId: currentFilters.sectionId,
      classroomId: currentFilters.classroomId,
    }),
    [
      currentFilters.classroomId,
      currentFilters.gradeId,
      currentFilters.sectionId,
      currentFilters.stageId,
    ],
  );

  const academicOptions = useMemo(
    () =>
      academicTree
        ? getNedaaAcademicOptions(academicTree, academicSelection, locale)
        : { stages: [], grades: [], sections: [], classrooms: [] },
    [academicSelection, academicTree, locale],
  );

  const withAllOption = (options: SelectOption[]) => [
    { value: "", label: t("operations_filters.all") },
    ...options,
  ];

  const sortOptions = useMemo<SelectOption[]>(() => {
    const sorts =
      activeTab === "history"
        ? ([
            "created_at_desc",
            "created_at_asc",
            "updated_at_desc",
            "wait_minutes_desc",
          ] as DismissalRequestHistorySort[])
        : activeTab === "waiting"
          ? ([
              "arrival_stage_asc",
              "requested_at_asc",
              "requested_at_desc",
              "urgency_desc",
            ] as WaitingDismissalStudentSort[])
          : ([
              "urgency_desc",
              "requested_at_asc",
              "requested_at_desc",
            ] as ActiveDismissalRequestSort[]);
    return sorts.map((sort) => ({
      value: sort,
      label: t(`operations_filters.${sort}`),
    }));
  }, [activeTab, t]);

  const activeRows = useMemo<OperationTableRow[]>(
    () =>
      activeRequests.map((request) => ({
        student: request.child.displayName,
        requester: request.requester.displayName || "-",
        gate: gateLabel(request.gate),
        status: t(`operations_status.${request.status}`),
        wait: t("operations_fields.wait_minutes", {
          minutes: request.waitMinutes,
        }),
        signals: request.signals.urgent
          ? t("operations_signals.urgent")
          : request.signals.delayed
            ? t("operations_signals.delayed")
            : t("operations_signals.normal"),
        requestedAt: formatDateTime(request.requestedAt),
        activeRequest: request,
      })),
    [activeRequests, t],
  );

  const waitingRows = useMemo<OperationTableRow[]>(
    () =>
      waitingStudents.map((student) => ({
        student: student.child.displayName,
        gate: gateLabel(student.gate),
        status: t(`operations_status.${student.status}`),
        arrivalState: t(`operations_arrival.${student.arrivalState}`),
        wait: t("operations_fields.wait_minutes", {
          minutes: student.waitMinutes,
        }),
        signals: student.signals.urgent
          ? t("operations_signals.urgent")
          : student.signals.delayed
            ? t("operations_signals.delayed")
            : t("operations_signals.normal"),
        requestedAt: formatDateTime(student.requestedAt),
        updatedAt: formatDateTime(student.updatedAt),
        waitingStudent: student,
      })),
    [t, waitingStudents],
  );

  const historyRows = useMemo<OperationTableRow[]>(
    () =>
      historyItems.map((item) => ({
        student: item.child.displayName,
        gate: gateLabel(item.gate),
        status: t(`operations_status.${item.status}`),
        wait: t("operations_fields.wait_minutes", {
          minutes: item.wait.minutes,
        }),
        signals: item.escalation.escalated
          ? t("operations_signals.escalated")
          : item.wait.urgent
            ? t("operations_signals.urgent")
            : item.wait.delayed
              ? t("operations_signals.delayed")
              : t("operations_signals.normal"),
        requestedAt: formatDateTime(item.requestedAt),
        updatedAt: formatDateTime(item.updatedAt),
        historyItem: item,
      })),
    [historyItems, t],
  );

  const openRecipients = useCallback((request?: ActiveDismissalRequest) => {
    if (!request) return;
    if (request.status !== "ready") {
      showError(t("messages.recipients_available_when_ready"));
      return;
    }
    setRequestDetail(null);
    setPickupRecipients(null);
    setHistoryDetail(null);
    setReadOnlyModalError(null);
    setReadOnlyModalLoading(true);
    setActionModal({
      type: "recipients",
      requestId: request.id,
      title: request.child.displayName,
    });
    void listDismissalPickupRecipients(request.id)
      .then((response) => setPickupRecipients(response))
      .catch((error) => {
        if (isDeliveryNoLongerReadyError(error)) {
          setReadOnlyModalError(t("messages.delivery_not_ready"));
          setRefreshKey((current) => current + 1);
          return;
        }
        setReadOnlyModalError(
          getNedaaApiErrorMessage(error, t, "operations.detail_failed"),
        );
      })
      .finally(() => setReadOnlyModalLoading(false));
  }, [showError, t]);

  const openDetail = useCallback((requestId?: string) => {
    if (!requestId) return;
    setRequestDetail(null);
    setPickupRecipients(null);
    setHistoryDetail(null);
    setReadOnlyModalError(null);
    setReadOnlyModalLoading(true);
    setActionModal({
      type: "detail",
      requestId,
      title: t("operations_actions.view"),
    });
    void fetchDismissalRequest(requestId)
      .then((response) => setRequestDetail(response.request))
      .catch((error) =>
        setReadOnlyModalError(
          getNedaaApiErrorMessage(error, t, "operations.detail_failed"),
        ),
      )
      .finally(() => setReadOnlyModalLoading(false));
  }, [t]);

  const openHistoryDetail = useCallback((requestId?: string) => {
    if (!requestId) return;
    setRequestDetail(null);
    setPickupRecipients(null);
    setHistoryDetail(null);
    setReadOnlyModalError(null);
    setReadOnlyModalLoading(true);
    setActionModal({
      type: "history",
      requestId,
      title: t("operations_actions.view_history"),
    });
    void fetchDismissalRequestHistoryItem(requestId)
      .then((response) => setHistoryDetail(response.request))
      .catch((error) =>
        setReadOnlyModalError(
          getNedaaApiErrorMessage(error, t, "operations.detail_failed"),
        ),
      )
      .finally(() => setReadOnlyModalLoading(false));
  }, [t]);

  const openDeliveryModal = useCallback((request?: ActiveDismissalRequest) => {
    if (!canDeliver || !request || request.status !== "ready") return;
    setPickupCode("");
    setPickupRecipientToken("");
    setActionNote("");
    setPickupRecipients(null);
    setReadOnlyModalError(null);
    setReadOnlyModalLoading(true);
    setActionModal({
      type: "delivery",
      requestId: request.id,
      title: request.child.displayName,
      requestStatus: request.status,
    });
    void listDismissalPickupRecipients(request.id)
      .then((response) => {
        setPickupRecipients(response);
        setPickupRecipientToken(
          response.recipients[0]?.pickupRecipientToken ?? "",
        );
      })
      .catch((error) =>
        setReadOnlyModalError(
          getNedaaApiErrorMessage(error, t, "operations.detail_failed"),
        ),
      )
      .finally(() => setReadOnlyModalLoading(false));
  }, [canDeliver, t]);

  const openStatusModal = useCallback((request?: ActiveDismissalRequest) => {
    if (!canManage || !request) return;
    const availableStatuses = nextStatusByCurrentStatus[request.status];
    if (availableStatuses.length === 0) return;
    setSelectedStatus(availableStatuses[0]);
    setActionNote("");
    setActionModal({
      type: "status",
      requestId: request.id,
      title: request.child.displayName,
      requestStatus: request.status,
    });
  }, [canManage]);

  const openArrivalModal = useCallback((student?: DismissalWaitingStudent) => {
    if (!canManage || !student) return;
    setActionNote("");
    setActionModal({
      type: "arrival",
      requestId: student.id,
      title: student.child.displayName,
      waitingStudent: student,
    });
  }, [canManage]);

  const openEscalationModal = useCallback((request?: ActiveDismissalRequest) => {
    if (!canEscalate || !request) return;
    setEscalationReason("parent_waiting");
    setActionNote("");
    setActionModal({
      type: "escalation",
      requestId: request.id,
      title: request.child.displayName,
    });
  }, [canEscalate]);

  const activeColumns = useMemo<Column<OperationTableRow>[]>(
    () => [
      {
        key: "student",
        label: t("operations_fields.student"),
        searchable: true,
      },
      { key: "requester", label: t("operations_fields.requester") },
      { key: "gate", label: t("table.gate") },
      { key: "status", label: t("table.status") },
      { key: "wait", label: t("operations_fields.wait") },
      {
        key: "signals",
        label: t("operations_fields.signals"),
        render: (_value, row) => (
          <SignalBadge
            label={row.signals}
            tone={getSignalTone({
              urgent: row.activeRequest?.signals.urgent ?? false,
              delayed: row.activeRequest?.signals.delayed ?? false,
              escalated: false,
            })}
          />
        ),
      },
      { key: "requestedAt", label: t("operations_fields.requested_at") },
      {
        key: "actions",
        label: t("table.actions"),
        sortable: false,
        render: (_value, row) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openDetail(row.activeRequest?.id)}
            >
              {t("operations_actions.view")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="hidden sm:inline-flex"
              onClick={() => openRecipients(row.activeRequest)}
            >
              {t("operations_actions.recipients")}
            </Button>
            {row.activeRequest &&
            nextStatusByCurrentStatus[row.activeRequest.status].length > 0 ? (
              <Button
                size="sm"
                className="hidden sm:inline-flex"
                disabled={!canManage}
                onClick={() => openStatusModal(row.activeRequest)}
              >
                {t("operations_actions.advance_status")}
              </Button>
            ) : null}
            {row.activeRequest?.status === "ready" ? (
              <Button
                size="sm"
                variant="success"
                disabled={!canDeliver}
                onClick={() => openDeliveryModal(row.activeRequest)}
              >
                {t("operations_actions.deliver")}
              </Button>
            ) : null}
            <Button
                size="sm"
                variant="danger"
                className="hidden sm:inline-flex"
              disabled={!canEscalate}
              onClick={() => openEscalationModal(row.activeRequest)}
            >
              {t("operations_actions.escalate")}
            </Button>
            <details className="relative sm:hidden">
              <summary className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700">
                {t("operations_actions.more")}
              </summary>
              <div className="absolute end-0 z-20 mt-1 flex min-w-36 flex-col gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`${t("operations_actions.recipients")} ${t("operations_actions.more")}`}
                  onClick={() => openRecipients(row.activeRequest)}
                >
                  {t("operations_actions.recipients")}
                </Button>
                {row.activeRequest && nextStatusByCurrentStatus[row.activeRequest.status].length > 0 ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!canManage}
                    aria-label={`${t("operations_actions.advance_status")} ${t("operations_actions.more")}`}
                    onClick={() => openStatusModal(row.activeRequest)}
                  >
                    {t("operations_actions.advance_status")}
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!canEscalate}
                  aria-label={`${t("operations_actions.escalate")} ${t("operations_actions.more")}`}
                  onClick={() => openEscalationModal(row.activeRequest)}
                >
                  {t("operations_actions.escalate")}
                </Button>
              </div>
            </details>
            {row.activeRequest?.status === "ready" ? (
              <p className="w-full text-end text-xs font-medium text-emerald-700">
                {t("operations_guidance.ready_for_handover")}
              </p>
            ) : row.activeRequest ? (
              <p className="w-full text-end text-xs text-gray-500">
                {t("operations_guidance.advance_to", {
                  status: t(`operations_status.${nextStatusByCurrentStatus[row.activeRequest.status][0]}`),
                })}
              </p>
            ) : null}
          </div>
        ),
      },
    ],
    [
      canDeliver,
      canEscalate,
      canManage,
      openDeliveryModal,
      openDetail,
      openEscalationModal,
      openRecipients,
      openStatusModal,
      t,
    ],
  );

  const waitingColumns = useMemo<Column<OperationTableRow>[]>(
    () => [
      {
        key: "student",
        label: t("operations_fields.student"),
        searchable: true,
      },
      { key: "gate", label: t("table.gate") },
      { key: "arrivalState", label: t("operations_fields.arrival_state") },
      { key: "status", label: t("table.status") },
      { key: "wait", label: t("operations_fields.wait") },
      {
        key: "signals",
        label: t("operations_fields.signals"),
        render: (_value, row) => (
          <SignalBadge
            label={row.signals}
            tone={getSignalTone({
              urgent: row.waitingStudent?.signals.urgent ?? false,
              delayed: row.waitingStudent?.signals.delayed ?? false,
              escalated: false,
            })}
          />
        ),
      },
      { key: "updatedAt", label: t("operations_fields.updated_at") },
      {
        key: "actions",
        label: t("table.actions"),
        sortable: false,
        render: (_value, row) => (
          <div className="flex justify-end gap-2">
            {row.waitingStudent?.status === "called" ||
            row.waitingStudent?.status === "moving" ? (
              <Button
                size="sm"
                disabled={!canManage}
                onClick={() => openArrivalModal(row.waitingStudent)}
              >
                {t("operations_actions.confirm_arrival")}
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canManage, openArrivalModal, t],
  );

  const historyColumns = useMemo<Column<OperationTableRow>[]>(
    () => [
      {
        key: "student",
        label: t("operations_fields.student"),
        searchable: true,
      },
      { key: "gate", label: t("table.gate") },
      { key: "status", label: t("table.status") },
      { key: "wait", label: t("operations_fields.wait") },
      {
        key: "signals",
        label: t("operations_fields.signals"),
        render: (_value, row) => (
          <SignalBadge
            label={row.signals}
            tone={getSignalTone({
              urgent: row.historyItem?.wait.urgent ?? false,
              delayed: row.historyItem?.wait.delayed ?? false,
              escalated: row.historyItem?.escalation.escalated ?? false,
            })}
          />
        ),
      },
      { key: "requestedAt", label: t("operations_fields.requested_at") },
      { key: "updatedAt", label: t("operations_fields.updated_at") },
      {
        key: "actions",
        label: t("table.actions"),
        sortable: false,
        render: (_value, row) => (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openHistoryDetail(row.historyItem?.id)}
            >
              {t("operations_actions.view_history")}
            </Button>
          </div>
        ),
      },
    ],
    [openHistoryDetail, t],
  );

  const updateCurrentFilters = (updates: Partial<OperationsFilters>) => {
    setFiltersByTab((current) => ({
      ...current,
      [activeTab]: { ...current[activeTab], ...updates },
    }));
  };

  const updateAcademicFilter = (
    key: keyof NedaaAcademicSelection,
    value: string,
  ) => {
    if (activeTab === "history") {
      updateCurrentFilters({ [key]: value, page: 1 });
      return;
    }
    updateCurrentFilters({
      stageId: "",
      gradeId: "",
      sectionId: "",
      classroomId: "",
      [key]: value,
      page: 1,
    });
  };

  const resetFilters = () => {
    updateCurrentFilters({
      search: "",
      gateId: "",
      status: "",
      stageId: "",
      gradeId: "",
      sectionId: "",
      classroomId: "",
      statuses: [],
      childId: "",
      dateFrom: "",
      dateTo: "",
      activeOnly: false,
      terminalOnly: false,
      delayedOnly: false,
      urgentOnly: false,
      escalatedOnly: false,
      sort:
        activeTab === "history"
          ? "created_at_desc"
          : activeTab === "waiting"
            ? "arrival_stage_asc"
            : "urgency_desc",
      page: 1,
    });
  };

  const closeActionModal = () => {
    if (isSavingAction) return;
    setActionModal(null);
    setActionNote("");
    setPickupCode("");
    setPickupRecipientToken("");
    setRequestDetail(null);
    setPickupRecipients(null);
    setHistoryDetail(null);
    setReadOnlyModalError(null);
    setReadOnlyModalLoading(false);
  };

  const saveAction = async () => {
    if (!actionModal) return;

    if (
      (actionModal.type === "status" || actionModal.type === "arrival") &&
      !canManage
    ) {
      return;
    }
    if (actionModal.type === "delivery_confirm" && !canDeliver) return;
    if (actionModal.type === "escalation" && !canEscalate) return;

    setIsSavingAction(true);
    try {
      if (actionModal.type === "status") {
        await updateDismissalRequestStatus(actionModal.requestId, {
          status: selectedStatus,
          note: actionNote.trim() || null,
        });
        showSuccess(t("messages.request_updated"));
      } else if (actionModal.type === "arrival") {
        await confirmDismissalStudentArrival(actionModal.requestId, {
          note: actionNote.trim() || null,
        });
        showSuccess(t("messages.request_updated"));
      } else if (actionModal.type === "delivery") {
        if (!pickupRecipientToken) {
          showError(t("messages.request_update_failed"));
          return;
        }
        setActionModal({ ...actionModal, type: "delivery_confirm" });
        return;
      } else if (actionModal.type === "delivery_confirm") {
        await deliverDismissalRequest(actionModal.requestId, {
          pickupCode: pickupCode.trim() || undefined,
          pickupRecipientToken: pickupRecipientToken.trim() || undefined,
          note: actionNote.trim() || null,
        });
        showSuccess(t("messages.request_updated"));
      } else if (actionModal.type === "escalation") {
        const response = await escalateDismissalRequest(actionModal.requestId, {
          reason: escalationReason,
          note: actionNote.trim() || null,
        });
        if (!response.escalation.changed) {
          showError(t("messages.escalation_already_recorded"));
          setRefreshKey((current) => current + 1);
          closeActionModal();
          return;
        }
        showSuccess(t("messages.escalation_saved"));
      }
      setRefreshKey((current) => current + 1);
      closeActionModal();
    } catch (error) {
      if (
        actionModal.type === "delivery_confirm" &&
        isDeliveryNoLongerReadyError(error)
      ) {
        showError(t("messages.delivery_not_ready"));
        setRefreshKey((current) => current + 1);
        closeActionModal();
        return;
      }
      showError(
        getNedaaApiErrorMessage(error, t, "messages.request_update_failed"),
      );
    } finally {
      setIsSavingAction(false);
    }
  };

  if (!canView) return <NedaaAccessNotice />;
  if (!hasLoaded && isLoading) return <MainLoader />;
  if (loadError) {
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-red-600">{loadError}</p>
      </div>
    );
  }

  const activeDataset =
    activeTab === "active"
      ? {
          rows: activeRows,
          columns: activeColumns,
          total: activeSummary.totalCount,
          summary: activeSummary,
        }
      : activeTab === "waiting"
        ? {
            rows: waitingRows,
            columns: waitingColumns,
            total: waitingSummary.totalCount,
            summary: waitingSummary,
          }
        : {
            rows: historyRows,
            columns: historyColumns,
            total: historySummary.totalCount,
            summary: historySummary,
          };

  return (
    <div className="space-y-6 p-6" aria-live="polite">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("operations.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("operations.subtitle")}
          </p>
          <p className="mt-2 text-xs text-gray-500" role="status">
            {isLoading
              ? t("operations.refreshing")
              : lastRefreshedAt
                ? t("operations.last_refreshed", {
                    time: formatDateTime(lastRefreshedAt.toISOString()),
                  })
                : "-"}
          </p>
        </div>
        <Button
          variant="secondary"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={() => setRefreshKey((current) => current + 1)}
          disabled={isLoading}
        >
          {t("operations_actions.refresh")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
        {(["active", "waiting", "history"] as OperationsTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            disabled={tab === "history" && !canViewHistory}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t(`operations_tabs.${tab}`)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryEntries(activeDataset.summary, activeTab, t).map((entry) => (
          <KPICardV2
            key={entry.label}
            title={entry.label}
            value={entry.value}
            icon={entry.icon}
            iconColor={entry.iconColor}
            iconBgColor={entry.iconBgColor}
            showChart={false}
            className="bg-white"
          />
        ))}
      </div>

      <FilterPanel
        key={activeTab}
        title={t(`operations_tabs.${activeTab}`)}
        showFilters={currentFilters.expanded}
        onToggleFilters={() =>
          updateCurrentFilters({ expanded: !currentFilters.expanded })
        }
        hasActiveFilters={hasActiveFilters}
        toggleTitle={t("filters.show_filters")}
        toggleAriaLabel={t("filters.show_filters")}
        searchSlot={
          activeTab === "history" ? (
            <Select
              label={t("operations_filters.child")}
              value={currentFilters.childId}
              onChange={(childId) => updateCurrentFilters({ childId, page: 1 })}
              options={studentOptions}
              searchable
              searchPlaceholder={t("operations_filters.search_child")}
              noOptionsText={t("filters.no_options")}
              noResultsText={t("filters.no_results")}
            />
          ) : (
            <Input
              value={currentFilters.search}
              maxLength={120}
              onChange={(event) =>
                updateCurrentFilters({ search: event.target.value, page: 1 })
              }
              placeholder={t("operations_filters.search_placeholder")}
            />
          )
        }
        filtersSlot={
          <div className="space-y-4">
            <OperationsFilterGroup
              id={`nedaa-${activeTab}-primary-filters`}
              title={t("operations_filters.primary_group")}
            >
              <Select
                label={t("table.gate")}
                value={currentFilters.gateId}
                onChange={(gateId) => updateCurrentFilters({ gateId, page: 1 })}
                options={gateOptions}
                searchable
                searchPlaceholder={t("table.gate")}
                noOptionsText={t("filters.no_options")}
                noResultsText={t("filters.no_results")}
              />
              <Select
                label={t("table.status")}
                value={currentFilters.status}
                onChange={(status) => updateCurrentFilters({ status, page: 1 })}
                options={statusOptions}
              />
              <Select
                label={t("operations_filters.sort")}
                value={currentFilters.sort}
                onChange={(value) =>
                  updateCurrentFilters({
                    sort: value as
                      | ActiveDismissalRequestSort
                      | WaitingDismissalStudentSort
                      | DismissalRequestHistorySort,
                    page: 1,
                  })
                }
                options={sortOptions}
              />
            </OperationsFilterGroup>

            <OperationsFilterGroup
              columns="grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
              id={`nedaa-${activeTab}-academic-filters`}
              title={t("operations_filters.academic_group")}
            >
              <Select
                label={t("operations_filters.stage")}
                value={currentFilters.stageId}
                onChange={(value) => updateAcademicFilter("stageId", value)}
                options={withAllOption(academicOptions.stages)}
                disabled={isAcademicTreeLoading}
                searchable
                searchPlaceholder={t("operations_filters.stage")}
                noOptionsText={t("filters.no_options")}
                noResultsText={t("filters.no_results")}
              />
              <Select
                label={t("operations_filters.grade")}
                value={currentFilters.gradeId}
                onChange={(value) => updateAcademicFilter("gradeId", value)}
                options={withAllOption(academicOptions.grades)}
                disabled={isAcademicTreeLoading}
                searchable
                searchPlaceholder={t("operations_filters.grade")}
                noOptionsText={t("filters.no_options")}
                noResultsText={t("filters.no_results")}
              />
              <Select
                label={t("operations_filters.section")}
                value={currentFilters.sectionId}
                onChange={(value) => updateAcademicFilter("sectionId", value)}
                options={withAllOption(academicOptions.sections)}
                disabled={isAcademicTreeLoading}
                searchable
                searchPlaceholder={t("operations_filters.section")}
                noOptionsText={t("filters.no_options")}
                noResultsText={t("filters.no_results")}
              />
              <Select
                label={t("operations_filters.classroom")}
                value={currentFilters.classroomId}
                onChange={(value) => updateAcademicFilter("classroomId", value)}
                options={withAllOption(academicOptions.classrooms)}
                disabled={isAcademicTreeLoading}
                searchable
                searchPlaceholder={t("operations_filters.classroom")}
                noOptionsText={t("filters.no_options")}
                noResultsText={t("filters.no_results")}
              />
            </OperationsFilterGroup>

            {activeTab === "history" ? (
              <>
                <OperationsFilterGroup
                  columns="grid-cols-1 md:grid-cols-2"
                  id="nedaa-history-period-filters"
                  title={t("operations_filters.period_group")}
                >
                  <Input
                    type="date"
                    label={t("operations_filters.date_from")}
                    value={currentFilters.dateFrom}
                    max={currentFilters.dateTo || undefined}
                    onChange={(event) =>
                      updateCurrentFilters({
                        dateFrom: event.target.value,
                        page: 1,
                      })
                    }
                  />
                  <Input
                    type="date"
                    label={t("operations_filters.date_to")}
                    value={currentFilters.dateTo}
                    min={currentFilters.dateFrom || undefined}
                    onChange={(event) =>
                      updateCurrentFilters({
                        dateTo: event.target.value,
                        page: 1,
                      })
                    }
                  />
                </OperationsFilterGroup>

                <OperationsFilterGroup
                  columns="grid-cols-1"
                  id="nedaa-history-status-filters"
                  title={t("operations_filters.status_group")}
                >
                  <fieldset>
                    <legend className="sr-only">
                      {t("operations_filters.additional_statuses")}
                    </legend>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
                      {historyStatuses.map((status) => (
                        <label
                          key={status}
                          className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
                        >
                          <input
                            type="checkbox"
                            checked={currentFilters.statuses.includes(status)}
                            onChange={(event) =>
                              updateCurrentFilters({
                                statuses: event.target.checked
                                  ? [...currentFilters.statuses, status]
                                  : currentFilters.statuses.filter(
                                      (selectedStatus) =>
                                        selectedStatus !== status,
                                    ),
                                page: 1,
                              })
                            }
                            className="h-4 w-4 accent-primary"
                          />
                          {t(`operations_status.${status}`)}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </OperationsFilterGroup>

                <OperationsFilterGroup
                  columns="grid-cols-1"
                  id="nedaa-history-flags-filters"
                  title={t("operations_filters.flags_group")}
                >
                  <fieldset>
                    <legend className="sr-only">
                      {t("operations_filters.flags")}
                    </legend>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
                      {(
                        [
                          "activeOnly",
                          "terminalOnly",
                          "delayedOnly",
                          "urgentOnly",
                          "escalatedOnly",
                        ] as const
                      ).map((flag) => (
                        <label
                          key={flag}
                          className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
                        >
                          <input
                            type="checkbox"
                            checked={currentFilters[flag]}
                            onChange={(event) =>
                              updateCurrentFilters({
                                [flag]: event.target.checked,
                                ...(flag === "activeOnly" &&
                                event.target.checked
                                  ? { terminalOnly: false }
                                  : {}),
                                ...(flag === "terminalOnly" &&
                                event.target.checked
                                  ? { activeOnly: false }
                                  : {}),
                                page: 1,
                              })
                            }
                            className="h-4 w-4 accent-primary"
                          />
                          {t(`operations_filters.${toSnakeCase(flag)}`)}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </OperationsFilterGroup>
              </>
            ) : null}
          </div>
        }
        clearAction={
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            {t("filters.clear_filters")}
          </Button>
        }
      />

      <DataTable
        columns={activeDataset.columns}
        data={activeDataset.rows}
        itemsPerPage={currentFilters.limit}
        isLoading={isLoading}
        showDensityToggle
        serverPagination={{
          enabled: true,
          currentPage: currentFilters.page,
          pageSize: currentFilters.limit,
          totalItems: activeDataset.total,
          onPageChange: (page) => {
            updateCurrentFilters({ page });
          },
          onPageSizeChange: (limit) => {
            updateCurrentFilters({ limit, page: 1 });
          },
        }}
        emptyTitle={t("operations.empty_title")}
        emptyDescription={t("operations.empty_description")}
      />

      <Modal
        isOpen={Boolean(actionModal)}
        onClose={closeActionModal}
        title={actionModal?.title}
        size="xl"
        footer={
          actionModal?.type === "history" ||
          actionModal?.type === "detail" ||
          actionModal?.type === "recipients" ? (
            <Button variant="secondary" onClick={closeActionModal}>
              {tCommon("close")}
            </Button>
          ) : actionModal?.type === "delivery_confirm" ? (
            <>
              <Button
                variant="secondary"
                onClick={() =>
                  setActionModal((current) =>
                    current ? { ...current, type: "delivery" } : null,
                  )
                }
              >
                {t("operations_actions.back")}
              </Button>
              {renderActionFooter(
                actionModal,
                isSavingAction,
                false,
                t,
                saveAction,
              )}
            </>
          ) : (
            renderActionFooter(
              actionModal,
              isSavingAction,
              actionModal?.type === "delivery" &&
                (readOnlyModalLoading ||
                  Boolean(readOnlyModalError) ||
                  !pickupRecipientToken),
              t,
              saveAction,
            )
          )
        }
      >
        {actionModal?.type === "status" ? (
          <div className="space-y-4 py-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500">
              {(["requested", "queued", "called", "moving", "at_gate", "ready"] as DismissalRequestStatus[]).map(
                (status) => (
                  <span
                    key={status}
                    className={`rounded-full border px-2 py-1 ${
                      status === actionModal.requestStatus
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    {t(`operations_status.${status}`)}
                  </span>
                ),
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(actionModal.requestStatus
                ? nextStatusByCurrentStatus[actionModal.requestStatus]
                : []
              ).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setSelectedStatus(status)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                    selectedStatus === status
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {t(`operations_status.${status}`)}
                </button>
              ))}
            </div>
            <TextArea
              label={t("operations_fields.note")}
              value={actionNote}
              onChange={(event) => setActionNote(event.target.value)}
            />
          </div>
        ) : actionModal?.type === "arrival" ? (
          <div className="space-y-4 py-2">
            {actionModal.waitingStudent ? (
              <RequestContextContent
                detail={actionModal.waitingStudent}
                locale={locale}
                t={t}
              />
            ) : null}
            <TextArea
              label={t("operations_fields.note")}
              value={actionNote}
              onChange={(event) => setActionNote(event.target.value)}
            />
          </div>
        ) : actionModal?.type === "delivery" ? (
          <div className="space-y-4 py-2">
            {readOnlyModalError ? (
              <p className="text-sm text-red-600" role="alert">
                {readOnlyModalError}
              </p>
            ) : null}
            {readOnlyModalLoading ? (
              <p className="text-sm text-gray-600">{t("operations.detail_loading")}</p>
            ) : (
              <Select
                label={t("operations_actions.recipients")}
                value={pickupRecipientToken}
                onChange={setPickupRecipientToken}
                options={(pickupRecipients?.recipients ?? []).map((recipient) => ({
                  value: recipient.pickupRecipientToken,
                  label: recipient.relation
                    ? `${recipient.displayName} (${recipient.relation})`
                    : recipient.displayName,
                }))}
                noOptionsText={t("filters.no_options")}
                noResultsText={t("filters.no_results")}
              />
            )}
            {pickupRecipients?.policy.pickupCodeRequired ? (
              <Input
                label={t("operations_fields.pickup_code")}
                value={pickupCode}
                onChange={(event) => setPickupCode(event.target.value)}
              />
            ) : null}
            <TextArea
              label={t("operations_fields.note")}
              value={actionNote}
              onChange={(event) => setActionNote(event.target.value)}
            />
          </div>
        ) : actionModal?.type === "delivery_confirm" ? (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-semibold">{t("operations.delivery_confirmation")}</p>
              <p className="mt-1 text-amber-900">{actionModal.title}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
              <HistoryIdentityItem
                label={t("operations_actions.recipients")}
                value={
                  pickupRecipients?.recipients.find(
                    (recipient) => recipient.pickupRecipientToken === pickupRecipientToken,
                  )?.displayName ?? "-"
                }
              />
              <HistoryIdentityItem
                label={t("operations_fields.pickup_code")}
                value={
                  pickupRecipients?.policy.pickupCodeRequired
                    ? pickupCode || "-"
                    : t("operations.pickup_code_not_required")
                }
              />
            </div>
          </div>
        ) : actionModal?.type === "escalation" ? (
          <div className="space-y-4 py-2">
            <div
              className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950"
              role="status"
            >
              <Activity
                className="mt-0.5 h-5 w-5 shrink-0 text-blue-700"
                aria-hidden="true"
              />
              <p>{t("operations_guidance.escalation_continues")}</p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {escalationReasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setEscalationReason(reason)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                    escalationReason === reason
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {t(`operations_reasons.${reason}`)}
                </button>
              ))}
            </div>
            <TextArea
              label={t("operations_fields.note")}
              value={actionNote}
              onChange={(event) => setActionNote(event.target.value)}
            />
          </div>
        ) : actionModal?.type === "detail" ? (
          <ReadOnlyModalState
            isLoading={readOnlyModalLoading}
            error={readOnlyModalError}
            empty={!requestDetail}
            loadingLabel={t("operations.detail_loading")}
          >
            {requestDetail ? (
              <RequestContextContent
                detail={requestDetail}
                locale={locale}
                t={t}
                timeline={requestDetail.timeline}
              />
            ) : null}
          </ReadOnlyModalState>
        ) : actionModal?.type === "recipients" ? (
          <ReadOnlyModalState
            isLoading={readOnlyModalLoading}
            error={readOnlyModalError}
            empty={!pickupRecipients}
            loadingLabel={t("operations.detail_loading")}
          >
            {pickupRecipients ? (
              <div className="space-y-4 py-2 text-sm text-gray-700">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="font-semibold">
                        {t("operations_recipients.ready_for_handover")}
                      </p>
                      <p className="mt-1 text-xs text-emerald-800">
                        {pickupRecipients.request.child.displayName} · {gateLabel(pickupRecipients.request.gate)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-500">
                      {t("operations_recipients.pickup_code")}
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {pickupRecipients.policy.pickupCodeRequired
                        ? t("operations_recipients.pickup_code_required")
                        : t("operations_recipients.pickup_code_not_required")}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-500">
                      {t("operations_recipients.delegate_pickup")}
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {pickupRecipients.policy.delegatePickupAllowed
                        ? t("operations_recipients.delegate_allowed")
                        : t("operations_recipients.delegate_not_allowed")}
                    </p>
                  </div>
                </div>

                <section aria-labelledby="nedaa-authorized-recipients-heading">
                  <h3
                    id="nedaa-authorized-recipients-heading"
                    className="text-sm font-bold text-gray-900"
                  >
                    {t("operations_recipients.authorized_recipients")}
                  </h3>
                  <div className="mt-2 space-y-2">
                    {pickupRecipients.recipients.map((recipient) => (
                      <div
                        key={recipient.pickupRecipientToken}
                        className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <UserCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">
                              {recipient.displayName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {recipient.relation || t("operations_recipients.authorized_recipient")}
                            </p>
                          </div>
                        </div>
                        {recipient.isRequestingGuardian ? (
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                            {t("operations_recipients.requesting_guardian")}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : null}
          </ReadOnlyModalState>
        ) : actionModal?.type === "history" ? (
          <ReadOnlyModalState
            isLoading={readOnlyModalLoading}
            error={readOnlyModalError}
            empty={!historyDetail}
            loadingLabel={t("operations.detail_loading")}
          >
            {historyDetail ? (
              <HistoryDetailContent
                detail={historyDetail}
                locale={locale}
                t={t}
              />
            ) : null}
          </ReadOnlyModalState>
        ) : (
          <div className="py-3 text-sm text-gray-600">
            {t("operations.detail_loading")}
          </div>
        )}
      </Modal>
    </div>
  );
}

function ReadOnlyModalState({
  isLoading,
  error,
  empty,
  loadingLabel,
  children,
}: {
  isLoading: boolean;
  error: string | null;
  empty: boolean;
  loadingLabel: string;
  children: ReactNode;
}) {
  if (error) {
    return (
      <div className="py-3 text-sm text-red-600" role="alert">
        {error}
      </div>
    );
  }

  if (isLoading || empty) {
    return <div className="py-3 text-sm text-gray-600">{loadingLabel}</div>;
  }

  return children;
}

function summaryEntries(
  summary:
    | ActiveDismissalRequestsSummary
    | DismissalWaitingStudentsSummary
    | DismissalRequestHistorySummary,
  tab: OperationsTab,
  t: ReturnType<typeof useTranslations>,
) {
  if (tab === "active") {
    const activeSummary = summary as ActiveDismissalRequestsSummary;
    return [
      {
        label: t("operations_summary.total"),
        value: activeSummary.totalCount,
        icon: Activity,
        iconColor: "#2563eb",
        iconBgColor: "#dbeafe",
      },
      {
        label: t("operations_summary.called"),
        value: activeSummary.calledCount,
        icon: Users,
        iconColor: "#7c3aed",
        iconBgColor: "#ede9fe",
      },
      {
        label: t("operations_summary.ready"),
        value: activeSummary.readyCount,
        icon: CheckCircle2,
        iconColor: "#059669",
        iconBgColor: "#d1fae5",
      },
      {
        label: t("operations_summary.urgent"),
        value: activeSummary.urgentCount,
        icon: AlertTriangle,
        iconColor: "#dc2626",
        iconBgColor: "#fee2e2",
      },
    ];
  }
  if (tab === "waiting") {
    const waitingSummary = summary as DismissalWaitingStudentsSummary;
    return [
      {
        label: t("operations_summary.total"),
        value: waitingSummary.totalCount,
        icon: Users,
        iconColor: "#2563eb",
        iconBgColor: "#dbeafe",
      },
      {
        label: t("operations_summary.moving"),
        value: waitingSummary.movingCount,
        icon: Clock3,
        iconColor: "#d97706",
        iconBgColor: "#fef3c7",
      },
      {
        label: t("operations_summary.arrived"),
        value: waitingSummary.arrivedCount,
        icon: CheckCircle2,
        iconColor: "#059669",
        iconBgColor: "#d1fae5",
      },
      {
        label: t("operations_summary.urgent"),
        value: waitingSummary.urgentCount,
        icon: AlertTriangle,
        iconColor: "#dc2626",
        iconBgColor: "#fee2e2",
      },
    ];
  }
  const historySummary = summary as DismissalRequestHistorySummary;
  return [
    {
      label: t("operations_summary.total"),
      value: historySummary.totalCount,
      icon: History,
      iconColor: "#2563eb",
      iconBgColor: "#dbeafe",
    },
    {
      label: t("operations_summary.terminal"),
      value: historySummary.terminalCount,
      icon: CheckCircle2,
      iconColor: "#059669",
      iconBgColor: "#d1fae5",
    },
    {
      label: t("operations_summary.delayed"),
      value: historySummary.delayedCount,
      icon: Clock3,
      iconColor: "#d97706",
      iconBgColor: "#fef3c7",
    },
    {
      label: t("operations_summary.escalated"),
      value: historySummary.escalatedCount,
      icon: AlertTriangle,
      iconColor: "#dc2626",
      iconBgColor: "#fee2e2",
    },
  ];
}

function renderActionFooter(
  actionModal: ActionModalState | null,
  isSavingAction: boolean,
  disabled: boolean,
  t: ReturnType<typeof useTranslations>,
  saveAction: () => Promise<void>,
) {
  if (
    !actionModal ||
    actionModal.type === "detail" ||
    actionModal.type === "history" ||
    actionModal.type === "recipients"
  ) {
    return null;
  }

  const labelByType = {
    status: "operations_actions.save_status",
    arrival: "operations_actions.save_arrival",
    delivery: "operations_actions.save_delivery",
    delivery_confirm: "operations_actions.confirm_delivery",
    escalation: "operations_actions.save_escalation",
  } as const;

  return (
    <Button
      onClick={() => void saveAction()}
      loading={isSavingAction}
      disabled={disabled}
    >
      {t(labelByType[actionModal.type])}
    </Button>
  );
}
