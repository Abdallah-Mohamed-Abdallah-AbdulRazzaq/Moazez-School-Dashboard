"use client";

import { Building2, Coins, GraduationCap, ListChecks } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type {
  ClassroomReinforcementSummary,
  OverviewXp,
} from "../types";

const toLabel = (key: string): string =>
  key
    .replace(/[._-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const toValue = (value: unknown): string => {
  if (typeof value === "number") return new Intl.NumberFormat().format(value);
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "-";
};

function SummaryGrid({ summary }: { summary: Record<string, unknown> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Object.entries(summary).slice(0, 9).map(([key, value]) => (
        <div key={key} className="rounded-lg bg-gray-50 px-3 py-3">
          <div className="text-xs font-medium uppercase text-gray-500">
            {toLabel(key)}
          </div>
          <div className="mt-1 text-base font-semibold text-gray-900">
            {toValue(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function XpSummaryBlock({ xp }: { xp: OverviewXp }) {
  const t = useTranslations("reinforcement.xp");
  const rows = [
    ["totalXp", xp.totalXp],
    ["studentsWithXp", xp.studentsWithXp],
    ["averageXp", xp.averageXp],
  ] as const;

  return (
    <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Coins className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold text-gray-900">
          {t("summaryTitle")}
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(([key, value]) => (
          <div key={key} className="rounded-lg bg-gray-50 px-3 py-3">
            <div className="text-xs font-medium uppercase text-gray-500">
              {toLabel(key)}
            </div>
            <div className="mt-1 text-base font-semibold text-gray-900">
              {toValue(value)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export interface ClassroomSummaryPanelProps {
  summary: ClassroomReinforcementSummary;
}

export default function ClassroomSummaryPanel({
  summary,
}: ClassroomSummaryPanelProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const overviewSummary: Record<string, unknown> = {
    studentsCount: summary.studentsCount,
    ...summary.assignments,
    ...Object.fromEntries(
      Object.entries(summary.reviewQueue).map(([key, value]) => [
        `reviewQueue.${key}`,
        value,
      ]),
    ),
  };

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-gray-900">
            {t("overview.classroomSummary")}
          </h2>
        </div>
        <SummaryGrid summary={overviewSummary} />
      </section>

      <XpSummaryBlock xp={summary.xp} />

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-gray-900">
              {t("overview.topStudents")}
            </h2>
          </div>
          {summary.topStudents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500">
              {t("emptyStates.studentProgress")}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {summary.topStudents.slice(0, 10).map((row) => (
                <div key={row.studentId} className="flex justify-between gap-3 py-3">
                  <span className="truncate text-sm font-semibold text-gray-900">
                    {locale === "ar"
                      ? row.student.nameAr || row.student.name || row.studentId
                      : row.student.name || row.student.nameAr || row.studentId}
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    {toValue(row.totalXp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-gray-900">
              {t("overview.students")}
            </h2>
          </div>
          {summary.students.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500">
              {t("emptyStates.studentProgress")}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {summary.students.slice(0, 10).map((student) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <span className="min-w-0 truncate text-sm font-medium text-gray-900">
                    {student.name}
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    {toValue(student.totalXp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
