"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import { type Column } from "@/components/ui/data-table/DataTable";
import { FileSpreadsheet, Layers3, Plus } from "lucide-react";
import { ImportIssues } from "@/features/academics/shared/excel-import/ExcelImportPreview";
import { useHomeworkImportBatch, type HomeworkImportBatchPanelProps } from "../hooks/useHomeworkImportBatch";
import type { HomeworkBatchRow } from "../utils/homeworkImportBatch.types";
import HomeworkImportBatchResults from "./HomeworkImportBatchResults";
import HomeworkImportBatchTargets from "./HomeworkImportBatchTargets";
import HomeworkImportBatchTable from "./HomeworkImportBatchTable";
import HomeworkImportBatchSummary from "./HomeworkImportBatchSummary";

export default function HomeworkImportBatchPanel(props: HomeworkImportBatchPanelProps) {
  const t = useTranslations("academics.homework.importBatch");
  const batch = useHomeworkImportBatch(props);
  const [search, setSearch] = useState("");
  const previewRows = batch.plan?.rows ?? [];
  const columns: Column<HomeworkBatchRow>[] = [
    { key: "classroomName", label: t("classroom"), render: (_, row) => <div>{row.classroomName || t("unavailable")}<p className="text-xs text-gray-500">{row.hierarchy}</p></div> },
    { key: "teacherName", label: t("teacher"), render: (_, row) => row.teacherName || t("unavailable") },
    { key: "studentCount", label: t("students") },
    { key: "eligibility", label: t("status"), sortable: false, render: (_, row) => row.eligible ? t("eligible") : t(`skips.${row.skipReason}`) },
  ];
  return <section aria-label={t(batch.started ? "resultsTitle" : "title")} className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"><Layers3 size={22} aria-hidden="true" /></span>
      <div className="min-w-0"><h2 className="text-lg font-semibold text-gray-900">{t(batch.started ? "resultsTitle" : "title")}</h2><p className="mt-1 break-words text-sm text-gray-600">{props.metadata.title}</p></div>
    </div>
    <div className="space-y-5 p-5 sm:p-6">
    <p className="flex items-center gap-2 text-sm text-gray-600"><FileSpreadsheet size={18} aria-hidden="true" className="shrink-0" />{t("content", { count: props.importedDraft.questions.length })}</p>
    {!batch.started && <>
      <p className="text-sm text-gray-600">{t("description")}</p>
      <HomeworkImportBatchTargets batch={batch} writable={props.writable} />
      <p className="text-sm font-medium">{t("counts", { eligible: batch.eligibleCount, skipped: previewRows.filter(row => !row.eligible).length })}</p>
      <HomeworkImportBatchSummary eligible={batch.eligibleCount} skipped={previewRows.filter(row => !row.eligible).length} />
      <Input label={t("searchPreview")} value={search} onChange={event => setSearch(event.target.value)} />
      <HomeworkImportBatchTable columns={columns} rows={previewRows.filter(row => `${row.classroomName} ${row.hierarchy} ${row.teacherName ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()))} rowKey={row => row.classroomId} emptyTitle={t("chooseTargets")} />
      <div className="space-y-3 rounded-xl bg-gray-50 p-4"><p className="text-sm leading-6 text-gray-600">{t("tabsHelp")}</p><Button className="w-full sm:w-auto" onClick={() => void batch.start()} loading={batch.saving} disabled={batch.loading || !props.writable || !batch.eligibleCount || batch.notice === "loadError"}>{t("create", { count: batch.eligibleCount })}</Button></div>
    </>}
    {batch.loading && <p role="status">{t("loading")}</p>}
    {batch.notice && <div role="alert" className="rounded-lg bg-amber-50 p-3 text-sm">{t(batch.notice)}{batch.notice === "loadError" && <Button variant="secondary" disabled={batch.saving} onClick={batch.retry}>{t("retry")}</Button>}</div>}
    {batch.issues.length > 0 && <ImportIssues issues={batch.issues} />}
    {batch.started && batch.plan && <>
      <HomeworkImportBatchResults plan={batch.plan} outcomes={batch.outcomes} />
      {!batch.saving && <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-xl text-sm leading-6 text-gray-600">{t("resetHelp")}</p><Button variant="secondary" className="shrink-0" leftIcon={<Plus size={18} />} onClick={props.onReset}>{t("reset")}</Button></div>}
    </>}
    </div>
  </section>;
}
