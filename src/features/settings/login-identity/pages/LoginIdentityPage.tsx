"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import Button from "@/components/ui/button/Button";
import MainLoader from "@/components/ui/loaders/MainLoader";
import Modal from "@/components/ui/modal/Modal";
import { useToast } from "@/components/ui/toast/Toast";
import { getValidationFieldErrors } from "@/lib/validation-errors";
import { isApiError } from "@/lib/api-error";
import { usePermissions } from "@/hooks/usePermissions";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import LoginIdentityForm, {
  toLoginIdentityFormValues,
  toUpdateLoginIdentityRequest,
  validateLoginIdentityForm,
  type LoginIdentityFormErrors,
  type LoginIdentityFormValues,
} from "@/features/settings/login-identity/components/LoginIdentityForm";
import UsernamePreviewCard from "@/features/settings/login-identity/components/UsernamePreviewCard";
import LoginIdentitySummary from "@/features/settings/login-identity/components/LoginIdentitySummary";
import {
  checkUsernameAvailability,
  fetchLoginIdentitySettings,
  previewLoginIdentityUsername,
  updateLoginIdentitySettings,
} from "@/features/settings/login-identity/services/loginIdentityService";
import type {
  LoginIdentitySettings,
  UsernameAvailabilityResponse,
  UsernamePreviewResponse,
} from "@/features/settings/login-identity/types";
import { useTranslations } from "next-intl";
import { useDirtyKey } from "@/hooks/useDirtyKey";

const fallbackValues: LoginIdentityFormValues = {
  loginDomain: "",
  usernameMinLength: "3",
  usernameMaxLength: "64",
  allowedCharacters: "letters, numbers, dots, underscores, and hyphens",
  reservedUsernames: ["admin", "support", "root"],
  status: "disabled",
};

export default function LoginIdentityPage() {
  const t = useTranslations("settings.loginIdentity");
  const tCommon = useTranslations("common");
  const { hasPermission } = usePermissions();
  const { showSuccess, showError } = useToast();
  const { markDirty, clearDirty } = useDirtyKey("settings-login-identity");
  const canManage = hasPermission("settings.users.manage");
  const [settings, setSettings] = useState<LoginIdentitySettings | null>(null);
  const [values, setValues] =
    useState<LoginIdentityFormValues>(fallbackValues);
  const [errors, setErrors] = useState<LoginIdentityFormErrors>({});
  const [pageError, setPageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUsername, setPreviewUsername] = useState("");
  const [preview, setPreview] = useState<UsernamePreviewResponse | null>(null);
  const [availability, setAvailability] =
    useState<UsernameAvailabilityResponse | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [isTestingUsername, setIsTestingUsername] = useState(false);
  const [isConfirmingSensitiveChange, setIsConfirmingSensitiveChange] =
    useState(false);
  const testRequestIdRef = useRef(0);

  const validationMessages = useMemo(
    () => ({
      domainRequired: t("validation.domain_required"),
      minInvalid: t("validation.min_invalid"),
      maxInvalid: t("validation.max_invalid"),
      maxLessThanMin: t("validation.max_less_than_min"),
    }),
    [t],
  );

  const currentValidationErrors = useMemo(
    () => validateLoginIdentityForm(values, validationMessages),
    [validationMessages, values],
  );
  const hasUnsavedChanges = useMemo(() => {
    if (!settings) return false;
    const persistedValues = toLoginIdentityFormValues(settings);
    return (
      JSON.stringify(toUpdateLoginIdentityRequest(values)) !==
      JSON.stringify(toUpdateLoginIdentityRequest(persistedValues))
    );
  }, [settings, values]);
  const isFormValid = Object.keys(currentValidationErrors).length === 0;

  useEffect(() => {
    if (hasUnsavedChanges) {
      markDirty();
    } else {
      clearDirty();
    }
  }, [clearDirty, hasUnsavedChanges, markDirty]);

  const hydrate = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setPageError(null);

      try {
        const nextSettings = await fetchLoginIdentitySettings();
        setSettings(nextSettings);
        setValues(toLoginIdentityFormValues(nextSettings));
        setErrors({});
        setIsConfirmingSensitiveChange(false);
        clearDirty();
      } catch (error) {
        const message = isApiError(error)
          ? error.message
          : t("messages.load_failed");
        setPageError(message);
        showError(t("messages.load_failed"));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [clearDirty, showError, t],
  );

  useEffect(() => {
    void Promise.resolve().then(() => hydrate());
  }, [hydrate]);

  const handleFieldChange = (
    field: keyof LoginIdentityFormValues,
    value: string,
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleReservedUsernamesChange = (reservedUsernames: string[]) => {
    setValues((current) => ({ ...current, reservedUsernames }));
    setErrors((current) => ({ ...current, reservedUsernames: undefined }));
  };

  const handleFieldBlur = (field: keyof LoginIdentityFormValues) => {
    const nextErrors = validateLoginIdentityForm(values, validationMessages);
    setErrors((current) => ({
      ...current,
      [field]: nextErrors[field],
      ...(field === "usernameMinLength" || field === "usernameMaxLength"
        ? { usernameMaxLength: nextErrors.usernameMaxLength }
        : {}),
    }));
  };

  const persistSettings = async () => {
    setIsSaving(true);
    try {
      const saved = await updateLoginIdentitySettings(
        toUpdateLoginIdentityRequest(values),
      );
      setSettings(saved);
      setValues(toLoginIdentityFormValues(saved));
      setErrors({});
      clearDirty();
      showSuccess(t("messages.saved"));
    } catch (error) {
      const fieldErrors = getValidationFieldErrors(error);
      setErrors({
        loginDomain: fieldErrors.loginDomain,
        usernameMinLength: fieldErrors.usernameMinLength,
        usernameMaxLength: fieldErrors.usernameMaxLength,
        allowedCharacters: fieldErrors.allowedCharacters,
        reservedUsernames: fieldErrors.reservedUsernames,
        status: fieldErrors.status,
      });
      showError(
        isApiError(error)
          ? error.message || tCommon("save_failed")
          : tCommon("save_failed"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    const nextErrors = currentValidationErrors;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!settings || !hasUnsavedChanges) return;
    const persistedValues = toLoginIdentityFormValues(settings);
    const changesSensitiveIdentity =
      values.loginDomain.trim() !== persistedValues.loginDomain.trim() ||
      values.status !== persistedValues.status;
    if (changesSensitiveIdentity) {
      setIsConfirmingSensitiveChange(true);
      return;
    }
    await persistSettings();
  };

  const handleDiscard = () => {
    if (!settings) return;
    setValues(toLoginIdentityFormValues(settings));
    setErrors({});
    clearDirty();
  };

  const handlePreviewUsernameChange = (username: string) => {
    setPreviewUsername(username);
    setPreview(null);
    setAvailability(null);
    setPreviewError(null);
    setAvailabilityError(null);
    setIsTestingUsername(false);
    testRequestIdRef.current += 1;
  };

  const handleTestUsername = async () => {
    if (isTestingUsername) return;
    const username = previewUsername.trim();
    if (!username) {
      setPreviewError(t("preview.errors.username_required"));
      return;
    }
    const requestId = ++testRequestIdRef.current;
    setIsTestingUsername(true);
    setPreviewError(null);
    setAvailabilityError(null);
    setPreview(null);
    setAvailability(null);

    const [previewResult, availabilityResult] = await Promise.allSettled([
      previewLoginIdentityUsername(username),
      checkUsernameAvailability(username),
    ]);
    if (requestId !== testRequestIdRef.current) return;

    if (previewResult.status === "fulfilled") {
      setPreview(previewResult.value);
    } else {
      setPreviewError(
        isApiError(previewResult.reason) &&
        previewResult.reason.code === "iam.user.username_invalid"
          ? t("preview.reasons.username_invalid")
          : t("preview.errors.preview_failed"),
      );
    }
    if (availabilityResult.status === "fulfilled") {
      setAvailability(availabilityResult.value);
    } else {
      setAvailabilityError(
        isApiError(availabilityResult.reason)
          ? availabilityResult.reason.message
          : t("preview.errors.availability_failed"),
      );
    }
    setIsTestingUsername(false);
  };

  if (isLoading) {
    return <MainLoader />;
  }

  return (
    <SettingsAccessGuard permission="settings.users.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <SettingsPageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            <Button
              variant="secondary"
              leftIcon={<RefreshCcw className="h-4 w-4" />}
              loading={isRefreshing}
              disabled={hasUnsavedChanges}
              onClick={() => void hydrate("refresh")}
            >
              {t("refresh")}
            </Button>
          }
        />

        {pageError ? (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">{t("messages.load_failed")}</p>
              <p className="mt-1">{pageError}</p>
            </div>
          </div>
        ) : null}

        {!settings ? (
          <SettingsSectionCard
            title={t("empty.title")}
            description={t("empty.description")}
          >
            <Button
              variant="primary"
              leftIcon={<RefreshCcw className="h-4 w-4" />}
              onClick={() => void hydrate("refresh")}
            >
              {t("empty.retry")}
            </Button>
          </SettingsSectionCard>
        ) : (
          <>
            <LoginIdentitySummary settings={settings} />
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <SettingsSectionCard
              title={t("form_title")}
              description={t("form_description")}
            >
              <LoginIdentityForm
                values={values}
                settings={settings}
                errors={errors}
                canManage={canManage}
                isSaving={isSaving}
                isDirty={hasUnsavedChanges}
                isValid={isFormValid}
                onChange={handleFieldChange}
                onReservedUsernamesChange={handleReservedUsernamesChange}
                onBlur={handleFieldBlur}
                onDiscard={handleDiscard}
                onSubmit={() => void handleSave()}
              />
            </SettingsSectionCard>

              <div className="self-start xl:sticky xl:top-6">
                <SettingsSectionCard
                  title={t("preview.section_title")}
                  description={t("preview.section_description")}
                >
                  <UsernamePreviewCard
                    username={previewUsername}
                    onUsernameChange={handlePreviewUsernameChange}
                    preview={preview}
                    availability={availability}
                    previewError={previewError}
                    availabilityError={availabilityError}
                    isTesting={isTestingUsername}
                    onTest={() => void handleTestUsername()}
                  />
                </SettingsSectionCard>
              </div>
            </div>
          </>
        )}

        <Modal
          isOpen={isConfirmingSensitiveChange}
          onClose={() => setIsConfirmingSensitiveChange(false)}
          title={t("confirmation.title")}
          size="sm"
          closeOnOverlayClick={false}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setIsConfirmingSensitiveChange(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                variant="primary"
                loading={isSaving}
                onClick={() => {
                  setIsConfirmingSensitiveChange(false);
                  void persistSettings();
                }}
              >
                {t("confirmation.confirm")}
              </Button>
            </>
          }
        >
          <p className="text-sm leading-6 text-gray-700">
            {t("confirmation.description")}
          </p>
        </Modal>
      </main>
    </SettingsAccessGuard>
  );
}
