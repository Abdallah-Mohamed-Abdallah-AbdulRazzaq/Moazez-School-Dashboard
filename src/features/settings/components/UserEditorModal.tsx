"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Modal from "@/components/ui/modal/Modal";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import SettingsWorkflowErrorAlert from "@/features/settings/shared/components/SettingsWorkflowErrorAlert";
import {
  checkUsernameAvailability,
  fetchLoginIdentitySettings,
  previewLoginIdentityUsername,
} from "@/features/settings/login-identity/services/loginIdentityService";
import type {
  LoginIdentitySettings,
  UsernameAvailabilityResponse,
  UsernamePreviewResponse,
} from "@/features/settings/login-identity/types";
import { isApiError } from "@/lib/api-error";
import type {
  RoleDefinition,
  SettingsUserRecord,
} from "@/features/settings/types";
import type { SettingsWorkflowError } from "@/features/settings/shared/utils/settingsWorkflowErrors";

type UserEditorField = "fullName" | "username" | "contactEmail" | "email" | "roleId";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_EDITOR_FORM_ID = "settings-user-editor-form";

function initialRoleId(
  mode: UserEditorModalProps["mode"],
  user: SettingsUserRecord | null | undefined,
  roles: RoleDefinition[],
) {
  if (mode !== "edit" || !user) {
    return "";
  }
  return roles.some((role) => role.id === user.roleId) ? user.roleId : "";
}

interface UserEditorModalProps {
  isOpen: boolean;
  mode: "create" | "invite" | "edit";
  user?: SettingsUserRecord | null;
  roles: RoleDefinition[];
  errors?: Partial<Record<UserEditorField, string>>;
  formError?: string | null;
  workflowError?: SettingsWorkflowError | null;
  onFieldChange?: (field: UserEditorField) => void;
  onClose: () => void;
  onSubmit: (payload: {
    fullName: string;
    username?: string;
    contactEmail?: string;
    email?: string;
    roleId: string;
  }) => Promise<void>;
}

export default function UserEditorModal({
  isOpen,
  mode,
  user,
  roles,
  errors,
  formError,
  workflowError,
  onFieldChange,
  onClose,
  onSubmit,
}: UserEditorModalProps) {
  const t = useTranslations("settings.users");
  const tCommon = useTranslations("common");
  const [fullName, setFullName] = useState(() => user?.fullName || "");
  const [username, setUsername] = useState(() => user?.username || "");
  const [contactEmail, setContactEmail] = useState(
    () => user?.contactEmail || "",
  );
  const [email, setEmail] = useState(() => user?.email || "");
  const assignableRoles = useMemo(
    () => roles.filter((role) => role.key !== "teacher"),
    [roles],
  );
  const [roleId, setRoleId] = useState(() =>
    initialRoleId(mode, user, assignableRoles),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [localErrors, setLocalErrors] = useState<
    Partial<Record<"email" | "contactEmail", string>>
  >({});
  const [preview, setPreview] = useState<UsernamePreviewResponse | null>(null);
  const [availability, setAvailability] =
    useState<UsernameAvailabilityResponse | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [identitySettings, setIdentitySettings] =
    useState<LoginIdentitySettings | null>(null);
  const [identityLoadState, setIdentityLoadState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [identityReloadKey, setIdentityReloadKey] = useState(0);
  const usesUsernameFlow =
    mode !== "edit" &&
    identityLoadState === "ready" &&
    identitySettings?.configured === true &&
    identitySettings.status === "active";
  const usesLegacyEmailFlow =
    mode !== "edit" && identityLoadState === "ready" && !usesUsernameFlow;
  const generatedLoginEmail = preview?.loginEmail || user?.email || "";
  const isUsernameAvailable = availability?.available ?? null;
  const usernameAvailabilityMessage = (reason?: string | null) => {
    if (reason === "username_invalid") {
      return t("identity.username_invalid");
    }
    if (reason === "reserved_username") {
      return t("identity.username_reserved");
    }
    return t("identity.username_unavailable");
  };
  const availabilityMessage = usernameAvailabilityMessage(availability?.reason);
  const previousOpenRef = useRef(isOpen);
  const previousModeRef = useRef(mode);
  const previousUserRef = useRef(user);
  const rolesKey = roles.map((role) => role.id).join("|");
  const previousRolesKeyRef = useRef(rolesKey);

  useEffect(() => {
    const opened = isOpen && !previousOpenRef.current;
    const targetChanged =
      isOpen &&
      (previousModeRef.current !== mode ||
        previousUserRef.current !== user ||
        previousRolesKeyRef.current !== rolesKey);
    previousOpenRef.current = isOpen;
    previousModeRef.current = mode;
    previousUserRef.current = user;
    previousRolesKeyRef.current = rolesKey;

    if (!isOpen || (!opened && !targetChanged)) {
      return;
    }
    void Promise.resolve().then(() => {
      setFullName(user?.fullName || "");
      setUsername(user?.username || "");
      setContactEmail(user?.contactEmail || "");
      setEmail(user?.email || "");
      setRoleId(initialRoleId(mode, user, assignableRoles));
      setIsSaving(false);
      setShowDiscardConfirm(false);
      setLocalErrors({});
      void Promise.resolve().then(() => setPreview(null));
      setAvailability(null);
      setIdentityError(null);
    });
  }, [assignableRoles, isOpen, mode, rolesKey, user]);

  useEffect(() => {
    if (!isOpen || mode === "edit") {
      return;
    }

    let cancelled = false;
    void Promise.resolve().then(() => setIdentityLoadState("loading"));
    void fetchLoginIdentitySettings()
      .then((settings) => {
        if (!cancelled) {
          setIdentitySettings(settings);
          setIdentityLoadState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIdentitySettings(null);
          setIdentityLoadState("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [identityReloadKey, isOpen, mode]);

  useEffect(() => {
    if (!isOpen || !usesUsernameFlow) {
      return;
    }
    const trimmedUsername = username.trim();
    void Promise.resolve().then(() => {
      setAvailability(null);
      setIdentityError(null);
    });
    if (!trimmedUsername) {
      void Promise.resolve().then(() => setPreview(null));
      void Promise.resolve().then(() => setIsPreviewing(false));
      return;
    }

    let cancelled = false;
    void Promise.resolve().then(() => setIsPreviewing(true));
    const timeoutId = window.setTimeout(() => {
      void previewLoginIdentityUsername(trimmedUsername)
        .then((nextPreview) => {
          if (!cancelled) {
            setPreview(nextPreview);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setPreview(null);
            setIdentityError(
              isApiError(error) && error.code === "iam.user.username_invalid"
                ? t("identity.username_invalid")
                : t("identity.preview_failed"),
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsPreviewing(false);
          }
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, t, username, usesUsernameFlow]);

  const isValid = useMemo(
    () =>
      Boolean(
        fullName.trim() &&
          roleId &&
          (mode === "edit" ||
            (usesUsernameFlow && username.trim()) ||
            (usesLegacyEmailFlow && email.trim())),
      ),
    [
      email,
      fullName,
      mode,
      roleId,
      username,
      usesLegacyEmailFlow,
      usesUsernameFlow,
    ],
  );
  const hasUnsavedChanges =
    fullName !== (user?.fullName || "") ||
    username !== (user?.username || "") ||
    contactEmail !== (user?.contactEmail || "") ||
    email !== (user?.email || "") ||
    roleId !== initialRoleId(mode, user, assignableRoles);

  const emailError = (value: string, messageKey: string) =>
    value.trim() && !EMAIL_PATTERN.test(value.trim()) ? t(messageKey) : undefined;

  const validateEmails = () => {
    const nextErrors = {
      email: usesLegacyEmailFlow
        ? emailError(email, "identity.login_email_invalid")
        : undefined,
      contactEmail: emailError(
        contactEmail,
        "identity.contact_email_invalid",
      ),
    };
    setLocalErrors(nextErrors);
    return !nextErrors.email && !nextErrors.contactEmail;
  };

  const requestClose = () => {
    if (isSaving) {
      return;
    }
    if (hasUnsavedChanges) {
      setShowDiscardConfirm(true);
      return;
    }
    onClose();
  };

  const handleCheckAvailability = async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setIdentityError(t("identity.username_required"));
      return null;
    }
    setIsCheckingAvailability(true);
    setIdentityError(null);
    try {
      const nextAvailability = await checkUsernameAvailability(trimmedUsername);
      setAvailability(nextAvailability);
      return nextAvailability;
    } catch {
      setAvailability(null);
      setIdentityError(t("identity.availability_failed"));
      return null;
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!isValid || !validateEmails()) {
      return;
    }
    if (usesUsernameFlow) {
      const nextAvailability =
        availability?.username === username.trim()
          ? availability
          : await handleCheckAvailability();
      if (!nextAvailability?.available) {
        setIdentityError(
          nextAvailability
            ? usernameAvailabilityMessage(nextAvailability.reason)
            : t("identity.username_unavailable"),
        );
        return;
      }
    }
    setIsSaving(true);
    try {
      await onSubmit({
        fullName: fullName.trim(),
        ...(usesUsernameFlow ? { username: username.trim() } : {}),
        ...(usesLegacyEmailFlow ? { email: email.trim() } : {}),
        contactEmail: contactEmail.trim() || undefined,
        roleId,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !showDiscardConfirm}
        onClose={requestClose}
        closeOnEscape={!isSaving}
        closeOnOverlayClick={!isSaving}
        showCloseButton={!isSaving}
        title={
          mode === "create"
            ? t("create_user")
            : mode === "invite"
              ? t("invite_user")
              : t("edit_user")
        }
        description={t(`descriptions.${mode}`)}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={requestClose}
              disabled={isSaving}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              form={USER_EDITOR_FORM_ID}
              variant="primary"
              disabled={!isValid || isSaving}
              loading={isSaving}
            >
              {isSaving
                ? tCommon("saving")
                : mode === "invite"
                  ? t("send_invite")
                  : tCommon("save")}
            </Button>
          </>
        }
      >
        <form
          id={USER_EDITOR_FORM_ID}
          className="space-y-4"
          noValidate
          onSubmit={(event) => void handleSubmit(event)}
        >
          {formError ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {formError}
            </p>
          ) : null}
          {workflowError ? (
            <SettingsWorkflowErrorAlert error={workflowError} />
          ) : null}
        {mode !== "edit" && identityLoadState === "loading" ? (
          <p
            role="status"
            aria-live="polite"
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
          >
            {t("identity.settings_loading")}
          </p>
        ) : null}
        {mode !== "edit" && identityLoadState === "error" ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            <p>{t("identity.settings_load_failed")}</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => setIdentityReloadKey((current) => current + 1)}
            >
              {t("identity.retry_settings")}
            </Button>
          </div>
        ) : null}
        <Input
          label={t("table.name")}
          value={fullName}
          onChange={(event) => {
            setFullName(event.target.value);
            onFieldChange?.("fullName");
          }}
          error={errors?.fullName}
          required
        />
        {usesUsernameFlow ? (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <Input
              label={t("table.username")}
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                onFieldChange?.("username");
              }}
              onBlur={() => void handleCheckAvailability()}
              error={errors?.username}
              required
            />
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-gray-700">
                  {t("identity.generated_login_email")}
                </span>
                {isPreviewing ? (
                  <span
                    role="status"
                    aria-label={t("identity.previewing")}
                    className="text-gray-500"
                  >
                    <Loader2
                      className="h-4 w-4 animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                  </span>
                ) : null}
              </div>
              <p className="mt-1 break-all font-semibold text-gray-900">
                {generatedLoginEmail || t("not_available")}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {t("identity.login_identity_note")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={isCheckingAvailability}
                disabled={!username.trim() || isCheckingAvailability}
                onClick={() => void handleCheckAvailability()}
              >
                {t("identity.check_availability")}
              </Button>
              {availability ? (
                <span
                  role="status"
                  aria-live="polite"
                  className={`inline-flex items-center gap-1 text-sm ${
                    isUsernameAvailable ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {isUsernameAvailable ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                  )}
                  {isUsernameAvailable
                    ? t("identity.username_available")
                    : availabilityMessage}
                </span>
              ) : null}
            </div>
            {identityError ? (
              <p role="alert" className="text-sm text-red-600">
                {identityError}
              </p>
            ) : null}
          </div>
        ) : usesLegacyEmailFlow ? (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm text-gray-600">
              {t("identity.legacy_email_note")}
            </p>
            <Input
              label={t("table.login_email")}
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setLocalErrors((current) => ({
                  ...current,
                  email: undefined,
                }));
                onFieldChange?.("email");
              }}
              onBlur={() =>
                setLocalErrors((current) => ({
                  ...current,
                  email: emailError(
                    email,
                    "identity.login_email_invalid",
                  ),
                }))
              }
              error={localErrors.email || errors?.email}
              required
            />
          </div>
        ) : mode === "edit" ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
            <p className="font-medium text-gray-700">
              {t("identity.generated_login_email")}
            </p>
            <p className="mt-1 break-all font-semibold text-gray-900">
              {user?.email || t("not_available")}
            </p>
            {user?.username ? (
              <p className="mt-1 text-xs text-gray-500">
                {t("table.username")}: {user.username}
              </p>
            ) : null}
          </div>
        ) : null}
        <Input
          label={t("table.contact_email")}
          type="email"
          value={contactEmail}
          onChange={(event) => {
            setContactEmail(event.target.value);
            setLocalErrors((current) => ({
              ...current,
              contactEmail: undefined,
            }));
            onFieldChange?.("contactEmail");
          }}
          onBlur={() =>
            setLocalErrors((current) => ({
              ...current,
              contactEmail: emailError(
                contactEmail,
                "identity.contact_email_invalid",
              ),
            }))
          }
          disabled={mode === "edit"}
          error={localErrors.contactEmail || errors?.contactEmail}
          helperText={
            mode === "edit" ? t("identity.contact_email_read_only") : undefined
          }
        />
        <Select
          label={t("filters.role")}
          value={roleId}
          placeholder={t("filters.select_role")}
          onChange={(value) => {
            setRoleId(value);
            onFieldChange?.("roleId");
          }}
          options={assignableRoles.map((role) => ({
            value: role.id,
            label: role.name,
          }))}
          error={errors?.roleId}
          required
        />
        </form>
      </Modal>
      <ConfirmDialog
        isOpen={isOpen && showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onClose();
        }}
        title={t("discard.title")}
        description={t("discard.description")}
        confirmLabel={t("discard.confirm")}
        cancelLabel={tCommon("cancel")}
        severity="warning"
      />
    </>
  );
}
