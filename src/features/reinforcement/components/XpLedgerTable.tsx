"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { XpLedgerEntry } from "../types";
import ReinforcementTableSkeleton from "./shared/ReinforcementTableSkeleton";

interface XpLedgerTableProps {
  entries: XpLedgerEntry[];
  loading?: boolean;
  getStudentProgressHref?: (entry: XpLedgerEntry) => string | undefined;
}

export default function XpLedgerTable({
  entries,
  loading = false,
  getStudentProgressHref,
}: XpLedgerTableProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("reinforcement");

  if (loading) return <ReinforcementTableSkeleton columns={5} />;

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
        {t("emptyStates.xpLedger")}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {["student", "amount", "reason", "source", "occurredAt"].map((key) => (
                <th
                  key={key}
                  className="px-4 py-3 text-start text-xs font-semibold uppercase text-gray-500"
                >
                  {t(`xp.ledger.${key}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((entry) => {
              const progressHref = getStudentProgressHref?.(entry);
              const studentName = entry.student?.name || entry.studentId;
              const sourceKey = `sourceType.${entry.sourceType}`;
              const sourceLabel =
                typeof t.has === "function" && t.has(sourceKey)
                  ? t(sourceKey)
                  : entry.sourceType;

              return (
                <tr
                  key={entry.id}
                  className={progressHref ? "cursor-pointer hover:bg-gray-50" : undefined}
                  role={progressHref ? "link" : undefined}
                  tabIndex={progressHref ? 0 : undefined}
                  onClick={() => {
                    if (progressHref) {
                      router.push(progressHref);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (!progressHref) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(progressHref);
                    }
                  }}
                >
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {studentName}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-primary">
                    {entry.amount}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {locale === "ar"
                      ? entry.reasonAr || entry.reason
                      : entry.reason || entry.reasonAr}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {sourceLabel}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(entry.occurredAt))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
