"use client";

import {
  Activity,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Coins,
  ListChecks,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type {
  ReinforcementCompactTask,
  ReinforcementReviewStatusSummary,
  StudentReinforcementProgress,
} from "../types";

type StatusTone = "neutral" | "info" | "warning" | "success" | "danger";

const statusTone = (status: string): StatusTone => {
  switch (status) {
    case "completed":
    case "approved":
      return "success";
    case "in_progress":
      return "info";
    case "under_review":
    case "submitted":
      return "warning";
    case "cancelled":
    case "rejected":
      return "danger";
    default:
      return "neutral";
  }
};

const toneClasses: Record<StatusTone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  info: "border-blue-100 bg-blue-50 text-blue-700",
  warning: "border-amber-100 bg-amber-50 text-amber-800",
  success: "border-emerald-100 bg-emerald-50 text-emerald-700",
  danger: "border-red-100 bg-red-50 text-red-700",
};

const formatDate = (value: string | null | undefined, locale: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatDateOnly = (value: string | null | undefined, locale: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
};

const localizedTaskTitle = (task: ReinforcementCompactTask, locale: string) =>
  locale === "ar"
    ? task.titleAr || task.titleEn || task.id
    : task.titleEn || task.titleAr || task.id;

const labelFromKey = (key: string) =>
  key
    .replace(/[._-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("reinforcement");
  const label =
    typeof t.has === "function" && t.has(`status.${status}`)
      ? t(`status.${status}`)
      : labelFromKey(status);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses[statusTone(status)]}`}
    >
      {label}
    </span>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "indigo",
}: {
  label: string;
  value: number | string;
  detail?: string;
  icon: typeof Coins;
  tone?: "indigo" | "emerald" | "amber" | "blue";
}) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
        </div>
        <div className={`rounded-lg p-2.5 ${tones[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function ReviewSummary({ summary }: { summary: ReinforcementReviewStatusSummary }) {
  const t = useTranslations("reinforcement");
  const rows = [
    ["approved", summary.approved, "success"],
    ["pendingReview", summary.pendingReview, "warning"],
    ["rejected", summary.rejected, "danger"],
  ] as const;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5 text-indigo-600" aria-hidden="true" />
        <h2 className="text-base font-semibold text-slate-900">
          {t("overview.reviewQueue")}
        </h2>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {rows.map(([key, value, tone]) => (
          <div key={key} className="rounded-lg bg-slate-50 p-3 text-center">
            <p className={`text-xl font-bold ${toneClasses[tone].split(" ").at(-1)}`}>
              {value}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-600">
              {t(`progressFields.submissions.${key}`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export interface StudentProgressCardProps {
  progress: StudentReinforcementProgress;
}

export default function StudentProgressCard({ progress }: StudentProgressCardProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const taskByAssignment = new Map(
    progress.tasks.map((row) => [row.assignmentId, row]),
  );
  const activeSources = progress.xp.bySourceType.filter(
    (source) => source.count > 0 || source.totalXp !== 0,
  );
  const studentName =
    (locale === "ar" ? progress.student.nameAr : progress.student.name) ||
    progress.student.name ||
    progress.student.nameAr ||
    t("common.student");
  const completionPercent = Math.round(progress.assignments.completionRate * 100);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-bold text-slate-900">{studentName}</h2>
                <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  {t("overview.studentProgress")}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                {progress.student.code ? <span>{progress.student.code}</span> : null}
                {progress.student.admissionNo ? <span>{progress.student.admissionNo}</span> : null}
                {progress.enrollment ? <span>{t("progressFields.enrollmentId")}: {progress.enrollment.enrollmentId.slice(0, 8)}</span> : null}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-white/90 px-4 py-3 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("xp.summary.totalXp")}
            </p>
            <p className="mt-1 text-3xl font-bold text-indigo-700">{progress.xp.totalXp}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t("progressFields.total")}
          value={progress.assignments.total}
          detail={`${completionPercent}% ${t("progressFields.completionRate").toLowerCase()}`}
          icon={ListChecks}
        />
        <MetricCard
          label={t("status.completed")}
          value={progress.assignments.completed}
          detail={`${progress.assignments.inProgress} ${t("status.in_progress").toLowerCase()}`}
          icon={CheckCircle2}
          tone="emerald"
        />
        <MetricCard
          label={t("progressFields.submissions.pendingReview")}
          value={progress.submissions.pendingReview}
          detail={`${progress.submissions.submitted} ${t("progressFields.submissions.submitted").toLowerCase()}`}
          icon={Clock3}
          tone="amber"
        />
        <MetricCard
          label={t("xp.summary.totalXp")}
          value={progress.xp.totalXp}
          detail={`${activeSources.length} ${t("overview.xpEarnedBySource").toLowerCase()}`}
          icon={Award}
          tone="blue"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            <h2 className="text-base font-semibold text-slate-900">{t("overview.relatedTasks")}</h2>
          </div>
          {progress.tasks.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              {t("emptyStates.tasks")}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {progress.tasks.map((row) => {
                const dueDate = formatDateOnly(row.task.dueDate, locale);
                return (
                  <article key={row.assignmentId} className="rounded-lg border border-slate-200 p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-900">
                          {localizedTaskTitle(row.task, locale)}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <StatusBadge status={row.status} />
                          {dueDate ? <span className="text-xs text-slate-500">{dueDate}</span> : null}
                        </div>
                      </div>
                      <div className="min-w-28 text-sm sm:text-end">
                        <p className="font-bold text-slate-900">{row.progress}%</p>
                        <p className="text-xs text-slate-500">{t("progressFields.completionRate")}</p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-indigo-600 transition-[width] duration-200" style={{ width: `${Math.min(Math.max(row.progress, 0), 100)}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {row.startedAt ? <span>{t("status.in_progress")}: {formatDate(row.startedAt, locale)}</span> : null}
                      {row.completedAt ? <span>{t("status.completed")}: {formatDate(row.completedAt, locale)}</span> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
        <ReviewSummary summary={progress.submissions} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            <h2 className="text-base font-semibold text-slate-900">{t("overview.xpEarnedBySource")}</h2>
          </div>
          {activeSources.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">{t("overview.noXpData")}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {activeSources.map((source) => {
                const share = progress.xp.totalXp > 0 ? Math.round((source.totalXp / progress.xp.totalXp) * 100) : 0;
                const sourceLabel = t.has(`sourceType.${source.sourceType}`)
                  ? t(`sourceType.${source.sourceType}`)
                  : labelFromKey(source.sourceType);
                return (
                  <div key={source.sourceType}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-700">{sourceLabel}</span>
                      <span className="font-semibold text-slate-900">{source.totalXp} XP · {source.count}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${share}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            <h2 className="text-base font-semibold text-slate-900">{t("recentActivity")}</h2>
          </div>
          {progress.xp.recentLedgerEntries.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">{t("emptyStates.xpLedger")}</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {progress.xp.recentLedgerEntries.slice(0, 5).map((entry) => {
                const linkedTask = entry.assignmentId ? taskByAssignment.get(entry.assignmentId) : undefined;
                const sourceLabel = t.has(`sourceType.${entry.sourceType}`)
                  ? t(`sourceType.${entry.sourceType}`)
                  : labelFromKey(entry.sourceType);
                const reason = locale === "ar" ? entry.reasonAr || entry.reason : entry.reason || entry.reasonAr;
                return (
                  <div key={entry.id} className="flex gap-3 py-3 first:pt-0">
                    <div className="mt-0.5 rounded-full bg-emerald-50 p-2 text-emerald-600">
                      <Coins className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{sourceLabel}</p>
                        <p className="font-bold text-emerald-600">+{entry.amount} XP</p>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-600">{reason || "—"}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {linkedTask ? localizedTaskTitle(linkedTask.task, locale) : formatDate(entry.occurredAt, locale)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {progress.recentReviews.length > 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            <h2 className="text-base font-semibold text-slate-900">{t("recentActivity")}</h2>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {progress.recentReviews.slice(0, 6).map((review) => {
              const task = progress.tasks.find((row) => row.assignmentId === review.assignmentId);
              const note = locale === "ar" ? review.noteAr || review.note : review.note || review.noteAr;
              return (
                <article key={review.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={review.outcome} />
                    <span className="text-xs text-slate-500">{formatDate(review.reviewedAt, locale)}</span>
                  </div>
                  <p className="mt-3 truncate text-sm font-semibold text-slate-900">
                    {task ? localizedTaskTitle(task.task, locale) : t("overview.relatedTasks")}
                  </p>
                  {note ? <p className="mt-1 line-clamp-2 text-sm text-slate-600">{note}</p> : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
