"use client";

import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

interface AccessDeniedProps {
  className?: string;
  description?: string;
  requiredPermissions?: readonly string[];
  title?: string;
}

export function AccessDenied({
  className = "",
  description,
  requiredPermissions,
  title,
}: AccessDeniedProps) {
  const t = useTranslations("common.accessDenied");
  const defaultWidth = className.includes("max-w-") ? "" : "max-w-2xl";

  return (
    <div
      className="flex min-h-[calc(100dvh-10rem)] w-full items-center justify-center px-4 py-8 sm:px-6"
    >
      <div
        role="alert"
        className={[
          "relative w-full overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50 px-5 py-5 shadow-[0_12px_32px_-18px_rgba(180,83,9,0.45)] sm:px-6",
          defaultWidth,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-amber-100/80 to-transparent"
        />
        <div className="relative flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/25 ring-4 ring-amber-100">
            <ShieldAlert aria-hidden="true" className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
              {t("eyebrow")}
            </p>
            <h2 className="mt-1 text-lg font-bold text-amber-950">
              {title ?? t("title")}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-amber-900">
              {description ?? t("description")}
            </p>
            {requiredPermissions && requiredPermissions.length > 0 && (
              <div className="mt-4 rounded-2xl border border-amber-200/80 bg-white/80 p-3.5 shadow-sm">
                <p className="text-sm font-semibold text-amber-950">
                  {t("requiredPermissions")}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {requiredPermissions.map((permission) => (
                    <li
                      key={permission}
                      className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-950"
                    >
                      <code className="break-all">{permission}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-4 border-t border-amber-200/80 pt-3 text-sm leading-6 text-amber-800">
              {t("guidance")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccessDenied;
