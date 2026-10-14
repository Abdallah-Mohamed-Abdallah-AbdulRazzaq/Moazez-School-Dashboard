"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";

export function HomeworkClassCard({ classroom, hierarchy, teacher, students, status, children }: {
  classroom: string; hierarchy: string; teacher?: string; students: number; status: ReactNode; children?: ReactNode;
}) {
  const t = useTranslations("academics.homework.importBatch");
  return <article className="min-w-0 space-y-4 rounded-xl border border-gray-200 bg-white p-4">
    <div><h3 className="break-words text-base font-semibold text-gray-900">{classroom || t("unavailable")}</h3><p className="mt-1 break-words text-sm text-gray-600">{hierarchy}</p></div>
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div><dt className="text-gray-600">{t("teacher")}</dt><dd className="mt-1 break-words font-medium text-gray-900">{teacher || t("unavailable")}</dd></div>
      <div><dt className="text-gray-600">{t("students")}</dt><dd className="mt-1 font-medium text-gray-900">{students}</dd></div>
    </dl>
    {status}
    {children && <div className="border-t border-gray-100 pt-3">{children}</div>}
  </article>;
}

export function HomeworkClassCardGrid<T>({ rows, rowKey, renderCard, emptyTitle }: {
  rows: T[]; rowKey: (row: T) => string; renderCard: (row: T) => ReactNode; emptyTitle: string;
}) {
  const t = useTranslations("academics.homework.manual");
  const [visibleCount, setVisibleCount] = useState(12);
  if (!rows.length) return <p className="rounded-xl bg-gray-50 p-5 text-sm text-gray-600">{emptyTitle}</p>;
  return <div className="space-y-3">
    <div className={`grid gap-3 md:grid-cols-2 ${rows.length > 2 ? "xl:grid-cols-3" : ""}`}>{rows.slice(0, visibleCount).map(row => <div key={rowKey(row)} className="min-w-0">{renderCard(row)}</div>)}</div>
    {rows.length > visibleCount && <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-gray-600">{t("showingClasses", { shown: visibleCount, total: rows.length })}</p><Button variant="secondary" onClick={() => setVisibleCount(current => current + 12)}>{t("showMoreClasses")}</Button></div>}
  </div>;
}
