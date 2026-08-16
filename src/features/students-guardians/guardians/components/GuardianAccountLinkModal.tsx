"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Eye, Link as LinkIcon, Loader2 } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import Modal from "@/components/ui/modal/Modal";
import { useToast } from "@/components/ui/toast/Toast";
import {
  linkGuardianAccount,
  type AccountLinkMode,
  type AccountLinkRequest,
  type AccountLinkResponse,
  type TemporaryPasswordMode,
} from "@/features/students-guardians/services/accountLinkingService";
import { previewLoginIdentityUsername } from "@/features/settings/login-identity/services/loginIdentityService";
import { isApiError } from "@/lib/api-error";
import { useTranslations } from "next-intl";
import type { StudentGuardian } from "@/features/students-guardians/students/types";
import ExistingAccountPicker from "@/features/students-guardians/shared/components/ExistingAccountPicker";
import type { SettingsUserRecord } from "@/features/settings/types";

interface GuardianAccountLinkModalProps {
  isOpen: boolean;
  guardian: StudentGuardian | null;
  onClose: () => void;
  onLinked?: (response: AccountLinkResponse) => void;
}

function getTemporaryPassword(response: AccountLinkResponse | null) {
  return response?.temporaryPassword || "";
}

export default function GuardianAccountLinkModal({
  isOpen,
  guardian,
  onClose,
  onLinked,
}: GuardianAccountLinkModalProps) {
  const t = useTranslations("students_guardians.account_linking");
  const { showSuccess, showError } = useToast();
  const [mode, setMode] = useState<AccountLinkMode>("create");
  const [username, setUsername] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [temporaryPasswordMode, setTemporaryPasswordMode] =
    useState<TemporaryPasswordMode>("generate");
  const [previewEmail, setPreviewEmail] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedResponse, setLinkedResponse] =
    useState<AccountLinkResponse | null>(null);
  const [selectedUser, setSelectedUser] = useState<SettingsUserRecord | null>(
    null,
  );

  const temporaryPassword = useMemo(
    () => getTemporaryPassword(linkedResponse),
    [linkedResponse],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    void Promise.resolve().then(() => {
      setMode("create");
      setUsername("");
      setContactEmail(guardian?.email || "");
      setTemporaryPasswordMode("generate");
      setPreviewEmail("");
      setError(null);
      setLinkedResponse(null);
      setSelectedUser(null);
    });
  }, [guardian, isOpen]);

  useEffect(() => {
    if (!isOpen || mode !== "create" || !username.trim()) {
      void Promise.resolve().then(() => setPreviewEmail(""));
      return;
    }

    let isCancelled = false;
    const timeout = window.setTimeout(() => {
      setIsPreviewing(true);
      void previewLoginIdentityUsername(username.trim())
        .then((preview) => {
          if (!isCancelled) {
            setPreviewEmail(preview.loginEmail || "");
          }
        })
        .catch((previewError) => {
          if (!isCancelled) {
            setPreviewEmail("");
            if (
              isApiError(previewError) &&
              previewError.code === "iam.user.username_invalid"
            ) {
              setError(t("validation.username_invalid"));
            }
          }
        })
        .finally(() => {
          if (!isCancelled) {
            setIsPreviewing(false);
          }
        });
    }, 350);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeout);
    };
  }, [isOpen, mode, t, username]);

  const handleClose = () => {
    setLinkedResponse(null);
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!guardian) {
      return;
    }
    if (mode === "create" && !username.trim()) {
      setError(t("validation.username_required"));
      return;
    }
    if (mode === "link" && !selectedUser) {
      setError(t("validation.user_required"));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setLinkedResponse(null);
    try {
      let payload: AccountLinkRequest;
      if (mode === "link") {
        if (!selectedUser) return;
        payload = { mode, userId: selectedUser.id };
      } else {
        payload = {
          mode,
          username: username.trim(),
          contactEmail: contactEmail.trim() || null,
          temporaryPasswordMode,
        };
      }
      const response = await linkGuardianAccount(guardian.guardianId, payload);
      setLinkedResponse(response);
      showSuccess(t("messages.linked"));
      onLinked?.(response);
    } catch (submitError) {
      const message = isApiError(submitError)
        ? submitError.message
        : t("messages.link_failed");
      setError(message);
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!temporaryPassword) {
      return;
    }
    await navigator.clipboard.writeText(temporaryPassword);
    showSuccess(t("messages.copied"));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("guardian_title")}
      size="lg"
      closeOnOverlayClick={!temporaryPassword}
      description={
        guardian ? t("for_record", { name: guardian.full_name }) : ""
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <Select
          label={t("fields.mode")}
          value={mode}
          onChange={(value) => {
            setMode(value as AccountLinkMode);
            setSelectedUser(null);
            setError(null);
          }}
          options={[
            { value: "create", label: t("modes.create") },
            { value: "link", label: t("modes.link_existing") },
          ]}
        />

        {mode === "link" ? (
          <ExistingAccountPicker
            selectedUser={selectedUser}
            onSelect={setSelectedUser}
            onClear={() => setSelectedUser(null)}
          />
        ) : (
          <>
            <Input
              label={t("fields.username")}
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setError(null);
              }}
              dir="ltr"
              required
            />
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
              <p className="font-medium text-gray-900">
                {t("fields.login_email")}
              </p>
              <div className="mt-1 flex items-center gap-2 text-gray-600">
                {isPreviewing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                <span className="break-all">
                  {previewEmail || t("preview_placeholder")}
                </span>
              </div>
            </div>
            <Input
              label={t("fields.contact_email")}
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              type="email"
              dir="ltr"
              helperText={t("guardian_contact_email_help")}
            />
            <Select
              label={t("fields.temporary_password_mode")}
              value={temporaryPasswordMode}
              onChange={(value) =>
                setTemporaryPasswordMode(value as TemporaryPasswordMode)
              }
              options={[
                { value: "generate", label: t("temporary_password.generate") },
                { value: "none", label: t("temporary_password.none") },
              ]}
            />
          </>
        )}

        {temporaryPassword ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="flex items-start gap-2">
              <Eye className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">{t("temporary_password.title")}</p>
                <p className="mt-1">{t("temporary_password.warning")}</p>
                <code className="mt-3 block break-all rounded bg-white px-3 py-2 text-gray-900">
                  {temporaryPassword}
                </code>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  leftIcon={<Copy className="h-4 w-4" />}
                  onClick={() => void handleCopyPassword()}
                >
                  {t("actions.copy")}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            {t("actions.close")}
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            leftIcon={<LinkIcon className="h-4 w-4" />}
          >
            {t("actions.submit")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
