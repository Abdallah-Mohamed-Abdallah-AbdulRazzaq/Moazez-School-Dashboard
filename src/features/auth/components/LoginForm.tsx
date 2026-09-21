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
import { Button, Input } from "@/components/ui";

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
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="space-y-4">
        <Image
          src="/images/national-day/moazez-national-day-logo.png"
          alt={t("brand.badge")}
          width={1254}
          height={1254}
          className="mx-auto h-28 w-28 rounded-[1.4rem] object-cover shadow-[0_14px_30px_rgba(4,43,40,0.18)] lg:hidden"
        />

        <div className="hidden items-center gap-3 lg:flex">
          <Image
            src="/images/national-day/moazez-national-day-logo.png"
            alt={t("brand.badge")}
            width={1254}
            height={1254}
            className="h-[4.625rem] w-[4.625rem] rounded-2xl object-cover shadow-[0_10px_22px_rgba(4,43,40,0.14)]"
          />
          <div className="h-9 w-px bg-[#d8e4dc]" aria-hidden="true" />
          <p className="max-w-[12rem] text-xs font-semibold leading-5 text-[#08714d]">
            {t("nationalDay.formBadge")}
          </p>
        </div>
      </div>

      <header className={`space-y-2.5 ${isRTL ? "text-right" : "text-left"}`}>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#07804f]">
          {t("nationalDay.welcome")}
        </p>
        <h1 className="text-[2rem] font-bold tracking-[-0.035em] text-[#102d28]">
          {t("title")}
        </h1>
        <p className="max-w-sm text-sm leading-6 text-[#667872]">
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

        <Input
          id="login-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          label={t("emailLabel")}
          value={values.email}
          onChange={(event) => handleFieldChange("email", event.target.value)}
          onBlur={() => handleFieldBlur("email")}
          placeholder={t("emailPlaceholder")}
          disabled={isSubmitting}
          error={errors.email}
          inputSize="lg"
          className="rounded-2xl border-[#dce7e0] bg-[#fbfcfb] text-[#102d28] shadow-[0_5px_16px_rgba(5,55,44,0.04)] focus:border-[#008c57] focus:ring-[#d5f2e2]"
        />

        <Input
          id="login-password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          label={t("passwordLabel")}
          value={values.password}
          onChange={(event) =>
            handleFieldChange("password", event.target.value)
          }
          onBlur={() => handleFieldBlur("password")}
          placeholder={t("passwordPlaceholder")}
          disabled={isSubmitting}
          error={errors.password}
          inputSize="lg"
          className="rounded-2xl border-[#dce7e0] bg-[#fbfcfb] text-[#102d28] shadow-[0_5px_16px_rgba(5,55,44,0.04)] focus:border-[#008c57] focus:ring-[#d5f2e2]"
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((currentValue) => !currentValue)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#61756e] transition hover:bg-[#e7f5ed] hover:text-[#007f4e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008c57]"
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
          }
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          loading={isSubmitting}
          fullWidth
          size="lg"
          className="min-h-12 rounded-2xl bg-gradient-to-r from-[#008b55] to-[#006d46] font-bold shadow-[0_14px_28px_rgba(0,123,75,0.22)] hover:from-[#007a4b] hover:to-[#07543f] hover:shadow-[0_18px_32px_rgba(0,123,75,0.28)] focus-visible:ring-2 focus-visible:ring-[#008c57] focus-visible:ring-offset-2"
        >
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>

        <div className="pt-1 text-center text-[11px] text-[#8a9994]">
          {`All rights reserved to Moazez ${currentYear} ©`}
        </div>
      </form>
    </div>
  );
}
