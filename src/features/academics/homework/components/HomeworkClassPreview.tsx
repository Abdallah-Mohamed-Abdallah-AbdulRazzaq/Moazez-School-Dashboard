"use client";

import { useTranslations } from "next-intl";
import type { HomeworkBatchRow } from "../utils/homeworkImportBatch.types";
import { HomeworkClassCard, HomeworkClassCardGrid } from "./HomeworkClassCards";

function TargetClassCard({ row }: { row: HomeworkBatchRow }) {
  const t = useTranslations("academics.homework.importBatch");
  return <HomeworkClassCard classroom={row.classroomName} hierarchy={row.hierarchy} teacher={row.teacherName} students={row.studentCount} status={<p className={`rounded-lg px-3 py-2 text-sm font-medium ${row.eligible ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>{row.eligible ? t("eligible") : t(`skips.${row.skipReason}`)}</p>} />;
}

export default function HomeworkClassPreview({ rows, search }: { rows: HomeworkBatchRow[]; search: string }) {
  const t = useTranslations("academics.homework.manual");
  const eligible = rows.filter(row => row.eligible);
  const skipped = rows.filter(row => !row.eligible);
  return <div className="space-y-4">
    <HomeworkClassCardGrid key={`eligible:${search}`} rows={eligible} rowKey={row => row.classroomId} renderCard={row => <TargetClassCard row={row} />} emptyTitle={t("noMatchingClasses")} />
    {skipped.length > 0 && <details className="rounded-xl border border-amber-200 bg-amber-50/40 p-4"><summary className="cursor-pointer text-sm font-semibold text-amber-900">{t("skippedClasses", { count: skipped.length })}</summary><div className="mt-4"><HomeworkClassCardGrid key={`skipped:${search}`} rows={skipped} rowKey={row => row.classroomId} renderCard={row => <TargetClassCard row={row} />} emptyTitle={t("noMatchingClasses")} /></div></details>}
  </div>;
}
