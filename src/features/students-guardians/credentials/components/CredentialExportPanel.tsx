"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Button from "@/components/ui/button/Button";
import { isApiError } from "@/lib/api-error";
import { downloadCredentialBatch } from "../api/credentialBatchApi";
import { getCredentialExportErrorCode } from "../model/credentialBatchModel";

interface CredentialExportPanelProps {
  batchId: string;
  enabled: boolean;
  canManage: boolean;
}

const copy = {
  en: {
    title: "Credential CSV export",
    notice:
      "This is a sensitive file containing temporary passwords. Store it securely; the protected export expires after 24 hours.",
    download: "Download credential CSV",
    permission: "Credential export requires user-management permission.",
    unknown: "The credential export could not be downloaded.",
    errors: {
      "students.credentials.export_not_ready": "The export is not ready yet.",
      "students.credentials.export_empty":
        "No generated credentials are available to export.",
      "students.credentials.export_too_large": "The credential export is too large.",
      "students.credentials.secret_artifact_unavailable":
        "The temporary credential file is unavailable.",
      "students.credentials.secret_artifact_expired":
        "The temporary credential file has expired.",
      "students.credentials.secret_artifact_invalid":
        "The temporary credential file is invalid.",
      "students.credentials.execution_invariant_invalid.export_placement_provenance_invalid":
        "The academic placement could not be verified for export.",
    },
  },
  ar: {
    title: "تصدير CSV لبيانات الدخول",
    notice:
      "هذا ملف حساس يحتوي كلمات مرور مؤقتة. خزّنه بأمان؛ ينتهي التصدير المحمي بعد 24 ساعة.",
    download: "تنزيل CSV لبيانات الدخول",
    permission: "يتطلب التصدير صلاحية إدارة المستخدمين.",
    unknown: "تعذر تنزيل ملف بيانات الدخول.",
    errors: {
      "students.credentials.export_not_ready": "ملف التصدير غير جاهز بعد.",
      "students.credentials.export_empty": "لا توجد بيانات دخول منشأة للتصدير.",
      "students.credentials.export_too_large": "ملف التصدير كبير جدًا.",
      "students.credentials.secret_artifact_unavailable":
        "ملف بيانات الدخول المؤقتة غير متاح.",
      "students.credentials.secret_artifact_expired":
        "انتهت صلاحية ملف بيانات الدخول المؤقتة.",
      "students.credentials.secret_artifact_invalid":
        "ملف بيانات الدخول المؤقتة غير صالح.",
      "students.credentials.execution_invariant_invalid.export_placement_provenance_invalid":
        "تعذر التحقق من التسكين الأكاديمي للتصدير.",
    },
  },
} as const;

type ExportErrorCode = keyof (typeof copy)["en"]["errors"];

function exportErrorCode(error: unknown): string {
  if (!isApiError(error)) return "unknown";
  const reasonCode =
    error.details && typeof error.details === "object"
      ? (error.details as { reasonCode?: unknown }).reasonCode
      : undefined;
  return getCredentialExportErrorCode(
    error.code,
    typeof reasonCode === "string" ? reasonCode : undefined,
  );
}

export default function CredentialExportPanel({
  batchId,
  enabled,
  canManage,
}: CredentialExportPanelProps) {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const text = copy[locale];
  const [downloading, setDownloading] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const download = async () => {
    if (!enabled || !canManage || downloading) return;
    setDownloading(true);
    setErrorCode(null);
    try {
      await downloadCredentialBatch(batchId);
    } catch (error) {
      setErrorCode(exportErrorCode(error));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <h2 className="text-lg font-semibold text-amber-950">{text.title}</h2>
      <p className="mt-1 text-sm text-amber-900">{text.notice}</p>
      {!canManage && <p className="mt-2 text-sm text-amber-900">{text.permission}</p>}
      {errorCode && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {errorCode === "unknown"
            ? text.unknown
            : text.errors[errorCode as ExportErrorCode]}
        </p>
      )}
      <div className="mt-4">
        <Button
          type="button"
          loading={downloading}
          disabled={!enabled || !canManage}
          onClick={download}
        >
          {text.download}
        </Button>
      </div>
    </section>
  );
}
