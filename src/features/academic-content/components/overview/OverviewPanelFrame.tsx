"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";

interface OverviewPanelFrameProps {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}

export function OverviewPanelFrame({
  title,
  description,
  icon,
  children,
}: OverviewPanelFrameProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
        <span className="mt-0.5 text-primary">{icon}</span>
        <div>
          <h2 className="font-semibold text-gray-950">{title}</h2>
          <p className="mt-0.5 text-xs leading-5 text-gray-500">{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

interface OverviewPanelStateProps {
  isLoading: boolean;
  hasData: boolean;
  hasError: boolean;
  emptyTitle: string;
  emptyDescription: string;
  unavailableTitle: string;
  onRetry: () => void;
  children: ReactNode;
}

export function OverviewPanelState({
  isLoading,
  hasData,
  hasError,
  emptyTitle,
  emptyDescription,
  unavailableTitle,
  onRetry,
  children,
}: OverviewPanelStateProps) {
  const t = useAcademicContentTranslations("overview");
  if (isLoading && !hasData) {
    return (
      <div role="status" className="space-y-3 p-5">
        <span className="sr-only">{t("loading")}</span>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  if (hasError && !hasData) {
    return (
      <EmptyState
        icon={<AlertTriangle aria-hidden="true" className="size-8" />}
        title={unavailableTitle}
        message={emptyDescription}
        action={<Button size="sm" onClick={onRetry}>{t("retry")}</Button>}
      />
    );
  }
  if (!hasData) {
    return <EmptyState title={emptyTitle} message={emptyDescription} />;
  }
  return <div aria-busy={isLoading}>{children}</div>;
}
