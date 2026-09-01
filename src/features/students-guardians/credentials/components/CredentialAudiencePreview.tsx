"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import Button from "@/components/ui/button/Button";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import { previewCredentialAudience } from "../api/credentialBatchApi";
import type {
  CredentialAudience,
  CredentialAudiencePreview as CredentialAudiencePreviewResult,
} from "../api/credentialBatchDtos";
import { getCredentialAudienceKey } from "../model/credentialAudience";

export interface CredentialAudiencePreviewSnapshot {
  audienceKey: string;
  result: CredentialAudiencePreviewResult;
}

interface CredentialAudiencePreviewProps {
  audience: CredentialAudience | null;
  snapshot: CredentialAudiencePreviewSnapshot | null;
  onChange: (snapshot: CredentialAudiencePreviewSnapshot | null) => void;
  disabled?: boolean;
}

const copy = {
  en: {
    preview: "Preview audience",
    total: "Matched",
    eligible: "Eligible",
    skipped: "Skipped",
    reasons: "Skipped reasons",
    sample: "Eligible sample",
    student: "Student",
    username: "Username",
    loginEmail: "Login email",
    noEligible: "No eligible students matched.",
    error: "The audience preview could not be loaded.",
    retry: "Try again",
  },
  ar: {
    preview: "معاينة النطاق",
    total: "المطابقون",
    eligible: "المؤهلون",
    skipped: "المستبعدون",
    reasons: "أسباب الاستبعاد",
    sample: "عينة الطلاب المؤهلين",
    student: "الطالب",
    username: "اسم المستخدم",
    loginEmail: "بريد تسجيل الدخول",
    noEligible: "لا يوجد طلاب مؤهلون مطابقون.",
    error: "تعذر تحميل معاينة النطاق.",
    retry: "حاول مرة أخرى",
  },
} as const;

export default function CredentialAudiencePreview({
  audience,
  snapshot,
  onChange,
  disabled = false,
}: CredentialAudiencePreviewProps) {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const text = copy[locale];
  const [localSnapshot, setLocalSnapshot] =
    useState<CredentialAudiencePreviewSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorAudienceKey, setErrorAudienceKey] = useState<string | null>(null);
  const audienceKey = audience ? getCredentialAudienceKey(audience) : null;

  useEffect(() => {
    if (snapshot && snapshot.audienceKey !== audienceKey) onChange(null);
    if (localSnapshot && localSnapshot.audienceKey !== audienceKey) {
      setLocalSnapshot(null);
    }
  }, [audienceKey, localSnapshot, onChange, snapshot]);

  const currentSnapshot =
    localSnapshot?.audienceKey === audienceKey
      ? localSnapshot
      : snapshot?.audienceKey === audienceKey
        ? snapshot
        : null;

  const loadPreview = async () => {
    if (!audience || loading) return;
    const requestAudienceKey = getCredentialAudienceKey(audience);
    setLoading(true);
    setErrorAudienceKey(null);
    try {
      const result = await previewCredentialAudience(audience);
      const nextSnapshot = {
        audienceKey: getCredentialAudienceKey(audience),
        result,
      };
      setLocalSnapshot(nextSnapshot);
      onChange(nextSnapshot);
    } catch {
      setErrorAudienceKey(requestAudienceKey);
    } finally {
      setLoading(false);
    }
  };

  const result = currentSnapshot?.result;
  const showError = errorAudienceKey === audienceKey;

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex justify-end">
        <Button
          type="button"
          loading={loading}
          disabled={disabled || !audience}
          onClick={loadPreview}
        >
          {text.preview}
        </Button>
      </div>

      {showError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <p>{text.error}</p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            loading={loading}
            disabled={disabled}
            onClick={loadPreview}
          >
            {text.retry}
          </Button>
        </div>
      )}

      {result && (
        <div className="space-y-4" aria-live="polite">
          <div className="grid gap-3 sm:grid-cols-3">
            <KPICardV2 title={text.total} value={result.totalMatched} showChart={false} />
            <KPICardV2 title={text.eligible} value={result.eligible} showChart={false} />
            <KPICardV2 title={text.skipped} value={result.skipped} showChart={false} />
          </div>

          {result.eligible === 0 && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {text.noEligible}
            </p>
          )}

          {Object.keys(result.skippedReasons).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{text.reasons}</h3>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {Object.entries(result.skippedReasons).map(([reason, count]) => (
                  <li key={reason} className="flex justify-between gap-3">
                    <span>{reason}</span>
                    <span>{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.sample.length > 0 && (
            <div className="overflow-x-auto">
              <h3 className="mb-2 text-sm font-semibold text-gray-900">{text.sample}</h3>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-start text-gray-600">
                    <th className="px-2 py-2 text-start">{text.student}</th>
                    <th className="px-2 py-2 text-start">{text.username}</th>
                    <th className="px-2 py-2 text-start">{text.loginEmail}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.sample.slice(0, 10).map((student) => (
                    <tr key={student.studentId} className="border-b border-gray-100">
                      <td className="px-2 py-2">{student.fullName}</td>
                      <td className="px-2 py-2">{student.username ?? "—"}</td>
                      <td className="px-2 py-2">{student.loginEmail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
