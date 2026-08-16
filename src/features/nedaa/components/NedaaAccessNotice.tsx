"use client";

import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

export default function NedaaAccessNotice() {
  const t = useTranslations("nedaa.access");

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 p-2 text-amber-700">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-amber-900">
            {t("denied_title")}
          </h1>
          <p className="mt-1 text-sm text-amber-800">
            {t("denied_description")}
          </p>
        </div>
      </div>
    </div>
  );
}