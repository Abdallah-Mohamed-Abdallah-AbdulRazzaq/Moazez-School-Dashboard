"use client";

import { CheckCircle2, Search, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import type {
  UsernameAvailabilityResponse,
  UsernamePreviewResponse,
} from "@/features/settings/login-identity/types";

interface UsernamePreviewCardProps {
  username: string;
  onUsernameChange: (value: string) => void;
  preview: UsernamePreviewResponse | null;
  availability: UsernameAvailabilityResponse | null;
  previewError: string | null;
  availabilityError: string | null;
  isTesting: boolean;
  onTest: () => void;
}

const KNOWN_REASONS = new Set([
  "username_invalid",
  "login_domain_missing",
  "login_email_taken",
  "reserved_username",
]);

export default function UsernamePreviewCard({
  username,
  onUsernameChange,
  preview,
  availability,
  previewError,
  availabilityError,
  isTesting,
  onTest,
}: UsernamePreviewCardProps) {
  const t = useTranslations("settings.loginIdentity.preview");
  const generatedLoginEmail = preview?.loginEmail || availability?.loginEmail;
  const availabilityReason = availability?.reason
    ? KNOWN_REASONS.has(availability.reason)
      ? t(`reasons.${availability.reason}`)
      : t("reasons.unknown", {
          reason: availability.reason.replaceAll("_", " "),
        })
    : null;

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{t("title")}</h3>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          {t("description")}
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label={t("username_label")}
          value={username}
          onChange={(event) => onUsernameChange(event.target.value)}
          placeholder={t("username_placeholder")}
        />

        <Button
          variant="secondary"
          leftIcon={<Search className="h-4 w-4" />}
          loading={isTesting}
          disabled={!username.trim() || isTesting}
          onClick={onTest}
        >
          {isTesting ? t("testing") : t("test_button")}
        </Button>

        <div aria-live="polite" className="space-y-3">
          {generatedLoginEmail ? (
            <div className="rounded-lg border border-emerald-100 bg-white p-3">
              <p className="text-xs font-semibold uppercase text-gray-600">
                {t("generated_email_label")}
              </p>
              <p className="mt-1 break-all text-sm font-semibold text-gray-900">
                {generatedLoginEmail}
              </p>
              <p className="mt-2 text-xs leading-5 text-gray-600">
                {t("login_identity_note")}
              </p>
            </div>
          ) : null}

          {availability ? (
            <div
              className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                availability.available
                  ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                  : "border-red-100 bg-red-50 text-red-700"
              }`}
            >
              {availability.available ? (
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <XCircle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
              )}
              <span>
                {availability.available
                  ? t("available")
                  : availabilityReason || t("unavailable")}
              </span>
            </div>
          ) : null}
        </div>

        {previewError ? (
          <div
            role="alert"
            className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700"
          >
            {previewError}
          </div>
        ) : null}
        {availabilityError ? (
          <div
            role="alert"
            className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700"
          >
            {availabilityError}
          </div>
        ) : null}
      </div>
    </div>
  );
}
