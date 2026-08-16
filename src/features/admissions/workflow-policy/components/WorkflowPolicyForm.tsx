"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, MessageSquare, Route } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import type { AdmissionWorkflowPolicy, UpdateAdmissionWorkflowPolicy } from "../api/workflowPolicyApi";

interface WorkflowPolicyFormProps {
  policy: AdmissionWorkflowPolicy;
  canManage: boolean;
  isSaving: boolean;
  onSave: (changes: UpdateAdmissionWorkflowPolicy) => void | Promise<void>;
}

const fields = [
  { key: "requiresPlacementTest", icon: ClipboardCheck },
  { key: "requiresInterview", icon: MessageSquare },
  { key: "allowDirectAcceptance", icon: CheckCircle2 },
] as const;

export default function WorkflowPolicyForm({ policy, canManage, isSaving, onSave }: WorkflowPolicyFormProps) {
  const t = useTranslations("admissions.workflowPolicy");
  const [draft, setDraft] = useState(policy);

  const changes = useMemo(() => fields.reduce<UpdateAdmissionWorkflowPolicy>((result, { key }) => {
    if (draft[key] !== policy[key]) result[key] = draft[key];
    return result;
  }, {}), [draft, policy]);
  const isDirty = Object.keys(changes).length > 0;
  const showDirectAcceptanceWarning = !draft.requiresPlacementTest && !draft.requiresInterview && !draft.allowDirectAcceptance;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-primary/10 p-2 text-primary"><Route aria-hidden="true" className="h-5 w-5" /></span>
            <div><h2 className="font-semibold text-gray-900">{t("summary.title")}</h2><p className="mt-1 text-sm text-gray-600">{t("summary.description")}</p></div>
          </div>
          <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">{t(`source.${policy.source}`)}</span>
        </div>
        {policy.updatedAt ? <p className="mt-4 text-xs text-gray-500">{t("summary.updatedAt", { value: new Date(policy.updatedAt).toLocaleString() })}</p> : null}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {fields.map(({ key, icon: Icon }) => (
          <label key={key} className="flex cursor-pointer items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition-colors duration-200 hover:border-primary/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40">
            <span className="rounded-xl bg-gray-100 p-2 text-gray-700"><Icon aria-hidden="true" className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-semibold text-gray-900">{t(`${key}.label`)}</span><span className="mt-1 block text-sm leading-6 text-gray-600">{t(`${key}.description`)}</span></span>
            <input role="switch" type="checkbox" aria-label={t(`${key}.label`)} checked={draft[key]} disabled={!canManage || isSaving} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.checked }))} className="mt-1 h-5 w-5 cursor-pointer rounded border-gray-300 text-primary focus:ring-primary disabled:cursor-not-allowed" />
          </label>
        ))}
      </div>

      {showDirectAcceptanceWarning ? <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" /><p>{t("directAcceptanceWarning")}</p></div> : null}
      {!canManage ? <p className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">{t("readOnly")}</p> : null}

      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={() => setDraft(policy)} disabled={!canManage || !isDirty || isSaving}>{t("actions.reset")}</Button>
        <Button type="button" onClick={() => void onSave(changes)} disabled={!canManage || !isDirty || isSaving} loading={isSaving}>{t("actions.save")}</Button>
      </div>
    </div>
  );
}
