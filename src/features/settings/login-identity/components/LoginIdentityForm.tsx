"use client";

import { RotateCcw, Save } from "lucide-react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import ReservedUsernamesInput from "@/features/settings/login-identity/components/ReservedUsernamesInput";
import type {
  LoginIdentitySettings,
  UpdateLoginIdentityRequest,
} from "@/features/settings/login-identity/types";

export interface LoginIdentityFormValues {
  loginDomain: string;
  usernameMinLength: string;
  usernameMaxLength: string;
  allowedCharacters: string;
  reservedUsernames: string[];
  status: "active" | "disabled";
}

export type LoginIdentityFormErrors = Partial<
  Record<keyof LoginIdentityFormValues, string>
>;

interface LoginIdentityFormProps {
  values: LoginIdentityFormValues;
  settings: LoginIdentitySettings | null;
  errors: LoginIdentityFormErrors;
  canManage: boolean;
  isSaving: boolean;
  isDirty: boolean;
  isValid: boolean;
  onChange: (field: keyof LoginIdentityFormValues, value: string) => void;
  onReservedUsernamesChange: (values: string[]) => void;
  onBlur: (field: keyof LoginIdentityFormValues) => void;
  onDiscard: () => void;
  onSubmit: () => void;
}

export function toLoginIdentityFormValues(
  settings: LoginIdentitySettings,
): LoginIdentityFormValues {
  return {
    loginDomain: settings.loginDomain || "",
    usernameMinLength: String(settings.usernameMinLength),
    usernameMaxLength: String(settings.usernameMaxLength),
    allowedCharacters: settings.allowedCharacters || "",
    reservedUsernames: settings.reservedUsernames,
    status: settings.status || (settings.configured ? "active" : "disabled"),
  };
}

export function toUpdateLoginIdentityRequest(
  values: LoginIdentityFormValues,
): UpdateLoginIdentityRequest {
  return {
    loginDomain: values.loginDomain.trim(),
    usernameMinLength: Number(values.usernameMinLength),
    usernameMaxLength: Number(values.usernameMaxLength),
    allowedCharacters: values.allowedCharacters.trim() || undefined,
    reservedUsernames: values.reservedUsernames,
    status: values.status,
  };
}

export function validateLoginIdentityForm(
  values: LoginIdentityFormValues,
  messages: {
    domainRequired: string;
    minInvalid: string;
    maxInvalid: string;
    maxLessThanMin: string;
  },
): LoginIdentityFormErrors {
  const errors: LoginIdentityFormErrors = {};
  const min = Number(values.usernameMinLength);
  const max = Number(values.usernameMaxLength);

  if (!values.loginDomain.trim()) {
    errors.loginDomain = messages.domainRequired;
  }
  if (!Number.isInteger(min) || min < 1) {
    errors.usernameMinLength = messages.minInvalid;
  }
  if (!Number.isInteger(max) || max < 1) {
    errors.usernameMaxLength = messages.maxInvalid;
  }
  if (!errors.usernameMinLength && !errors.usernameMaxLength && max < min) {
    errors.usernameMaxLength = messages.maxLessThanMin;
  }

  return errors;
}

export default function LoginIdentityForm({
  values,
  settings,
  errors,
  canManage,
  isSaving,
  isDirty,
  isValid,
  onChange,
  onReservedUsernamesChange,
  onBlur,
  onDiscard,
  onSubmit,
}: LoginIdentityFormProps) {
  const t = useTranslations("settings.loginIdentity");
  const statusOptions = useMemo(
    () => [
      { value: "active", label: t("status.active") },
      { value: "disabled", label: t("status.disabled") },
    ],
    [t],
  );

  if (!canManage) {
    const readOnlyItems = [
      [t("fields.login_domain"), values.loginDomain || t("summary.not_configured")],
      [t("fields.status"), t(`status.${values.status}`)],
      [t("fields.username_min"), values.usernameMinLength],
      [t("fields.username_max"), values.usernameMaxLength],
      [t("fields.allowed_characters"), values.allowedCharacters],
      [
        t("fields.reserved_usernames"),
        values.reservedUsernames.join(", ") || t("summary.not_available"),
      ],
    ];

    return (
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {readOnlyItems.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <dt className="text-xs font-medium text-gray-600">{label}</dt>
            <dd className="mt-1 break-words text-sm font-semibold text-gray-900">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
        {t("identity_rule")}
      </div>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-900">
          {t("groups.domain")}
        </legend>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Input
            label={t("fields.login_domain")}
            value={values.loginDomain}
            onChange={(event) => onChange("loginDomain", event.target.value)}
            onBlur={() => onBlur("loginDomain")}
            placeholder={t("placeholders.login_domain")}
            error={errors.loginDomain}
            helperText={
              settings?.loginDomain
                ? t("current_domain", { domain: settings.loginDomain })
                : t("empty_domain_hint")
            }
          />
          <Select
            label={t("fields.status")}
            value={values.status}
            onChange={(value) => onChange("status", value)}
            options={statusOptions}
            error={errors.status}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-gray-100 pt-5">
        <legend className="text-sm font-semibold text-gray-900">
          {t("groups.username_policy")}
        </legend>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Input
            label={t("fields.username_min")}
            type="number"
            min={1}
            value={values.usernameMinLength}
            onChange={(event) => onChange("usernameMinLength", event.target.value)}
            onBlur={() => onBlur("usernameMinLength")}
            error={errors.usernameMinLength}
          />
          <Input
            label={t("fields.username_max")}
            type="number"
            min={1}
            value={values.usernameMaxLength}
            onChange={(event) => onChange("usernameMaxLength", event.target.value)}
            onBlur={() => onBlur("usernameMaxLength")}
            error={errors.usernameMaxLength}
          />
        </div>
        <p className="text-xs text-gray-600">
          {t("helpers.username_range", {
            min: values.usernameMinLength || "–",
            max: values.usernameMaxLength || "–",
          })}
        </p>
        <Input
          label={t("fields.allowed_characters")}
          value={values.allowedCharacters}
          onChange={(event) => onChange("allowedCharacters", event.target.value)}
          onBlur={() => onBlur("allowedCharacters")}
          placeholder={t("placeholders.allowed_characters")}
          error={errors.allowedCharacters}
          helperText={t("helpers.allowed_characters")}
        />
      </fieldset>

      <fieldset className="space-y-4 border-t border-gray-100 pt-5">
        <legend className="text-sm font-semibold text-gray-900">
          {t("groups.reserved_usernames")}
        </legend>
        <ReservedUsernamesInput
          label={t("fields.reserved_usernames")}
          values={values.reservedUsernames}
          placeholder={t("placeholders.reserved_usernames")}
          helperText={t("helpers.reserved_usernames")}
          error={errors.reservedUsernames}
          onChange={onReservedUsernamesChange}
          onBlur={() => onBlur("reservedUsernames")}
        />
      </fieldset>

      <div className="sticky bottom-0 -mx-5 flex flex-wrap justify-end gap-2 border-t border-gray-200 bg-white/95 px-5 py-4 backdrop-blur">
        <Button
          type="button"
          variant="secondary"
          leftIcon={<RotateCcw className="h-4 w-4" />}
          disabled={!isDirty || isSaving}
          onClick={onDiscard}
        >
          {t("discard")}
        </Button>
        <Button
          type="submit"
          variant="primary"
          leftIcon={<Save className="h-4 w-4" />}
          loading={isSaving}
          disabled={!isDirty || !isValid || isSaving}
        >
          {isSaving ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}
