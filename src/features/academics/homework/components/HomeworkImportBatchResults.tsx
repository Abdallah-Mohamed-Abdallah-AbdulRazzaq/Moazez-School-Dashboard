"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { type Column } from "@/components/ui/data-table/DataTable";
import ButtonLink from "@/components/ui/button/ButtonLink";
import { CheckCircle2, CircleAlert, ExternalLink, LoaderCircle } from "lucide-react";
import Checkbox from "@/components/ui/checkbox/Checkbox";
import Input from "@/components/ui/input/Input";
import type { HomeworkBatchPlan, HomeworkBatchResult } from "../utils/homeworkImportBatch.types";
import { homeworkBatchEditorUrl } from "../hooks/useHomeworkImportBatch";
import { getHomeworkErrorMessage } from "../services/homeworkErrors";
import HomeworkImportBatchSummary from "./HomeworkImportBatchSummary";
import HomeworkImportBatchTable from "./HomeworkImportBatchTable";

const statusStyles: Record<HomeworkBatchResult["status"], string> = {
  queued: "bg-gray-100 text-gray-700", creating: "bg-primary-50 text-primary",
  created: "bg-emerald-50 text-emerald-800", partial: "bg-amber-50 text-amber-800",
  failed: "bg-red-50 text-red-800", unconfirmed: "bg-amber-50 text-amber-800", skipped: "bg-gray-100 text-gray-700",
};

function BatchResultStatus({ outcome }: { outcome: HomeworkBatchResult }) {
  const t = useTranslations("academics.homework.importBatch");
  const tError = useTranslations("academics.homework.errorMessages");
  return <div className="max-w-xs whitespace-normal">
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[outcome.status]}`}>{t(`statuses.${outcome.status}`)}</span>
    {!outcome.target.eligible && <p className="mt-2 text-sm leading-5 text-gray-600">{t(`skips.${outcome.target.skipReason}`)}</p>}
    {outcome.status === "partial" && <p className="mt-2 text-sm leading-5 text-gray-600">{t("partialHelp", { saved: outcome.failedQuestionIndex })}</p>}
    {outcome.status === "unconfirmed" && <p className="mt-2 text-sm leading-5 text-gray-600">{t("unknownHelp")}</p>}
    {outcome.status === "failed" && <p className="mt-2 text-sm leading-5 text-gray-600">{getHomeworkErrorMessage(outcome.error, tError)}</p>}
  </div>;
}

function BatchResultAction({ outcome, plan }: { outcome: HomeworkBatchResult; plan: HomeworkBatchPlan }) {
  const t = useTranslations("academics.homework.importBatch");
  const locale = useLocale();
  const id = outcome.status === "created" ? outcome.assignment.id : outcome.status === "partial" ? outcome.homeworkId : undefined;
  return <ButtonLink variant="outline" size="sm" className="min-h-11 whitespace-nowrap" rightIcon={<ExternalLink size={15} aria-hidden="true" />} href={homeworkBatchEditorUrl(locale, plan, id)} prefetch={false} target="_blank" rel="noopener noreferrer" aria-label={t(id ? "open" : "checkList", { classroom: outcome.target.classroomName })}>
    {t(id ? "openShort" : "checkListShort")}
  </ButtonLink>;
}

function BatchResultProgress({ outcomes, eligible }: { outcomes: HomeworkBatchResult[]; eligible: number }) {
  const t = useTranslations("academics.homework.importBatch");
  const waiting = outcomes.some(row => row.status === "queued" || row.status === "creating");
  const attention = outcomes.filter(row => ["partial", "failed", "unconfirmed"].includes(row.status)).length;
  const created = outcomes.filter(row => row.status === "created").length;
  const Icon = waiting ? LoaderCircle : attention ? CircleAlert : CheckCircle2;
  const style = waiting ? "bg-primary-50 text-primary" : attention ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-900";
  return <div role="status" aria-live="polite" className={`rounded-xl p-4 ${style}`}>
    <div className="flex items-center gap-3"><Icon size={22} aria-hidden="true" className={waiting ? "shrink-0 animate-spin motion-reduce:animate-none" : "shrink-0"} /><div><p className="font-semibold">{t(waiting ? "savingTitle" : attention ? "attentionTitle" : "completedTitle")}</p><p className="mt-1 text-sm">{t("progress", { created, total: eligible })}</p></div></div>
    {waiting && <progress className="mt-3 h-2 w-full accent-primary" value={created + attention} max={eligible} aria-label={t("batchProgress")} />}
  </div>;
}

export default function HomeworkImportBatchResults({ plan, outcomes }: { plan: HomeworkBatchPlan; outcomes: HomeworkBatchResult[] }) {
  const t = useTranslations("academics.homework.importBatch");
  const [attention, setAttention] = useState(false);
  const [search, setSearch] = useState("");
  const visibleOutcomes = outcomes.filter(row => (!attention || ["partial", "failed", "unconfirmed", "skipped"].includes(row.status))
    && `${row.target.classroomName} ${row.target.hierarchy} ${row.target.teacherName ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  const columns: Column<HomeworkBatchResult>[] = [
    { key: "classroom", label: t("classroom"), sortable: false, render: (_, row) => <div><p>{row.status === "created" ? row.assignment.classroomName || row.target.classroomName : row.target.classroomName}</p><p className="text-xs text-gray-500">{row.target.hierarchy}</p></div> },
    { key: "teacher", label: t("teacher"), sortable: false, render: (_, row) => row.status === "created" ? row.assignment.teacherName || row.target.teacherName || t("unavailable") : row.target.teacherName || t("unavailable") },
    { key: "students", label: t("students"), sortable: false, render: (_, row) => row.target.studentCount },
    { key: "status", label: t("status"), sortable: false, render: (_, row) => <BatchResultStatus outcome={row} /> },
    { key: "action", label: t("action"), sortable: false, render: (_, row) => row.status === "created" || row.status === "partial" || row.status === "unconfirmed" ? <BatchResultAction outcome={row} plan={plan} /> : null },
  ];
  return <div className="space-y-5">
    <BatchResultProgress outcomes={outcomes} eligible={plan.rows.filter(row => row.eligible).length} />
    <HomeworkImportBatchSummary created={outcomes.filter(row => row.status === "created").length} eligible={plan.rows.filter(row => row.eligible).length} attention={outcomes.filter(row => ["partial", "failed", "unconfirmed"].includes(row.status)).length} skipped={outcomes.filter(row => row.status === "skipped").length} />
    <div className="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
      <Input label={t("searchClasses")} value={search} onChange={event => setSearch(event.target.value)} />
      <Checkbox className="min-h-11 bg-white" label={t("attention")} checked={attention} onChange={event => setAttention(event.target.checked)} />
    </div>
    <HomeworkImportBatchTable columns={columns} rows={visibleOutcomes} rowKey={row => row.target.classroomId} emptyTitle={t("noAttention")} />
  </div>;
}
