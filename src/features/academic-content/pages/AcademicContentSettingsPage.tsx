"use client";

import { Bell, FileCog, ShieldCheck } from "lucide-react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import AcademicContentSettingsCard from "../components/settings/AcademicContentSettingsCard";
import { useAcademicContentTranslations } from "../hooks/useAcademicContentTranslations";

export default function AcademicContentSettingsPage() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const t = useAcademicContentTranslations("settings_hub");
  const context = new URLSearchParams();
  for (const key of ["year", "term"]) {
    const value = searchParams.get(key);
    if (value) context.set(key, value);
  }
  const suffix = context.size ? `?${context.toString()}` : "";
  const root = `/${locale}/academic-content-hub/settings`;
  const cards = [
    { key: "file_policy", route: "file-policy", icon: FileCog },
    { key: "workflow", route: "workflow", icon: ShieldCheck },
    { key: "notifications", route: "notifications", icon: Bell },
  ] as const;

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-950">{t("title")}</h1>
        <p className="mt-2 text-sm text-gray-600">{t("description")}</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {cards.map(({ key, route, icon }) => (
          <AcademicContentSettingsCard
            key={key}
            icon={icon}
            title={t(`${key}.title`)}
            description={t(`${key}.description`)}
            actionLabel={t(`${key}.open`)}
            href={`${root}/${route}${suffix}`}
          />
        ))}
      </div>
    </main>
  );
}
