"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { DerivedDailyAbsenceReportRow } from "../services/attendanceReportsService";
import type { ReportsAttendanceRow } from "../types";

interface DerivedDailyAbsencesSectionProps {
  rows: DerivedDailyAbsenceReportRow[];
  attendanceRows: ReportsAttendanceRow[];
}

function formatDate(date: string, locale: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export default function DerivedDailyAbsencesSection({
  rows,
  attendanceRows,
}: DerivedDailyAbsencesSectionProps) {
  const t = useTranslations("attendance.reportsPage.derivedDaily");
  const locale = useLocale();
  const studentsById = useMemo(
    () =>
      new Map(
        attendanceRows.map((row) => [
          row.studentId,
          {
            name: locale === "ar" ? row.studentNameAr : row.studentNameEn,
            number: row.studentNumber,
          },
        ]),
      ),
    [attendanceRows, locale],
  );

  return (
    <section
      className="rounded-xl border p-4"
      style={{
        borderColor: "var(--border-color)",
        backgroundColor: "var(--surface-color)",
      }}
    >
      <div className="mb-4">
        <h2
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {t("title")}
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          {t("description")}
        </p>
      </div>

      {rows.length === 0 ? (
        <p
          className="rounded-lg border px-4 py-8 text-center text-sm"
          style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
        >
          {t("empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border-color)" }}>
          <table className="min-w-full text-sm">
            <thead style={{ backgroundColor: "var(--background-secondary)" }}>
              <tr className="text-start" style={{ color: "var(--text-secondary)" }}>
                <th className="whitespace-nowrap px-4 py-3 text-start font-medium">{t("student")}</th>
                <th className="whitespace-nowrap px-4 py-3 text-start font-medium">{t("date")}</th>
                <th className="whitespace-nowrap px-4 py-3 text-start font-medium">{t("missedPeriods")}</th>
                <th className="whitespace-nowrap px-4 py-3 text-start font-medium">{t("evidence")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const student = studentsById.get(row.studentId);

                return (
                  <tr
                    key={`${row.studentId}-${row.date}-${row.policyId}`}
                    className="border-t"
                    style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{student?.name || t("studentId", { id: row.studentId })}</div>
                      {student?.number ? (
                        <div className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                          {student.number}
                        </div>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(row.date, locale)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {t("periodsValue", {
                        missed: row.missedPeriodCount,
                        required: row.requiredMissedPeriodsCount,
                      })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {t("evidenceValue", { count: row.evidencePeriodCount })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
