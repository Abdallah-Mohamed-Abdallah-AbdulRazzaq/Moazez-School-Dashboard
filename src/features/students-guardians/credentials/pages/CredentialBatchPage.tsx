"use client";

import { useLocale } from "next-intl";
import Button from "@/components/ui/button/Button";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { usePermissions } from "@/hooks/usePermissions";
import CredentialBatchSummary from "../components/CredentialBatchSummary";
import CredentialExportPanel from "../components/CredentialExportPanel";
import { useCredentialBatch } from "../hooks/useCredentialBatch";
import { getCredentialBatchState } from "../model/credentialBatchModel";

interface CredentialBatchPageProps {
  batchId: string;
}

const copy = {
  en: {
    eyebrow: "Students and guardians",
    title: "Credential batch",
    description:
      "Follow asynchronous credential creation and download the protected CSV when it is ready.",
    loadFailed: "The credential batch could not be loaded.",
    refresh: "Refresh batch",
    refreshFailed: "The latest batch status could not be loaded.",
  },
  ar: {
    eyebrow: "الطلاب وأولياء الأمور",
    title: "دفعة بيانات الدخول",
    description:
      "تابع إنشاء بيانات الدخول غير المتزامن، ثم نزّل CSV المحمي عند جاهزيته.",
    loadFailed: "تعذر تحميل دفعة بيانات الدخول.",
    refresh: "تحديث الدفعة",
    refreshFailed: "تعذر تحميل أحدث حالة للدفعة.",
  },
} as const;

export default function CredentialBatchPage({ batchId }: CredentialBatchPageProps) {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const text = copy[locale];
  const polling = useCredentialBatch(batchId);
  const { hasAllPermissions, isPermissionsReady } = usePermissions();
  const batch = polling.data?.id === batchId ? polling.data : null;
  const canManage =
    isPermissionsReady &&
    hasAllPermissions(["students.records.view", "settings.users.manage"]);

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

  const state = getCredentialBatchState(batch);

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

        {polling.error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            <span>{text.refreshFailed}</span>
            <Button type="button" size="sm" variant="ghost" onClick={polling.retry}>
              {text.refresh}
            </Button>
          </div>
        )}

        <CredentialBatchSummary batch={batch} exportAvailable={state.exportEligible} />
        <CredentialExportPanel
          batchId={batch.id}
          enabled={state.exportEligible}
          canManage={canManage}
        />
      </div>
    </div>
  );
}
