"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import { isApiError } from "@/lib/api-error";
import type { CredentialMode } from "../api/credentialBatchDtos";
import { getCredentialPasswordReasonCode } from "../model/credentialBatchModel";

export interface CredentialModeSubmission {
  credentialMode: CredentialMode;
  sharedPassword?: string;
}

interface CredentialModeFormProps {
  enabled: boolean;
  onSubmit: (submission: CredentialModeSubmission) => Promise<void>;
  onCancel?: () => void;
}

const copy = {
  en: {
    mode: "Credential mode",
    unique: "Unique generated",
    sharedTemporary: "Shared temporary",
    sharedAdmin: "Administrator-provided shared",
    password: "Password",
    confirmation: "Confirm password",
    create: "Create credentials",
    cancel: "Cancel",
    mismatch: "Passwords must match.",
    genericError: "Credentials could not be created.",
    unknownPolicy: "The password was rejected.",
    guidance: {
      length: "At least 12 characters",
      uppercase: "One uppercase letter",
      lowercase: "One lowercase letter",
      number: "One number",
      symbol: "One symbol",
    },
    reasons: {
      password_required: "A password is required.",
      password_too_short: "The password is too short.",
      password_missing_uppercase: "Add an uppercase letter.",
      password_missing_lowercase: "Add a lowercase letter.",
      password_missing_number: "Add a number.",
      password_missing_symbol: "Add a symbol.",
      password_common: "This password is too common.",
    },
  },
  ar: {
    mode: "نوع بيانات الدخول",
    unique: "كلمة فريدة مولدة",
    sharedTemporary: "كلمة مؤقتة مشتركة",
    sharedAdmin: "كلمة مشتركة يحددها المسؤول",
    password: "كلمة المرور",
    confirmation: "تأكيد كلمة المرور",
    create: "إنشاء بيانات الدخول",
    cancel: "إلغاء",
    mismatch: "يجب أن تتطابق كلمتا المرور.",
    genericError: "تعذر إنشاء بيانات الدخول.",
    unknownPolicy: "تم رفض كلمة المرور.",
    guidance: {
      length: "12 حرفًا على الأقل",
      uppercase: "حرف إنجليزي كبير",
      lowercase: "حرف إنجليزي صغير",
      number: "رقم واحد",
      symbol: "رمز واحد",
    },
    reasons: {
      password_required: "كلمة المرور مطلوبة.",
      password_too_short: "كلمة المرور قصيرة جدًا.",
      password_missing_uppercase: "أضف حرفًا إنجليزيًا كبيرًا.",
      password_missing_lowercase: "أضف حرفًا إنجليزيًا صغيرًا.",
      password_missing_number: "أضف رقمًا.",
      password_missing_symbol: "أضف رمزًا.",
      password_common: "كلمة المرور شائعة جدًا.",
    },
  },
} as const;

type KnownPasswordReason = keyof (typeof copy)["en"]["reasons"];

function passwordPolicy(password: string) {
  return {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
}

function getBackendPasswordReasons(error: unknown): string[] | null {
  if (!isApiError(error) || error.code !== "iam.credentials.password_policy_failed") {
    return null;
  }
  if (!error.details || typeof error.details !== "object") return [];
  const reasons = (error.details as { reasons?: unknown }).reasons;
  return Array.isArray(reasons)
    ? reasons.filter((reason): reason is string => typeof reason === "string")
    : [];
}

export default function CredentialModeForm({
  enabled,
  onSubmit,
  onCancel,
}: CredentialModeFormProps) {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const text = copy[locale];
  const [credentialMode, setCredentialMode] =
    useState<CredentialMode>("unique_generated");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submissionErrors, setSubmissionErrors] = useState<string[]>([]);
  const passwordRef = useRef("");
  const confirmationRef = useRef("");
  const policy = passwordPolicy(password);
  const usesAdminPassword = credentialMode === "shared_admin_provided";
  const passwordValid = Object.values(policy).every(Boolean);
  const confirmationMatches = password === confirmation;
  const canSubmit =
    enabled &&
    !submitting &&
    (!usesAdminPassword || (passwordValid && confirmationMatches));

  useEffect(
    () => () => {
      passwordRef.current = "";
      confirmationRef.current = "";
    },
    [],
  );

  const clearSecrets = () => {
    passwordRef.current = "";
    confirmationRef.current = "";
    setPassword("");
    setConfirmation("");
    setSubmissionErrors([]);
  };

  const changeMode = (mode: string) => {
    clearSecrets();
    setCredentialMode(mode as CredentialMode);
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmissionErrors([]);
    try {
      await onSubmit({
        credentialMode,
        ...(usesAdminPassword ? { sharedPassword: passwordRef.current } : {}),
      });
      clearSecrets();
    } catch (error) {
      const policyReasons = getBackendPasswordReasons(error);
      setSubmissionErrors(policyReasons ?? ["submission_failed"]);
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = () => {
    clearSecrets();
    onCancel?.();
  };

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <Select
        label={text.mode}
        required
        value={credentialMode}
        disabled={!enabled || submitting}
        options={[
          { value: "unique_generated", label: text.unique },
          { value: "shared_temporary", label: text.sharedTemporary },
          { value: "shared_admin_provided", label: text.sharedAdmin },
        ]}
        onChange={changeMode}
      />

      {usesAdminPassword && (
        <>
          <Input
            label={text.password}
            type="password"
            autoComplete="new-password"
            value={password}
            disabled={!enabled || submitting}
            onChange={(event) => {
              passwordRef.current = event.target.value;
              setPassword(event.target.value);
              setSubmissionErrors([]);
            }}
          />
          <Input
            label={text.confirmation}
            type="password"
            autoComplete="new-password"
            value={confirmation}
            disabled={!enabled || submitting}
            onChange={(event) => {
              confirmationRef.current = event.target.value;
              setConfirmation(event.target.value);
            }}
          />

          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {Object.entries(text.guidance).map(([rule, label]) => (
              <li
                key={rule}
                data-valid={policy[rule as keyof typeof policy]}
                className={
                  policy[rule as keyof typeof policy]
                    ? "text-emerald-700"
                    : "text-gray-600"
                }
              >
                {label}
              </li>
            ))}
          </ul>
          {confirmation.length > 0 && !confirmationMatches && (
            <p className="text-sm text-red-600">{text.mismatch}</p>
          )}
        </>
      )}

      {submissionErrors.length > 0 && (
        <ul className="space-y-1 text-sm text-red-600">
          {submissionErrors.map((reason, index) => {
            if (reason === "submission_failed") {
              return <li key={reason}>{text.genericError}</li>;
            }
            const safeReason = getCredentialPasswordReasonCode(reason);
            return (
              <li key={`${reason}-${index}`}>
                {safeReason === "unknown"
                  ? text.unknownPolicy
                  : text.reasons[safeReason as KnownPasswordReason]}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            disabled={submitting}
            onClick={cancel}
          >
            {text.cancel}
          </Button>
        )}
        <Button
          type="button"
          loading={submitting}
          disabled={!canSubmit}
          onClick={submit}
        >
          {text.create}
        </Button>
      </div>
    </section>
  );
}
