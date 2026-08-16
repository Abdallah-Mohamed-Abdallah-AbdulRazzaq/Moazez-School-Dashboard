"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { reinforcementTabs } from "../../config/reinforcementTabs";

interface ReinforcementPageHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export default function ReinforcementPageHeader({
  title,
  description,
  actions,
}: ReinforcementPageHeaderProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {reinforcementTabs.map((tab) => {
          const href = `/${locale}${tab.href}`;
          const isActive = pathname === href;

          return (
            <Link
              key={tab.key}
              href={href}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-white"
                  : "bg-white text-gray-600 shadow-sm hover:text-primary"
              }`}
            >
              {t(`nav.${tab.key}`)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
