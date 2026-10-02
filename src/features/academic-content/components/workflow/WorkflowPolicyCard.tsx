"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { usePermissions } from "@/hooks/usePermissions";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import {
  getAcademicContentWorkflowPolicy,
  updateAcademicContentWorkflowPolicy,
} from "../../services/academicContentApi";
import { academicContentUiError } from "../../services/academicContentErrors";
import type { AcademicContentWorkflowPolicy } from "../../types/contracts";

export default function WorkflowPolicyCard() {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("academics.academic_content.settings.manage");
  const [policy, setPolicy] = useState<AcademicContentWorkflowPolicy | null>(null);
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const loadRequestId = useRef(0);
  const t = useAcademicContentTranslations("workflow_policy");
  const commonT = useAcademicContentTranslations("common");

  const load = useCallback(() => {
    const requestId = loadRequestId.current + 1;
    loadRequestId.current = requestId;
    setIsLoading(true);
    setError(null);
    void getAcademicContentWorkflowPolicy()
      .then((loadedPolicy) => {
        if (loadRequestId.current !== requestId) return;
        setPolicy(loadedPolicy);
        setApprovalRequired(loadedPolicy.preparationApprovalRequired);
      })
      .catch((loadError: unknown) => {
        if (loadRequestId.current === requestId) {
          setError(academicContentUiError(loadError).message);
        }
      })
      .finally(() => {
        if (loadRequestId.current === requestId) setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
    return () => {
      loadRequestId.current += 1;
    };
  }, [load]);

  const save = async () => {
    if (!policy || approvalRequired === policy.preparationApprovalRequired) return;
    setIsSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updatedPolicy = await updateAcademicContentWorkflowPolicy({
        preparationApprovalRequired: approvalRequired,
      });
      setPolicy(updatedPolicy);
      setApprovalRequired(updatedPolicy.preparationApprovalRequired);
      setSaved(true);
    } catch (saveError) {
      setApprovalRequired(policy.preparationApprovalRequired);
      setError(academicContentUiError(saveError).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PartialLoader />;
  }

  if (!policy) {
    return (
      <EmptyState
        title={t("unavailable_title")}
        message={error ?? t("unavailable_message")}
        action={<Button onClick={load}>{commonT("retry")}</Button>}
      />
    );
  }

  const isDirty = approvalRequired !== policy.preparationApprovalRequired;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="mt-1 text-sm text-gray-600">{t("description")}</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {saved && (
        <div role="status" className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {t("saved")}
        </div>
      )}
      {!canManage && (
        <p className="mt-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          {t("read_only")}
        </p>
      )}

      <label
        className={`mt-6 flex gap-3 rounded-lg border border-gray-200 p-4 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary ${
          canManage ? "cursor-pointer" : "cursor-not-allowed"
        }`}
      >
        <input
          type="checkbox"
          aria-label={t("preparation_approval")}
          checked={approvalRequired}
          disabled={!canManage || isSaving}
          onChange={(event) => {
            setApprovalRequired(event.target.checked);
            setSaved(false);
          }}
          className="mt-1 size-4 rounded border-gray-300 text-primary focus:ring-primary disabled:cursor-not-allowed"
        />
        <span>
          <span className="block text-sm font-medium text-gray-900">
            {t("preparation_approval")}
          </span>
          <span className="mt-1 block text-xs text-gray-600">
            {t("preparation_approval_help")}
          </span>
        </span>
      </label>

      {canManage && (
        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            loading={isSaving}
            disabled={!isDirty}
            leftIcon={<Save aria-hidden="true" className="size-4" />}
            onClick={() => void save()}
          >
            {t("save")}
          </Button>
        </div>
      )}
    </section>
  );
}
