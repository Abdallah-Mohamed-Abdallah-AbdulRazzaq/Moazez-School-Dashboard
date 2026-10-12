"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import Checkbox from "@/components/ui/checkbox/Checkbox";
import Input from "@/components/ui/input/Input";
import type { HomeworkBatchPlan, HomeworkBatchResult } from "../utils/homeworkImportBatch.types";
import { homeworkBatchEditorUrl } from "../hooks/useHomeworkImportBatch";
import { getHomeworkErrorMessage } from "../services/homeworkErrors";

function BatchResultStatus({ outcome }: { outcome: HomeworkBatchResult }) {
  const t = useTranslations("academics.homework.importBatch");
  const tError = useTranslations("academics.homework.errorMessages");
  return <div className="max-w-xs whitespace-normal">
    <p className="font-medium">{t(`statuses.${outcome.status}`)}</p>
    {!outcome.target.eligible && <p className="text-xs">{t(`skips.${outcome.target.skipReason}`)}</p>}
    {outcome.status === "partial" && <p className="text-xs">{t("partialHelp", { saved: outcome.failedQuestionIndex })}</p>}
    {outcome.status === "unconfirmed" && <p className="text-xs">{t("unknownHelp")}</p>}
    {outcome.status === "failed" && <p className="text-xs">{getHomeworkErrorMessage(outcome.error, tError)}</p>}
  </div>;
}

function BatchResultAction({ outcome, plan }: { outcome: HomeworkBatchResult; plan: HomeworkBatchPlan }) {
  const t = useTranslations("academics.homework.importBatch");
  const locale = useLocale();
  const id = outcome.status === "created" ? outcome.assignment.id : outcome.status === "partial" ? outcome.homeworkId : undefined;
  if (!id && outcome.status !== "unconfirmed") return null;
  return <a className="text-primary underline" href={homeworkBatchEditorUrl(locale, plan, id)} target="_blank" rel="noopener noreferrer">
    {t(id ? "open" : "checkList", { classroom: outcome.target.classroomName })}
  </a>;
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
    { key: "action", label: t("action"), sortable: false, render: (_, row) => <BatchResultAction outcome={row} plan={plan} /> },
  ];
  return <div className="space-y-3">
    <p role="status" aria-live="polite">{t("progress", { created: outcomes.filter(row => row.status === "created").length, total: plan.rows.filter(row => row.eligible).length })}</p>
    <p className="text-sm text-gray-600">{t("summary", { partial: outcomes.filter(row => row.status === "partial").length, failed: outcomes.filter(row => row.status === "failed").length, unconfirmed: outcomes.filter(row => row.status === "unconfirmed").length, skipped: outcomes.filter(row => row.status === "skipped").length })}</p>
    <Input label={t("searchClasses")} value={search} onChange={event => setSearch(event.target.value)} />
    <Checkbox label={t("attention")} checked={attention} onChange={event => setAttention(event.target.checked)} />
    <p className="text-xs text-gray-600 sm:hidden">{t("tableHelp")}</p>
    <div className="overflow-x-auto"><DataTable columns={columns} data={visibleOutcomes} getRowKey={row => row.target.classroomId} itemsPerPage={10} showDensityToggle={false} emptyTitle={t("noAttention")} /></div>
  </div>;
}
