"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { AccessDenied, Button } from "@/components/ui";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import WorkflowPolicyForm from "../components/WorkflowPolicyForm";
import {
  getAdmissionWorkflowPolicy,
  updateAdmissionWorkflowPolicy,
  type AdmissionWorkflowPolicy,
  type UpdateAdmissionWorkflowPolicy,
} from "../api/workflowPolicyApi";

export default function AdmissionsWorkflowPolicyPage() {
  const t = useTranslations("admissions.workflowPolicy");
  const { hasPermission, isPermissionsReady } = usePermissions();
  const { showToast } = useToast();
  const canView = hasPermission("admissions.applications.view");
  const canManage = hasPermission("admissions.applications.manage");
  const [policy, setPolicy] = useState<AdmissionWorkflowPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(
    () => !isPermissionsReady || canView,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadPolicy = useCallback(async () => {
    if (!canView) return;
    setIsLoading(true);
    setLoadError(false);
    try {
      setPolicy(await getAdmissionWorkflowPolicy());
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    if (!isPermissionsReady || !canView) {
      return;
    }

    void Promise.resolve().then(loadPolicy);
  }, [canView, isPermissionsReady, loadPolicy]);

  const savePolicy = async (changes: UpdateAdmissionWorkflowPolicy) => {
    setIsSaving(true);
    try {
      setPolicy(await updateAdmissionWorkflowPolicy(changes));
      showToast(t("messages.saved"), "success");
    } catch {
      showToast(t("messages.saveFailed"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isPermissionsReady && !canView)
    return (
      <div className="p-4 sm:p-6">
        <AccessDenied
          title={t("accessDenied.title")}
          description={t("accessDenied.description")}
        />
      </div>
    );

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-start gap-3">
          <span className="rounded-2xl bg-primary p-3 text-white">
            <Settings2 aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
              {t("description")}
            </p>
          </div>
        </header>

        {isLoading ? (
          <div
            className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600"
            role="status"
          >
            {t("states.loading")}
          </div>
        ) : null}
        {!isLoading && loadError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-semibold text-red-900">
              {t("states.loadFailed")}
            </h2>
            <p className="mt-1 text-sm text-red-800">
              {t("states.loadFailedDescription")}
            </p>
            <Button
              className="mt-4"
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => void loadPolicy()}
            >
              {t("actions.retry")}
            </Button>
          </div>
        ) : null}
        {!isLoading && !loadError && policy ? (
          <WorkflowPolicyForm
            key={JSON.stringify(policy)}
            policy={policy}
            canManage={canManage}
            isSaving={isSaving}
            onSave={savePolicy}
          />
        ) : null}
      </div>
    </main>
  );
}
