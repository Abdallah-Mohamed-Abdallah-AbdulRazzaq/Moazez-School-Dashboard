"use client";

import { LockKeyhole } from "lucide-react";
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
  sourceLabel: string;
  lockedLabel: string;
  createOverride: string;
  customizeScope: string;
  returnToTermDefault: string;
  overrideUnavailable: string;
  publishedOverridesNote: string;
}

interface TimetableSourceBannerProps {
  workspaceState: TimetableWorkspaceState;
  sourceName: string;
  configurationScope: TimetableScopeSelection;
  canCreateOverride: boolean;
  onCreateOverride: () => void;
  onReturnToTermDefault: () => void;
  copy: TimetableSourceBannerCopy;
}

export default function TimetableSourceBanner({
  workspaceState,
  sourceName,
  configurationScope,
  canCreateOverride,
  onCreateOverride,
  onReturnToTermDefault,
  copy,
}: TimetableSourceBannerProps) {
  const isTermDefault = configurationScope.scopeType === "TERM";
  const isInherited = workspaceState.mode === "inherited";
  const title = isTermDefault
    ? copy.termDefaultTitle
    : isInherited
      ? copy.inheritedTitle
      : copy.exactTitle;
  const description = isTermDefault
    ? copy.termDefaultDescription
    : isInherited
      ? copy.inheritedDescription
      : copy.exactDescription;
  const canOfferCreate =
    isTermDefault || isInherited || workspaceState.mode === "unconfigured";

  return (
    <section
      aria-label={title}
      className={`border-b px-4 py-3 lg:px-6 ${
        isInherited
          ? "border-amber-200 bg-amber-50"
          : "border-blue-200 bg-blue-50"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          {isInherited && (
            <LockKeyhole
              aria-label={copy.lockedLabel}
              role="img"
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
            />
          )}
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-gray-900">{title}</p>
            <p className="text-gray-700">{description}</p>
            <p className="mt-1 text-xs font-medium text-gray-700">
              {copy.sourceLabel}: {sourceName}
            </p>
            {isTermDefault && (
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
              disabled={!canCreateOverride}
              onClick={onCreateOverride}
            >
              {isTermDefault ? copy.customizeScope : copy.createOverride}
            </Button>
          )}
          {!canCreateOverride && canOfferCreate && (
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
