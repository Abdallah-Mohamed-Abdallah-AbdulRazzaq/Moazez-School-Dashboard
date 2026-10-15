"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, ChevronDown, School } from "lucide-react";
import type { TimetableGenerationViewModel, TimetableGenerationClassroomGroup, TimetableGenerationUnresolvedViewModel } from "@/features/academics/timetable/services/timetableGenerationPresentation";

export default function GenerationResult({ result }: { result: TimetableGenerationViewModel }) {
  const t = useTranslations("academics.timetable.generate");
  const resultRef = useRef<HTMLElement>(null);
  useEffect(() => resultRef.current?.focus(), []);
  const isComplete = result.status === "complete";
  const StatusIcon = isComplete ? CheckCircle2 : AlertTriangle;
  return (
    <section ref={resultRef} tabIndex={0} className="space-y-5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label={t("resultTitle")}>
      <div role="status" className={`flex items-start gap-3 rounded-xl border p-4 ${isComplete ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
        <StatusIcon className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
        <div>
          <h3 className="font-semibold">{t(`result.heading.${result.status}`)}</h3>
          <p className="mt-1 text-sm leading-relaxed">{t(`result.${result.status}`)}</p>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-3 rounded-xl border border-gray-200 p-4">
        <ResultCount label={t("result.createdCount")} count={result.createdCount} />
        <ResultCount label={t("result.existingCount")} count={result.existingCount} />
        <ResultCount label={t("result.remainingDemandCount")} count={result.remainingDemandCount} />
      </dl>
      {result.groups.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900">{t("remainingTitle")}</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">{t("remainingDescription")}</p>
          </div>
          {result.groups.map((group) => <ClassroomIssues key={group.classroomId ?? "unassigned"} group={group} />)}
        </div>
      )}
      <p className="text-sm leading-relaxed text-gray-600">{t("nextStep")}</p>
    </section>
  );
}

function ResultCount({ label, count }: { label: string; count: number }) {
  const locale = useLocale();
  return (
    <div className="min-w-0">
      <dt className="min-h-10 text-xs text-gray-600 sm:min-h-0 sm:text-sm">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">{new Intl.NumberFormat(locale).format(count)}</dd>
    </div>
  );
}

function ClassroomIssues({ group }: { group: TimetableGenerationClassroomGroup }) {
  return (
    <details open className="group overflow-hidden rounded-xl border border-gray-200">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 bg-gray-50 p-4 text-sm font-semibold text-gray-900 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
        <School className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1 break-words">{group.classroomName}</span>
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
      </summary>
      <ul className="divide-y divide-gray-100 px-4">
        {group.items.map((issue) => <SubjectIssue key={`${issue.code}:${issue.subjectId ?? "unassigned"}`} issue={issue} />)}
      </ul>
    </details>
  );
}

function SubjectIssue({ issue }: { issue: TimetableGenerationUnresolvedViewModel }) {
  const t = useTranslations("academics.timetable.generate");
  const locale = useLocale();
  const formatCount = (count: number) => new Intl.NumberFormat(locale).format(count);
  return (
    <li className="space-y-2 py-4">
      <h4 className="break-words text-sm font-semibold text-gray-900">{issue.subjectName}</h4>
      <p className="text-sm leading-relaxed text-gray-700">{t(`unresolved.${issue.messageKey}`)}</p>
      <dl className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-600">
        {issue.requiredWeeklySlots !== null && <IssueCount label={t("required")} value={formatCount(issue.requiredWeeklySlots)} />}
        {issue.scheduledWeeklySlots !== null && <IssueCount label={t("scheduled")} value={formatCount(issue.scheduledWeeklySlots)} />}
        <IssueCount label={t("remaining")} value={formatCount(issue.remainingWeeklySlots)} />
      </dl>
    </li>
  );
}

function IssueCount({ label, value }: { label: string; value: string }) {
  return <div className="flex gap-1.5"><dt>{label}</dt><dd className="font-semibold tabular-nums text-gray-900">{value}</dd></div>;
}
