"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { RegistrationResult } from "@/features/students-guardians/registration/types/registration";
import RegistrationCredentialsCard from "@/features/students-guardians/registration/components/RegistrationCredentialsCard";

export default function RegistrationResultPanel({ 
  result, 
  onViewStudentProfile, 
  onBackToStudents 
}: { 
  result: RegistrationResult; 
  onViewStudentProfile: (studentId: string) => void; 
  onBackToStudents: () => void; 
}) {
  const t = useTranslations("students_guardians.registration.result");
  const [acknowledged, setAcknowledged] = useState(false);
  const partial = result.status === "partial";
  const accountFailures = !partial && (
    result.studentAccount?.status === "failed" || 
    result.parentAccounts.some((account) => account.status === "failed")
  );
  const warning = partial || result.warnings.length > 0 || accountFailures;
  const temporaryCredentials = partial 
    ? [] 
    : [result.studentAccount, ...result.parentAccounts].filter((account) => account?.temporaryPassword);

  const title = partial 
    ? t("needs_followup") 
    : warning 
      ? t("completed_with_warnings") 
      : t("completed");

  const studentId = result.student?.id;

  return (
    <div className="space-y-5">
      <header className={`rounded-xl border p-5 ${warning ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {!partial && result.registrationId && (
          <p className="mt-1 text-sm text-gray-600">{t("id", { id: result.registrationId })}</p>
        )}
        {!partial && (result.createdAt || result.completedAt) && (
          <p className="mt-1 text-xs text-gray-500">
            {result.createdAt && t("created", { date: new Date(result.createdAt).toLocaleString() })}
            {result.createdAt && result.completedAt && " · "}
            {result.completedAt && t("completed_at", { date: new Date(result.completedAt).toLocaleString() })}
          </p>
        )}
        {partial && <p className="mt-2 text-sm text-amber-900">{result.failedStep}: {result.errorMessage}</p>}
      </header>

      <section className="grid gap-4 rounded-xl border bg-white p-5 md:grid-cols-2">
        <div>
          <h3 className="font-semibold">{t("student")}</h3>
          <p className="mt-1 text-sm text-gray-700">{result.student?.full_name_en}</p>
        </div>
        {!partial && result.enrollment && (
          <div>
            <h3 className="font-semibold">{t("enrollment")}</h3>
            <p className="mt-1 text-sm text-gray-700">
              {[
                result.enrollment.academicYear, 
                result.enrollment.grade, 
                result.enrollment.section, 
                result.enrollment.classroom
              ].filter(Boolean).join(" · ")}
            </p>
            <p className="text-sm text-gray-600">
              {result.enrollment.enrollmentDate} · {result.enrollment.status}
            </p>
          </div>
        )}
      </section>

      {!partial && result.guardians.length > 0 && (
        <section className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold">{t("guardians")}</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {result.guardians.map((guardian) => (
              <div key={guardian.guardianId} className="rounded-lg bg-gray-50 p-3 text-sm">
                <p className="font-medium">{guardian.full_name}</p>
                <p className="text-gray-600">{guardian.relation} · {guardian.phone_primary}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {guardian.is_primary && (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">{t("primary")}</span>
                  )}
                  {guardian.can_pickup && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">{t("can_pickup")}</span>
                  )}
                  {guardian.can_receive_notifications && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">{t("receives_notifications")}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!partial && (
        <section>
          <h3 className="mb-3 font-semibold">{t("accounts")}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {result.studentAccount && <RegistrationCredentialsCard account={result.studentAccount} />}
            {result.parentAccounts.map((account) => (
              <RegistrationCredentialsCard 
                key={account.guardianId || `${account.target}-${account.status}`} 
                account={account} 
                guardianName={result.guardians.find((guardian) => guardian.guardianId === account.guardianId)?.full_name} 
              />
            ))}
          </div>
        </section>
      )}

      {result.warnings.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-semibold">{t("warnings")}</h3>
          <ul className="mt-2 list-disc ps-5 text-sm">
            {result.warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {temporaryCredentials.length > 0 && (
        <label className="flex items-start gap-2 rounded-xl border bg-white p-4 text-sm">
          <input 
            type="checkbox" 
            checked={acknowledged} 
            onChange={(event) => setAcknowledged(event.target.checked)} 
            className="mt-0.5 cursor-pointer" 
          />
          {t("acknowledged_checkbox")}
        </label>
      )}

      <div className="flex flex-wrap gap-3">
        <button 
          type="button" 
          disabled={temporaryCredentials.length > 0 && !acknowledged} 
          onClick={onBackToStudents} 
          className="rounded-lg border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {t("back_to_students")}
        </button>
        {studentId && (
          <button 
            type="button" 
            onClick={() => onViewStudentProfile(studentId)} 
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white cursor-pointer"
          >
            {t("view_student_profile")}
          </button>
        )}
      </div>
    </div>
  );
}
