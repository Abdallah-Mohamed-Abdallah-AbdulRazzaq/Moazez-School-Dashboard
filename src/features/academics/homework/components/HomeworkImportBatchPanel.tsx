"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import { FileSpreadsheet, Layers3, Plus } from "lucide-react";
import { ImportIssues } from "@/features/academics/shared/excel-import/ExcelImportPreview";
import { useHomeworkImportBatch, type HomeworkImportBatchPanelProps } from "../hooks/useHomeworkImportBatch";
import HomeworkImportBatchResults from "./HomeworkImportBatchResults";
import HomeworkImportBatchTargets from "./HomeworkImportBatchTargets";
import HomeworkClassPreview from "./HomeworkClassPreview";
import HomeworkCreationBar from "./HomeworkCreationBar";
import HomeworkImportBatchSummary from "./HomeworkImportBatchSummary";
import HomeworkDraftIssues from "./HomeworkDraftIssues";

export default function HomeworkImportBatchPanel(props: HomeworkImportBatchPanelProps) {
  const t = useTranslations("academics.homework.importBatch");
  const tManual = useTranslations("academics.homework.manual");
  const batch = useHomeworkImportBatch(props);
  const [search, setSearch] = useState("");
  const previewRows = batch.plan?.rows ?? [];
  const filteredRows = previewRows.filter(row => `${row.classroomName} ${row.hierarchy} ${row.teacherName ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  const questions = props.questionDraft.questions;
  const points = questions.reduce((sum, question) => sum + Math.round(question.points * 100), 0) / 100;
  const disabled = batch.loading || !props.writable || !batch.eligibleCount || !questions.length || batch.notice === "loadError";
  const help = batch.notice === "loadError" || !props.writable ? tManual("reviewIssues") : batch.loading ? tManual("preparingTargets") : !questions.length ? tManual("batchPrerequisite") : !batch.eligibleCount ? tManual("chooseClasses") : t("tabsHelp");
  return <><section aria-label={t(batch.started ? "resultsTitle" : "title")} className="min-w-0 rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"><Layers3 size={22} aria-hidden="true" /></span>
      <div className="min-w-0"><h2 className="text-lg font-semibold text-gray-900">{t(batch.started ? "resultsTitle" : "title")}</h2><p className="mt-1 break-words text-sm text-gray-600">{props.questionDraft.metadata.title}</p></div>
    </div>
    <div className="space-y-5 p-5 sm:p-6">
    <p className="flex items-center gap-2 text-sm text-gray-600"><FileSpreadsheet size={18} aria-hidden="true" className="shrink-0" />{props.origin === "excel" ? t("content", { count: props.questionDraft.questions.length }) : tManual("content", { count: props.questionDraft.questions.length })}</p>
    {!batch.started && <>
      <p className="text-sm text-gray-600">{t("description")}</p>
      <HomeworkImportBatchTargets batch={batch} writable={props.writable} />
      {previewRows.length > 0 ? <>
        <p className="text-sm font-medium">{t("counts", { eligible: batch.eligibleCount, skipped: previewRows.filter(row => !row.eligible).length })}</p>
        <HomeworkImportBatchSummary eligible={batch.eligibleCount} skipped={previewRows.filter(row => !row.eligible).length} />
        <Input label={t("searchPreview")} value={search} onChange={event => setSearch(event.target.value)} />
        <HomeworkClassPreview rows={filteredRows} search={search} />
      </> : <p className="rounded-xl bg-gray-50 p-5 text-sm text-gray-600">{t("chooseTargets")}</p>}
    </>}
    {batch.loading && <p role="status">{t("loading")}</p>}
    {batch.notice && <div role="alert" className="rounded-lg bg-amber-50 p-3 text-sm">{t(batch.notice)}{batch.notice === "loadError" && <Button variant="secondary" disabled={batch.saving} onClick={batch.retry}>{t("retry")}</Button>}</div>}
    {batch.validation.kind === "invalid" && (batch.validation.origin === "excel" ? <ImportIssues issues={batch.validation.issues} /> : <HomeworkDraftIssues issues={batch.validation.issues} questions={props.questionDraft.questions} />)}
    {batch.started && batch.plan && <>
      <HomeworkImportBatchResults plan={batch.plan} outcomes={batch.outcomes} />
      {!batch.saving && <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-xl text-sm leading-6 text-gray-600">{props.origin === "excel" ? t("resetHelp") : tManual("resetHelp")}</p><Button variant="secondary" className="shrink-0" leftIcon={<Plus size={18} />} onClick={props.onReset}>{props.origin === "excel" ? t("reset") : tManual("reset")}</Button></div>}
    </>}
    </div>
    </section>
    <HomeworkCreationBar questionCount={questions.length} points={points} classCount={batch.eligibleCount} help={batch.started ? undefined : help}>
      {props.onCancel && <Button variant="secondary" onClick={props.onCancel} disabled={batch.saving}>{batch.started && !batch.saving ? t("backToAssignments") : tManual("cancelCreation")}</Button>}
      {!batch.started && <Button onClick={() => void batch.start()} loading={batch.saving} disabled={disabled}>{t("create", { count: batch.eligibleCount })}</Button>}
    </HomeworkCreationBar>
  </>;
}
