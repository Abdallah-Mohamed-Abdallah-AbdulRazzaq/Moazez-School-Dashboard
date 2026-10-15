"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle,
  Circle,
  Columns3,
  LayoutGrid,
  LockKeyhole,
} from "lucide-react";
import { Button } from "@/components/ui";

export type TimetableDensity = "comfortable" | "compact";
export interface TimetableToolbarAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  hint?: string;
  tone?: "default" | "danger";
}

interface TimetableWorkspaceToolbarProps {
  context: {
    selection: string;
    academicYear: string;
    term: string;
    configuration: string;
    scope: string;
    status: "published" | "draft" | "unconfigured";
    inherited: boolean;
    readOnly: boolean;
    dirty: boolean;
  };
  actions: {
    save?: TimetableToolbarAction;
    validate: TimetableToolbarAction;
    generate?: TimetableToolbarAction;
    publication?: TimetableToolbarAction;
    settings: (TimetableToolbarAction & { value: string })[];
    more: (TimetableToolbarAction & { value: string })[];
  };
  density: TimetableDensity;
  onDensityChange: (density: TimetableDensity) => void;
}

export default function TimetableWorkspaceToolbar({
  context,
  actions,
  density,
  onDensityChange,
}: TimetableWorkspaceToolbarProps) {
  const t = useTranslations("academics.timetable.workspace");
  return (
    <section
      aria-label={t("workspaceControls")}
      className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 print:hidden lg:px-6"
    >
      <div className="flex min-w-0 flex-col items-start justify-between gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
        <div className="min-w-0 w-full flex-1 sm:w-auto">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="min-w-0 break-words text-base font-semibold text-gray-950">
              {context.selection}
            </h2>
            <span className="text-xs text-gray-600">
              {[context.academicYear, context.term].filter(Boolean).join(" · ")}
            </span>
          </div>
          <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-relaxed">
            <div className="flex min-w-0 flex-wrap gap-x-1">
              <dt className="text-gray-600">{t("configuration")}:</dt>
              <dd className="break-words font-medium text-gray-900">
                {context.configuration}
              </dd>
            </div>
            <div className="flex min-w-0 flex-wrap gap-x-1">
              <dt className="text-gray-600">{t("scope")}:</dt>
              <dd className="break-words font-medium text-primary-800">
                {context.scope}
              </dd>
            </div>
          </dl>
        </div>
        <div
          className="flex flex-wrap items-center gap-2 text-xs"
          aria-live="polite"
        >
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ${context.status === "published" ? "bg-emerald-50 text-emerald-800" : "bg-gray-100 text-gray-700"}`}
          >
            {context.status === "published" ? (
              <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Circle className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {t(context.status)}
          </span>
          {context.inherited && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-900">
              {t("inherited")}
            </span>
          )}
          {context.readOnly && context.status !== "unconfigured" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">
              <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
              {t("readOnly")}
            </span>
          )}
          {context.dirty && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-900">
              {t("unsaved")}
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full gap-2 overflow-x-auto pb-1 lg:w-auto lg:flex-wrap lg:overflow-visible lg:pb-0">
          {actions.save && <ToolbarAction action={actions.save} primary />}
          <ToolbarAction action={actions.validate} />
          {actions.generate && <ToolbarAction action={actions.generate} />}
          {actions.publication && (
            <ToolbarAction action={actions.publication} />
          )}
          {actions.settings.map((action) => (
            <ToolbarAction
              key={action.value}
              action={action}
            />
          ))}
          {actions.more.map((action) => (
            <ToolbarAction key={action.value} action={action} />
          ))}
        </div>
        <div className="hidden flex-wrap items-center gap-2 lg:flex lg:w-auto lg:justify-end">
          <div
            className="hidden items-center gap-1 rounded-lg border border-gray-200 p-0.5 lg:flex"
            role="group"
            aria-label={t("density")}
          >
            {(["comfortable", "compact"] as const).map((option) => (
              <Button
                key={option}
                variant={density === option ? "secondary" : "ghost"}
                size="sm"
                className={`min-h-10 focus-visible:ring-2 focus-visible:ring-primary ${density === option ? "border-primary-200 bg-primary-50 text-primary-800" : "border-transparent"}`}
                aria-pressed={density === option}
                onClick={() => onDensityChange(option)}
                leftIcon={
                  option === "comfortable" ? (
                    <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Columns3 className="h-4 w-4" aria-hidden="true" />
                  )
                }
              >
                {t(option)}
              </Button>
            ))}
          </div>
        </div>
      </div>
      {context.dirty && actions.publication && (
        <p className="mt-2 text-xs text-amber-900">
          {t("saveBeforePublishing")}
        </p>
      )}
    </section>
  );
}

function ToolbarAction({
  action,
  primary = false,
}: {
  action: TimetableToolbarAction;
  primary?: boolean;
}) {
  return (
    <Button
      onClick={action.onClick}
      disabled={action.disabled}
      loading={action.loading}
      variant={primary ? "primary" : "secondary"}
      title={action.hint}
      className={`min-h-11 shrink-0 focus-visible:ring-2 focus-visible:ring-primary ${action.tone === "danger" ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" : ""}`}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {action.icon && (
          <span className="hidden sm:inline-flex">{action.icon}</span>
        )}
        <span>{action.label}</span>
      </span>
    </Button>
  );
}
