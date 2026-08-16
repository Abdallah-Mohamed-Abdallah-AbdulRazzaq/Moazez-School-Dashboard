"use client";

import { useLocale } from "next-intl";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  message,
  action,
  className = "",
}: EmptyStateProps) {
  const locale = useLocale();
  const isRTL = locale === "ar";

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {icon && (
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
      )}
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        {message}
      </p>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}
