"use client";

import { CalendarClock, CheckCircle2, Globe2, ShieldCheck, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { LoginIdentitySettings } from "@/features/settings/login-identity/types";

interface LoginIdentitySummaryProps {
  settings: LoginIdentitySettings;
}

export default function LoginIdentitySummary({
  settings,
}: LoginIdentitySummaryProps) {
  const t = useTranslations("settings.loginIdentity.summary");
  const locale = useLocale();
  const isActive = settings.status === "active";
  const updatedAt = settings.updatedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        new Date(settings.updatedAt),
      )
    : t("not_available");

  const items = [
    {
      label: t("status"),
      value: isActive ? t("active") : t("disabled"),
      icon: isActive ? CheckCircle2 : XCircle,
      valueClassName: isActive ? "text-emerald-700" : "text-gray-700",
    },
    {
      label: t("domain"),
      value: settings.loginDomain || t("not_configured"),
      icon: Globe2,
      valueClassName: "text-gray-900",
    },
    {
      label: t("username_length"),
      value: `${settings.usernameMinLength}–${settings.usernameMaxLength}`,
      icon: ShieldCheck,
      valueClassName: "text-gray-900",
    },
    {
      label: t("reserved_count"),
      value: String(settings.reservedUsernames.length),
      icon: ShieldCheck,
      valueClassName: "text-gray-900",
    },
    {
      label: t("updated_at"),
      value: updatedAt,
      icon: CalendarClock,
      valueClassName: "text-gray-900",
    },
  ];

  return (
    <section
      aria-label={t("aria_label")}
      className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-5"
    >
      {items.map(({ label, value, icon: Icon, valueClassName }) => (
        <div key={label} className="flex min-w-0 items-start gap-3 rounded-xl bg-gray-50 p-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-600">{label}</p>
            <p className={`mt-1 truncate text-sm font-semibold ${valueClassName}`}>
              {value}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
