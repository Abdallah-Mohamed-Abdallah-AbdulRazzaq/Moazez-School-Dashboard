"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import { ImportIssues } from "@/features/academics/shared/excel-import/ExcelImportPreview";
import { useHomeworkImportBatch, type HomeworkImportBatchPanelProps } from "../hooks/useHomeworkImportBatch";
import type { HomeworkBatchRow } from "../utils/homeworkImportBatch.types";
import HomeworkImportBatchResults from "./HomeworkImportBatchResults";
import HomeworkImportBatchTargets from "./HomeworkImportBatchTargets";

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
  return <section aria-label={t("title")} className="mt-6 space-y-4 rounded-lg border border-border p-4">
    <h2 className="font-semibold">{t("title")}</h2>
    <p className="text-sm text-gray-600">{t("content", { title: props.metadata.title, count: props.importedDraft.questions.length })}</p>
    {!batch.started && <>
      <p className="text-sm text-gray-600">{t("description")}</p>
      <HomeworkImportBatchTargets batch={batch} writable={props.writable} />
      <p className="text-sm font-medium">{t("counts", { eligible: batch.eligibleCount, skipped: previewRows.filter(row => !row.eligible).length })}</p>
      <Input label={t("searchPreview")} value={search} onChange={event => setSearch(event.target.value)} />
      <p className="text-xs text-gray-600 sm:hidden">{t("tableHelp")}</p>
      <div className="overflow-x-auto"><DataTable columns={columns} data={previewRows.filter(row => `${row.classroomName} ${row.hierarchy} ${row.teacherName ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()))} getRowKey={row => row.classroomId} itemsPerPage={10} showDensityToggle={false} emptyTitle={t("chooseTargets")} /></div>
      <p className="text-xs text-gray-600">{t("tabsHelp")}</p>
      <Button className="w-full sm:w-auto" onClick={() => void batch.start()} loading={batch.saving} disabled={batch.loading || !props.writable || !batch.eligibleCount || batch.notice === "loadError"}>{t("create", { count: batch.eligibleCount })}</Button>
    </>}
    {batch.loading && <p role="status">{t("loading")}</p>}
    {batch.notice && <div role="alert" className="rounded-lg bg-amber-50 p-3 text-sm">{t(batch.notice)}{batch.notice === "loadError" && <Button variant="secondary" disabled={batch.saving} onClick={batch.retry}>{t("retry")}</Button>}</div>}
    {batch.issues.length > 0 && <ImportIssues issues={batch.issues} />}
    {batch.started && batch.plan && <>
      <HomeworkImportBatchResults plan={batch.plan} outcomes={batch.outcomes} />
      {!batch.saving && <><p className="text-sm text-gray-600">{t("resetHelp")}</p><Button variant="secondary" onClick={props.onReset}>{t("reset")}</Button></>}
    </>}
  </section>;
}
