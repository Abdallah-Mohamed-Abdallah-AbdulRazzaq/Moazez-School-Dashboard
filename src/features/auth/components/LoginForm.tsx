"use client";

import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type {
  LoginFormErrors,
  LoginFormValues,
  ValidationMessages,
} from "../utils/authValidation";
import {
  validateLoginField,
  validateLoginValues,
} from "../utils/authValidation";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getDefaultAuthorizedNavigationPath } from "@/hooks/usePermissions";
import { isApiError } from "@/lib/api-error";
import { getValidationFieldErrors } from "@/lib/validation-errors";
import {
  localeFromPathname,
  safeAuthReturnPath,
} from "@/features/auth/utils/authRedirect";

const INITIAL_VALUES: LoginFormValues = {
  email: "",
  password: "",
  rememberMe: false,
};

interface LoginFormProps {
  currentYear: number;
}

export function LoginForm({ currentYear }: LoginFormProps) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const t = useTranslations("auth.login");
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const validationMessages: ValidationMessages = {
    emailRequired: t("errors.emailRequired"),
    emailInvalid: t("errors.emailInvalid"),
    passwordRequired: t("errors.passwordRequired"),
    passwordMinLength: t("errors.passwordMinLength"),
  };

  function handleFieldChange(
    field: keyof LoginFormValues,
    value: string | boolean,
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));

    if (field === "email" || field === "password") {
      setErrors((currentErrors) => {
        if (!currentErrors[field]) {
          return currentErrors;
        }

        return {
          ...currentErrors,
          [field]: validateLoginField(
            field,
            typeof value === "string" ? value : "",
            validationMessages,
          ),
        };
      });
    }

    setSubmitError(null);
  }

  function handleFieldBlur(field: "email" | "password") {
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: validateLoginField(field, values[field], validationMessages),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateLoginValues(values, validationMessages);
    setErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const currentUser = await login({
        email: values.email,
        password: values.password,
      });

      const currentLocale = localeFromPathname(pathname);
      const dashboardPath = getDefaultAuthorizedNavigationPath(
        currentUser?.activeMembership?.permissions ?? [],
        currentLocale,
      );
      const returnPath = safeAuthReturnPath(
        searchParams.get("next") ?? searchParams.get("redirect"),
        currentLocale,
      );

      router.push(
        currentUser?.mustChangePassword
          ? `/${currentLocale}/change-password`
          : returnPath ?? dashboardPath,
      );
    } catch (error) {
      if (isApiError(error)) {
        if (error.status === 401) {
          setSubmitError("Invalid email or password");
        } else if (error.code === "validation.failed") {
          const fieldErrors = getValidationFieldErrors(error);
          setErrors((current) => ({
            ...current,
            email: fieldErrors.email || current.email,
            password: fieldErrors.password || current.password,
          }));
          setSubmitError(t("submitError"));
        } else {
          setSubmitError(error.message || t("submitError"));
        }
      } else {
        setSubmitError(t("submitError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

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
        <h1 className="text-[2rem] font-bold tracking-[-0.03em] text-[var(--foreground)]">
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

        <div className="space-y-2">
          <label
            htmlFor="login-email"
            className={`block text-sm font-semibold text-[color-mix(in_oklab,var(--foreground)_84%,white)] ${
              isRTL ? "text-right" : "text-left"
            }`}
          >
            {t("emailLabel")}
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            value={values.email}
            onChange={(event) => handleFieldChange("email", event.target.value)}
            onBlur={() => handleFieldBlur("email")}
            placeholder={t("emailPlaceholder")}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            className={`w-full rounded-full border bg-[var(--background)] px-5 py-3.5 text-sm text-[var(--foreground)] shadow-[0_4px_12px_rgba(0,0,0,0.03)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[color-mix(in_oklab,var(--foreground)_40%,white)] focus:border-[var(--primary-color)] focus:ring-4 focus:ring-[color-mix(in_oklab,var(--primary-color)_14%,white)] disabled:cursor-not-allowed disabled:bg-[color-mix(in_oklab,var(--background)_96%,black)] ${
              isRTL ? "text-right" : "text-left"
            }`}
            style={{
              borderColor: errors.email
                ? "var(--accent-color)"
                : "color-mix(in oklab, var(--border-color) 78%, white)",
              boxShadow: errors.email
                ? "0 0 0 4px color-mix(in oklab, var(--accent-color) 12%, transparent)"
                : undefined,
            }}
          />
          {errors.email ? (
            <p
              id="login-email-error"
              className="text-sm text-[color-mix(in_oklab,var(--accent-color)_78%,black)]"
            >
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="login-password"
            className={`block text-sm font-semibold text-[color-mix(in_oklab,var(--foreground)_84%,white)] ${
              isRTL ? "text-right" : "text-left"
            }`}
          >
            {t("passwordLabel")}
          </label>
          <div className="relative">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={values.password}
              onChange={(event) =>
                handleFieldChange("password", event.target.value)
              }
              onBlur={() => handleFieldBlur("password")}
              placeholder={t("passwordPlaceholder")}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? "login-password-error" : undefined
              }
              className={`w-full rounded-full border bg-[var(--background)] py-3.5 text-sm text-[var(--foreground)] shadow-[0_4px_12px_rgba(0,0,0,0.03)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[color-mix(in_oklab,var(--foreground)_40%,white)] focus:border-[var(--primary-color)] focus:ring-4 focus:ring-[color-mix(in_oklab,var(--primary-color)_14%,white)] disabled:cursor-not-allowed disabled:bg-[color-mix(in_oklab,var(--background)_96%,black)] ${
                isRTL ? "ps-12 pe-5 text-right" : "pe-12 ps-5 text-left"
              }`}
              style={{
                borderColor: errors.password
                  ? "var(--accent-color)"
                  : "color-mix(in oklab, var(--border-color) 78%, white)",
                boxShadow: errors.password
                  ? "0 0 0 4px color-mix(in oklab, var(--accent-color) 12%, transparent)"
                  : undefined,
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((currentValue) => !currentValue)}
              className={`absolute inset-y-1 flex w-12 items-center justify-center rounded-full text-[color-mix(in_oklab,var(--foreground)_58%,white)] transition hover:text-[var(--primary-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] focus-visible:ring-inset ${
                isRTL ? "start-1" : "end-1"
              }`}
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              disabled={isSubmitting}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.password ? (
            <p
              id="login-password-error"
              className="text-sm text-[color-mix(in_oklab,var(--accent-color)_78%,black)]"
            >
              {errors.password}
            </p>
          ) : null}
        </div>

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
