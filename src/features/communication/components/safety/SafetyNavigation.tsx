"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";

const safetySections = [
  {
    href: "/communication/safety/reports",
    label: { en: "Reports", ar: "البلاغات" },
  },
  {
    href: "/communication/safety/moderation",
    label: { en: "Moderation", ar: "الإشراف" },
  },
] as const;

export default function SafetyNavigation() {
  const locale = useLocale() as "en" | "ar";
  const pathname = usePathname();

  return (
    <nav
      aria-label={locale === "ar" ? "أقسام الأمان" : "Safety sections"}
      className="flex gap-2 overflow-x-auto"
    >
      {safetySections.map((section) => {
        const href = `/${locale}${section.href}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={section.href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              active
                ? "border-primary-600 bg-primary-600 text-white shadow-sm ring-1 ring-primary-600"
                : "border-slate-200 bg-white text-slate-700 hover:border-primary-300 hover:text-primary-700"
            }`}
          >
            {section.label[locale]}
          </Link>
        );
      })}
    </nav>
  );
}
