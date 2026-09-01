"use client";

import { useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Button from "@/components/ui/button/Button";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import BulkRegistrationBatchSummary, {
  bulkRegistrationPlacementLabel,
} from "../components/BulkRegistrationBatchSummary";
import BulkRegistrationConfirmation from "../components/BulkRegistrationConfirmation";
import BulkRegistrationRowsTable from "../components/BulkRegistrationRowsTable";
import BulkRegistrationUploadPanel from "../components/BulkRegistrationUploadPanel";
import { useBulkRegistrationBatch } from "../hooks/useBulkRegistrationBatch";
import { useBulkRegistrationConfirmation } from "../hooks/useBulkRegistrationConfirmation";
import { useBulkRegistrationCorrection } from "../hooks/useBulkRegistrationCorrection";
import { useBulkRegistrationPlacementNames } from "../hooks/useBulkRegistrationPlacementNames";
import { useBulkRegistrationRows } from "../hooks/useBulkRegistrationRows";

interface BulkRegistrationBatchPageProps {
  batchId: string;
}

const CORRECTABLE_FAILURES = new Set([
  "VALIDATION_FAILED",
  "EXECUTION_PARTIAL_FAILED",
  "FAILED",
]);

const copy = {
  en: {
    eyebrow: "Students and guardians",
    title: "Bulk registration batch",
    description:
      "Review backend validation, confirm a fresh ready batch, and continue to credentials after completion.",
    loadFailed: "The registration batch could not be loaded.",
    refresh: "Refresh batch",
    stale: "The batch changed before confirmation. Review the refreshed result.",
    confirmFailed: "Registration could not be confirmed.",
    confirmed: "Registration started.",
    correctedTitle: "Upload corrected CSV",
    correctedDescription:
      "This creates a new batch and leaves the current batch unchanged.",
    uploadSuccess: "Corrected CSV uploaded as a new batch.",
    uploadFailed: "The corrected CSV could not be uploaded.",
    downloadSuccess: "CSV template downloaded.",
    downloadFailed: "CSV template could not be downloaded.",
    completedTitle: "Student creation is complete",
    completedDescription:
      "Continue to credentials with this registration batch as the source.",
    credentials: "Continue to credentials",
  },
  ar: {
    eyebrow: "الطلاب وأولياء الأمور",
    title: "دفعة التسجيل الجماعي",
    description:
      "راجع تحقق الخادم، وأكد الدفعة الجاهزة الحديثة، ثم انتقل إلى بيانات الدخول بعد الاكتمال.",
    loadFailed: "تعذر تحميل دفعة التسجيل.",
    refresh: "تحديث الدفعة",
    stale: "تغيرت الدفعة قبل التأكيد. راجع النتيجة المحدثة.",
    confirmFailed: "تعذر تأكيد التسجيل.",
    confirmed: "بدأ تنفيذ التسجيل.",
    correctedTitle: "رفع ملف CSV مصحح",
    correctedDescription:
      "ينشئ هذا الإجراء دفعة جديدة ويترك الدفعة الحالية دون تغيير.",
    uploadSuccess: "تم رفع CSV المصحح كدفعة جديدة.",
    uploadFailed: "تعذر رفع ملف CSV المصحح.",
    downloadSuccess: "تم تنزيل قالب CSV.",
    downloadFailed: "تعذر تنزيل قالب CSV.",
    completedTitle: "اكتمل إنشاء الطلاب",
    completedDescription:
      "انتقل إلى بيانات الدخول باستخدام دفعة التسجيل هذه كمصدر.",
    credentials: "الانتقال إلى بيانات الدخول",
  },
} as const;

export default function BulkRegistrationBatchPage({
  batchId,
}: BulkRegistrationBatchPageProps) {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const text = copy[locale];
  const params = useParams<{ lang?: string }>();
  const lang = typeof params.lang === "string" ? params.lang : locale;
  const router = useRouter();
  const polling = useBulkRegistrationBatch(batchId);
  const polledBatch = polling.data?.id === batchId ? polling.data : null;
  const confirmation = useBulkRegistrationConfirmation({
    batchId,
    polledBatch,
    polling,
    messages: text,
  });
  const batch = confirmation.batch;
  const correction = useBulkRegistrationCorrection({
    batchId,
    batch,
    lang,
    messages: text,
  });
  const placementNames = useBulkRegistrationPlacementNames(
    polledBatch?.placement ?? null,
    locale,
  );
  const rowState = useBulkRegistrationRows({
    batchId,
    batchStatus: batch?.status,
  });

  const placementLabel = useMemo(
    () => (batch ? bulkRegistrationPlacementLabel(batch, placementNames) : ""),
    [batch, placementNames],
  );
  const openStudent = useCallback(
    (studentId: string) => {
      router.push(`/${lang}/students-guardians/students/${studentId}`);
    },
    [lang, router],
  );
  if (polling.isInitialLoading && !batch) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <PartialLoader />
      </div>
    );
  }

  if (!batch) {
    return (
      <EmptyState
        message={text.loadFailed}
        action={<Button onClick={polling.retry}>{text.refresh}</Button>}
      />
    );
  }

  const correctableFailure = CORRECTABLE_FAILURES.has(batch.status);

  return (
    <div
      className="min-h-full bg-gray-50 px-4 py-6 sm:px-6 lg:px-8"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-medium text-primary">{text.eyebrow}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            {text.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            {text.description}
          </p>
        </header>

        <BulkRegistrationBatchSummary
          batch={batch}
          placementNames={placementNames}
        />

        <BulkRegistrationConfirmation
          batch={batch}
          placementLabel={placementLabel}
          fresh={confirmation.freshReady}
          loading={confirmation.confirming}
          onConfirm={() => void confirmation.confirm()}
        />

        {correctableFailure ? (
          <section className="space-y-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {text.correctedTitle}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {text.correctedDescription}
              </p>
            </div>
            <BulkRegistrationUploadPanel
              enabled
              selectedFile={correction.selectedFile}
              downloadingTemplate={correction.downloadingTemplate}
              uploading={correction.uploading}
              onDownloadTemplate={() => void correction.downloadTemplate()}
              onFileChange={correction.setSelectedFile}
              onUpload={() => void correction.upload()}
            />
          </section>
        ) : null}

        {batch.status === "COMPLETED" ? (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="text-lg font-semibold text-emerald-900">
              {text.completedTitle}
            </h2>
            <p className="mt-1 text-sm text-emerald-800">
              {text.completedDescription}
            </p>
            <div className="mt-4">
              <Button
                onClick={() =>
                  router.push(
                    `/${lang}/students-guardians/credentials?sourceRegistrationBatchId=${encodeURIComponent(batch.id)}`,
                  )
                }
              >
                {text.credentials}
              </Button>
            </div>
          </section>
        ) : null}

        <BulkRegistrationRowsTable
          rows={rowState.rows}
          page={rowState.page}
          limit={rowState.limit}
          total={rowState.total}
          status={rowState.status}
          loading={rowState.loading}
          loadFailed={rowState.loadFailed}
          onPageChange={rowState.setPage}
          onPageSizeChange={rowState.changeLimit}
          onStatusChange={rowState.changeStatus}
          onRetry={rowState.retry}
          onOpenStudent={openStudent}
        />
      </div>
    </div>
  );
}
