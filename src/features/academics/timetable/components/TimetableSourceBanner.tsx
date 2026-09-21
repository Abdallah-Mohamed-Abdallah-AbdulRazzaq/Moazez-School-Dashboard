"use client";

import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui";
import type { TimetableWorkspaceState } from "@/features/academics/timetable/services/timetableWorkspaceState";

interface TimetableSourceBannerCopy {
  exactTitle: string;
  exactDescription: string;
  inheritedTitle: string;
  inheritedDescription: string;
  sourceLabel: string;
  lockedLabel: string;
  createOverride: string;
  overrideUnavailable: string;
}

interface TimetableSourceBannerProps {
  workspaceState: TimetableWorkspaceState;
  sourceName: string;
  canCreateOverride: boolean;
  onCreateOverride: () => void;
  copy: TimetableSourceBannerCopy;
}

function SourceSummary({
  isInherited,
  sourceName,
  copy,
}: Pick<TimetableSourceBannerProps, "sourceName" | "copy"> & {
  isInherited: boolean;
}) {
  const title = isInherited ? copy.inheritedTitle : copy.exactTitle;

  return (
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
        <p className="text-gray-700">
          {isInherited ? copy.inheritedDescription : copy.exactDescription}
        </p>
        <p className="mt-1 text-xs font-medium text-gray-700">
          {copy.sourceLabel}: {sourceName}
        </p>
      </div>
    </div>
  );
}

function OverrideAction({
  canCreateOverride,
  onCreateOverride,
  copy,
}: Pick<
  TimetableSourceBannerProps,
  "canCreateOverride" | "onCreateOverride" | "copy"
>) {
  return (
    <div className="shrink-0">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={!canCreateOverride}
        onClick={onCreateOverride}
      >
        {copy.createOverride}
      </Button>
      {!canCreateOverride && (
        <p className="mt-1 max-w-xs text-xs text-amber-900">
          {copy.overrideUnavailable}
        </p>
      )}
    </div>
  );
}

export default function TimetableSourceBanner({
  workspaceState,
  sourceName,
  canCreateOverride,
  onCreateOverride,
  copy,
}: TimetableSourceBannerProps) {
  if (workspaceState.mode === "unconfigured") return null;

  const isInherited = workspaceState.mode === "inherited";
  const title = isInherited ? copy.inheritedTitle : copy.exactTitle;

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
        <SourceSummary
          isInherited={isInherited}
          sourceName={sourceName}
          copy={copy}
        />
        {isInherited && (
          <OverrideAction
            canCreateOverride={canCreateOverride}
            onCreateOverride={onCreateOverride}
            copy={copy}
          />
        )}
      </div>
    </section>
  );
}
