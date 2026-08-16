"use client";

import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast/Toast";
import { isApiError } from "@/lib/api-error";
import { getValidationFieldErrors } from "@/lib/validation-errors";
import { getPasswordPolicyApiFailures } from "@/utils/validation/passwordPolicy";

interface ChangePasswordFormProps {
  currentYear: number;
}

interface ChangePasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type ChangePasswordField = keyof ChangePasswordValues;
type ChangePasswordErrors = Partial<Record<ChangePasswordField, string>>;

const INITIAL_VALUES: ChangePasswordValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function ChangePasswordForm({ currentYear }: ChangePasswordFormProps) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const t = useTranslations("auth.changePassword");
  const tLogin = useTranslations("auth.login");
  const tPasswordPolicy = useTranslations("password_policy");
  const router = useRouter();
  const { changePassword, refreshCurrentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [values, setValues] = useState<ChangePasswordValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<ChangePasswordErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleFields, setVisibleFields] = useState<
    Record<ChangePasswordField, boolean>
  >({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const validateValues = (
    nextValues: ChangePasswordValues,
  ): ChangePasswordErrors => {
    const nextErrors: ChangePasswordErrors = {};

    if (!nextValues.currentPassword.trim()) {
      nextErrors.currentPassword = t("errors.currentRequired");
    }
    if (!nextValues.newPassword.trim()) {
      nextErrors.newPassword = t("errors.newRequired");
    } else if (nextValues.newPassword === nextValues.currentPassword) {
      nextErrors.newPassword = t("errors.newDifferent");
    }
    if (!nextValues.confirmPassword.trim()) {
      nextErrors.confirmPassword = t("errors.confirmRequired");
    } else if (nextValues.confirmPassword !== nextValues.newPassword) {
      nextErrors.confirmPassword = t("errors.confirmMismatch");
    }

    return nextErrors;
  };

  const setFieldValue = (field: ChangePasswordField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  };

  const toggleVisibleField = (field: ChangePasswordField) => {
    setVisibleFields((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const handleBlur = (field: ChangePasswordField) => {
    const nextErrors = validateValues(values);
    setErrors((current) => ({
      ...current,
      [field]: nextErrors[field],
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateValues(values);
    setErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setValues(INITIAL_VALUES);
      setVisibleFields({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
      });
      setErrors({});
      showSuccess(t("messages.success"));
      await refreshCurrentUser();
      router.push(`/${locale}/dashboard`);
    } catch (error) {
      const policyFailures = getPasswordPolicyApiFailures(error);
      if (policyFailures.length > 0) {
        const policyMessage = policyFailures
          .map((reason) => tPasswordPolicy(reason))
          .join(" ");
        setErrors((current) => ({ ...current, newPassword: policyMessage }));
        setSubmitError(policyMessage);
      } else if (isApiError(error) && error.isValidationError()) {
        const fieldErrors = getValidationFieldErrors(error);
        setErrors({
          currentPassword: fieldErrors.currentPassword,
          newPassword: fieldErrors.newPassword,
          confirmPassword: fieldErrors.confirmPassword,
        });
        setSubmitError(error.message || t("messages.validationFailed"));
      } else if (isApiError(error)) {
        setSubmitError(error.message || t("messages.failed"));
      } else {
        setSubmitError(t("messages.failed"));
      }
      showError(t("messages.failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPasswordField = (
    field: ChangePasswordField,
    label: string,
    placeholder: string,
    autoComplete: string,
  ) => {
    const isVisible = visibleFields[field];
    const error = errors[field];
    const inputId = `change-password-${field}`;
    const errorId = `${inputId}-error`;

    return (
      <div className="space-y-2">
        <label
          htmlFor={inputId}
          className={`block text-sm font-semibold text-[color-mix(in_oklab,var(--foreground)_84%,white)] ${
            isRTL ? "text-right" : "text-left"
          }`}
        >
          {label}
        </label>
        <div className="relative">
          <input
            id={inputId}
            name={field}
            type={isVisible ? "text" : "password"}
            autoComplete={autoComplete}
            value={values[field]}
            onChange={(event) => setFieldValue(field, event.target.value)}
            onBlur={() => handleBlur(field)}
            placeholder={placeholder}
            disabled={isSubmitting}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={`w-full rounded-full border bg-[var(--background)] py-3.5 text-sm text-[var(--foreground)] shadow-[0_4px_12px_rgba(0,0,0,0.03)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[color-mix(in_oklab,var(--foreground)_40%,white)] focus:border-[var(--primary-color)] focus:ring-4 focus:ring-[color-mix(in_oklab,var(--primary-color)_14%,white)] disabled:cursor-not-allowed disabled:bg-[color-mix(in_oklab,var(--background)_96%,black)] ${
              isRTL ? "ps-12 pe-5 text-right" : "pe-12 ps-5 text-left"
            }`}
            style={{
              borderColor: error
                ? "var(--accent-color)"
                : "color-mix(in oklab, var(--border-color) 78%, white)",
              boxShadow: error
                ? "0 0 0 4px color-mix(in oklab, var(--accent-color) 12%, transparent)"
                : undefined,
            }}
          />
          <button
            type="button"
            onClick={() => toggleVisibleField(field)}
            className={`absolute inset-y-1 flex w-12 items-center justify-center rounded-full text-[color-mix(in_oklab,var(--foreground)_58%,white)] transition hover:text-[var(--primary-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] focus-visible:ring-inset ${
              isRTL ? "start-1" : "end-1"
            }`}
            aria-label={
              isVisible ? tLogin("hidePassword") : tLogin("showPassword")
            }
            disabled={isSubmitting}
            aria-pressed={isVisible}
          >
            {isVisible ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {error ? (
          <p
            id={errorId}
            className="text-sm text-[color-mix(in_oklab,var(--accent-color)_78%,black)]"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-7" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <Image
          src="/images/logo/moazzez_logo.svg"
          alt="Logo"
          width={128}
          height={128}
          className="mx-auto mb-10"
        />
      </div>

      <header className={`space-y-5 ${isRTL ? "text-right" : "text-left"}`}>
        <h1 className="text-[2rem] font-bold text-[var(--foreground)]">
          {t("title")}
        </h1>
        <p className="max-w-sm text-sm leading-6 text-[color-mix(in_oklab,var(--foreground)_66%,white)]">
          {t("subtitle")}
        </p>
      </header>

      <form
        className="space-y-5"
        onSubmit={handleSubmit}
        noValidate
        aria-busy={isSubmitting}
      >
        {submitError ? (
          <div
            className="rounded-[1.1rem] border border-[color-mix(in_oklab,var(--accent-color)_35%,var(--border-color))] bg-[color-mix(in_oklab,var(--accent-color)_10%,white)] px-4 py-3 text-sm text-[color-mix(in_oklab,var(--accent-color)_78%,black)]"
            role="alert"
            aria-live="assertive"
          >
            {submitError}
          </div>
        ) : null}

        {renderPasswordField(
          "currentPassword",
          t("currentPasswordLabel"),
          t("currentPasswordPlaceholder"),
          "current-password",
        )}
        {renderPasswordField(
          "newPassword",
          t("newPasswordLabel"),
          t("newPasswordPlaceholder"),
          "new-password",
        )}
        {renderPasswordField(
          "confirmPassword",
          t("confirmPasswordLabel"),
          t("confirmPasswordPlaceholder"),
          "new-password",
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full px-4 py-3 text-sm font-semibold text-[var(--background)] transition-[background-color,box-shadow] duration-200 hover:bg-[var(--hover-color)] hover:shadow-[0_16px_28px_color-mix(in_oklab,var(--primary-color)_22%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-70"
          style={{
            backgroundColor: "var(--primary-color)",
            boxShadow:
              "0 12px 24px color-mix(in oklab, var(--primary-color) 18%, transparent)",
          }}
        >
          {isSubmitting ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
              <span>{t("submitting")}</span>
            </>
          ) : (
            <span>{t("submit")}</span>
          )}
        </button>

        <div className="pt-2 text-center text-[11px] text-[color-mix(in_oklab,var(--foreground)_40%,white)]">
          {`All rights reserved to Moazez ${currentYear} ©`}
        </div>
      </form>
    </div>
  );
}
