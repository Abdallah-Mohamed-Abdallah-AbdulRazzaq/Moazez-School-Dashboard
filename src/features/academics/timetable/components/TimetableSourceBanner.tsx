"use client";

import { Layers3, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui";
import type { TimetableScopeSelection } from "@/features/academics/timetable/services/timetableScope";
import type { TimetableWorkspaceState } from "@/features/academics/timetable/services/timetableWorkspaceState";

interface TimetableSourceBannerCopy {
  exactTitle: string;
  exactDescription: string;
  termDefaultTitle: string;
  termDefaultDescription: string;
  inheritedTitle: string;
  inheritedDescription: string;
  unconfiguredTitle: string;
  unconfiguredDescription: string;
  unconfiguredScopeDescription: string;
  sourceLabel: string;
  lockedLabel: string;
  createOverride: string;
  customizeScope: string;
  openSelectedScope: string;
  returnToTermDefault: string;
  overrideUnavailable: string;
  publishedOverridesNote: string;
}

interface TimetableSourceBannerProps {
  workspaceState: TimetableWorkspaceState;
  sourceName: string;
  configurationScope: TimetableScopeSelection;
  primaryActionEnabled: boolean;
  onCreateOverride: () => void;
  onReturnToTermDefault: () => void;
  copy: TimetableSourceBannerCopy;
}

export default function TimetableSourceBanner({
  workspaceState,
  sourceName,
  configurationScope,
  primaryActionEnabled,
  onCreateOverride,
  onReturnToTermDefault,
  copy,
}: TimetableSourceBannerProps) {
  const isTermDefault = configurationScope.scopeType === "TERM";
  const isInherited = workspaceState.mode === "inherited";
  const isUnconfigured = workspaceState.mode === "unconfigured";
  const title = isUnconfigured
    ? copy.unconfiguredTitle
    : isTermDefault
      ? copy.termDefaultTitle
      : isInherited
        ? copy.inheritedTitle
        : copy.exactTitle;
  const description = isUnconfigured
    ? isTermDefault
      ? copy.unconfiguredDescription
      : copy.unconfiguredScopeDescription
    : isTermDefault
      ? copy.termDefaultDescription
      : isInherited
        ? copy.inheritedDescription
        : copy.exactDescription;
  const canOfferCreate =
    isTermDefault || isInherited || workspaceState.mode === "unconfigured";
  const SourceIcon = isInherited
    ? LockKeyhole
    : isTermDefault
      ? ShieldCheck
      : Layers3;

  return (
    <section
      aria-label={title}
      className="border-b border-gray-200 bg-gray-50 px-4 py-3 print:hidden lg:px-6"
    >
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isInherited ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-700"}`}
          >
            <SourceIcon
              aria-label={isInherited ? copy.lockedLabel : undefined}
              role={isInherited ? "img" : undefined}
              aria-hidden={isInherited ? undefined : true}
              className="h-5 w-5"
            />
          </span>
          <div className="min-w-0 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-gray-950">{title}</p>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                {copy.sourceLabel}: {sourceName}
              </span>
            </div>
            <p className="mt-1 leading-6 text-gray-700">{description}</p>
            {isTermDefault && !isUnconfigured && (
              <p className="mt-1 text-xs text-gray-600">
                {copy.publishedOverridesNote}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {canOfferCreate && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!primaryActionEnabled}
              onClick={onCreateOverride}
            >
              {isUnconfigured && isTermDefault
                ? copy.openSelectedScope
                : isTermDefault
                  ? copy.customizeScope
                  : copy.createOverride}
            </Button>
          )}
          {!primaryActionEnabled && canOfferCreate && (
            <p className="max-w-xs text-xs text-amber-900">
              {copy.overrideUnavailable}
            </p>
          )}
          {!isTermDefault && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReturnToTermDefault}
            >
              {copy.returnToTermDefault}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
