"use client";

import { useState } from "react";
import { KeyRound, LockKeyhole, RefreshCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { useToast } from "@/components/ui/toast/Toast";
import GenerateCredentialModal from "@/features/settings/credentials/components/GenerateCredentialModal";
import SetPasswordModal from "@/features/settings/credentials/components/SetPasswordModal";
import TemporaryPasswordRevealModal from "@/features/settings/credentials/components/TemporaryPasswordRevealModal";
import type { SetCredentialPasswordRequest } from "@/features/settings/credentials/types";
import { useTeacherCredentialActions } from "@/features/teachers/hooks/useTeacherCredentialActions";
import type { TeacherDirectoryDetail } from "@/features/teachers/types/index";
import { isApiError } from "@/lib/api-error";
import { getPasswordPolicyApiFailures } from "@/utils/validation/passwordPolicy";

type GenerateMode = "generate" | "regenerate";

interface TeacherCredentialCardProps {
  teacher: TeacherDirectoryDetail;
  canManage: boolean;
  onChanged: () => Promise<void>;
}

function CredentialSummary({ teacher }: { teacher: TeacherDirectoryDetail }) {
  const locale = useLocale();
  const t = useTranslations("settings.credentials");
  const formatDate = (date: string | null) =>
    date
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(date))
      : t("not_available");

  return (
    <dl className="mt-4 grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
      <div><dt className="text-xs text-gray-500">{t("table.status")}</dt><dd className="mt-1 text-sm font-medium text-gray-900">{t(`credential_statuses.${teacher.credentialSummary.status}`)}</dd></div>
      <div><dt className="text-xs text-gray-500">{t("table.provisioned_at")}</dt><dd className="mt-1 text-sm text-gray-900">{formatDate(teacher.credentialSummary.passwordProvisionedAt)}</dd></div>
      <div><dt className="text-xs text-gray-500">{t("table.changed_at")}</dt><dd className="mt-1 text-sm text-gray-900">{formatDate(teacher.credentialSummary.passwordChangedAt)}</dd></div>
      <div><dt className="text-xs text-gray-500">{t("table.version")}</dt><dd className="mt-1 text-sm text-gray-900">{teacher.credentialSummary.credentialVersion}</dd></div>
    </dl>
  );
}

export default function TeacherCredentialCard({
  teacher,
  canManage,
  onChanged,
}: TeacherCredentialCardProps) {
  const t = useTranslations("settings.credentials");
  const tCommon = useTranslations("common");
  const tTeachers = useTranslations("teachers");
  const tPasswordPolicy = useTranslations("password_policy");
  const { showError, showSuccess } = useToast();
  const [generateMode, setGenerateMode] = useState<GenerateMode | null>(null);
  const [isSetPasswordOpen, setIsSetPasswordOpen] = useState(false);
  const [setPasswordError, setSetPasswordError] = useState<string | null>(null);
  const credentials = useTeacherCredentialActions(teacher, onChanged);
  const credentialUser = {
    fullName: teacher.displayName.fullName,
    username: teacher.username,
    loginEmail: teacher.loginEmail,
  };
  const accountIsManageable =
    teacher.accountStatus === "ACTIVE" || teacher.accountStatus === "INVITED";

  const submitTemporaryCredential = async () => {
    if (!generateMode) return;
    try {
      await credentials.provisionTemporaryCredential(generateMode);
      setGenerateMode(null);
      showSuccess(t("messages.generated"));
    } catch (error) {
      showError(isApiError(error) ? error.message : tCommon("save_failed"));
    }
  };

  const submitCustomPassword = async (request: SetCredentialPasswordRequest) => {
    setSetPasswordError(null);
    try {
      await credentials.saveCustomPassword(request);
      setIsSetPasswordOpen(false);
      showSuccess(t("messages.password_set"));
    } catch (error) {
      const policyFailures = getPasswordPolicyApiFailures(error);
      setSetPasswordError(
        policyFailures.length > 0
          ? policyFailures.map((reason) => tPasswordPolicy(reason)).join(" ")
          : isApiError(error)
            ? error.message
            : tCommon("save_failed"),
      );
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-lg font-semibold text-gray-900">{t("table.title")}</h2><p className="mt-1 text-sm text-gray-500">{t("table.description")}</p></div>
        {canManage && accountIsManageable ? <div className="flex flex-wrap gap-2"><Button variant="secondary" leftIcon={teacher.credentialSummary.hasPassword ? <RefreshCcw className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />} onClick={() => setGenerateMode(teacher.credentialSummary.hasPassword ? "regenerate" : "generate")}>{teacher.credentialSummary.hasPassword ? t("actions.regenerate") : t("actions.generate")}</Button><Button variant="secondary" leftIcon={<LockKeyhole className="h-4 w-4" />} onClick={() => { setSetPasswordError(null); setIsSetPasswordOpen(true); }}>{t("actions.set_password")}</Button></div> : null}
      </div>
      <CredentialSummary teacher={teacher} />
      {canManage && !accountIsManageable ? <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{tTeachers("credentials.management_unavailable")}</p> : null}
      {generateMode ? <GenerateCredentialModal isOpen mode={generateMode} user={credentialUser} isSubmitting={credentials.activeAction === generateMode} onClose={() => setGenerateMode(null)} onSubmit={submitTemporaryCredential} labels={{ generateTitle: t("generate.title"), regenerateTitle: t("generate.regenerate_title"), description: t("generate.description"), cancel: tCommon("cancel"), generate: t("actions.generate"), regenerate: t("actions.regenerate"), generating: t("generate.generating") }} /> : null}
      {isSetPasswordOpen ? <SetPasswordModal isOpen user={credentialUser} isSubmitting={credentials.activeAction === "set"} error={setPasswordError} onClose={() => { setIsSetPasswordOpen(false); setSetPasswordError(null); }} onSubmit={(password, forceResetOnLogin) => submitCustomPassword({ password, forceResetOnLogin })} labels={{ title: t("set.title"), description: t("set.description"), password: t("set.password"), confirmPassword: t("set.confirm_password"), mustChangePassword: t("set.must_change_password"), cancel: tCommon("cancel"), save: tCommon("save"), saving: tCommon("saving"), required: t("set.errors.required"), mismatch: t("set.errors.mismatch"), invalidLength: t("set.errors.invalid_length"), show: t("set.show"), hide: t("set.hide") }} /> : null}
      <TemporaryPasswordRevealModal isOpen={credentials.revealedCredentials.length > 0} credentials={credentials.revealedCredentials} onClose={credentials.clearRevealedCredentials} labels={{ title: t("reveal.title"), warning: t("reveal.warning"), noPassword: t("reveal.no_password"), copy: t("reveal.copy"), copied: t("reveal.copied"), close: tCommon("close"), user: t("reveal.user"), password: t("reveal.password"), show: t("reveal.show"), hide: t("reveal.hide") }} />
    </section>
  );
}
