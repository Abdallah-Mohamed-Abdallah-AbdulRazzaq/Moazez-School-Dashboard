"use client";

import { useEffect, useMemo, useState } from "react";
import Select from "@/components/ui/input/Select";
import {
  getConfig,
  getDashboardTimetable,
} from "@/features/academics/timetable/services/timetableApiAdapter";
import { isTimetableConfigNotFound } from "@/features/academics/timetable/services/timetableErrorHandling";
import type {
  BackendTimetableConfigDto,
  BackendTimetableEntryDto,
} from "@/features/academics/timetable/services/timetableApiTypes";
import {
  dashboardEntriesForScope,
  timetableConfigCandidates,
  type TimetableSlotScope,
} from "../services/lessonPlanTimetable";

export type { TimetableSlotScope } from "../services/lessonPlanTimetable";

interface TimetableSlotSelectProps extends TimetableSlotScope {
  plannedDate: string;
  value: string;
  onChange: (entry: BackendTimetableEntryDto | null) => void;
  label: string;
  emptyOptionLabel: string;
  noSlotsMessage: string;
  loadingMessage: string;
  loadErrorMessage: string;
}

export function dayOfWeekFromDateOnly(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

export function useTimetableConfigForScope(
  scope: TimetableSlotScope,
  enabled: boolean,
) {
  const [config, setConfig] = useState<BackendTimetableConfigDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [isMissing, setIsMissing] = useState(false);

  useEffect(() => {
    let active = true;
    const scopeIsComplete =
      scope.academicYearId &&
      scope.termId &&
      scope.gradeId &&
      scope.sectionId &&
      scope.classroomId;

    if (!enabled || !scopeIsComplete) {
      void Promise.resolve().then(() => {
        if (!active) return;
        setConfig(null);
        setIsLoading(false);
        setError(null);
        setIsMissing(false);
      });
      return () => {
        active = false;
      };
    }

    void Promise.resolve().then(() => {
      if (!active) return;
      setConfig(null);
      setIsLoading(true);
      setError(null);
      setIsMissing(false);
    });

    void (async () => {
      for (const candidate of timetableConfigCandidates(scope)) {
        try {
          const resolved = await getConfig(candidate);
          if (active) setConfig(resolved);
          return;
        } catch (lookupError) {
          if (!isTimetableConfigNotFound(lookupError)) {
            if (active) setError(lookupError);
            return;
          }
        }
      }
      if (active) setIsMissing(true);
    })().finally(() => {
      if (active) setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [enabled, scope]);

  return { config, isLoading, error, isMissing };
}

export function activeTimetableDates(
  dates: string[],
  config: Pick<BackendTimetableConfigDto, "activeDays" | "weekStartDay"> | null,
): string[] {
  if (!config) return [];
  const activeDays = new Set(config.activeDays);
  return dates
    .filter((date) => activeDays.has(dayOfWeekFromDateOnly(date)))
    .sort((left, right) => {
      const leftOffset =
        (dayOfWeekFromDateOnly(left) - config.weekStartDay + 7) % 7;
      const rightOffset =
        (dayOfWeekFromDateOnly(right) - config.weekStartDay + 7) % 7;
      if (leftOffset !== rightOffset) return leftOffset - rightOffset;
      return left.localeCompare(right);
    });
}

function entryOptionLabel(entry: BackendTimetableEntryDto): string {
  const subject = entry.subject?.nameEn || entry.subject?.nameAr;
  const teacher = entry.teacher as
    | (NonNullable<BackendTimetableEntryDto["teacher"]> & {
        name?: string;
        nameEn?: string;
        nameAr?: string;
      })
    | null;
  const teacherName =
    teacher?.fullName || teacher?.name || teacher?.nameEn || teacher?.nameAr;
  const time =
    entry.period?.startTime && entry.period?.endTime
      ? `${entry.period.startTime} - ${entry.period.endTime}`
      : undefined;
  return [entry.period?.label, time, subject, teacherName]
    .filter(Boolean)
    .join(" · ") || entry.id;
}

export default function TimetableSlotSelect({
  plannedDate,
  value,
  onChange,
  label,
  emptyOptionLabel,
  noSlotsMessage,
  loadingMessage,
  loadErrorMessage,
  academicYearId,
  termId,
  gradeId,
  sectionId,
  classroomId,
  teacherUserId,
  subjectId,
  teacherSubjectAllocationId,
}: TimetableSlotSelectProps) {
  const [entries, setEntries] = useState<BackendTimetableEntryDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const scope = useMemo<TimetableSlotScope>(
    () => ({
      academicYearId,
      termId,
      gradeId,
      sectionId,
      classroomId,
      teacherUserId,
      subjectId,
      teacherSubjectAllocationId,
    }),
    [
      academicYearId,
      classroomId,
      gradeId,
      sectionId,
      subjectId,
      teacherSubjectAllocationId,
      teacherUserId,
      termId,
    ],
  );

  useEffect(() => {
    let active = true;
    onChange(null);
    void Promise.resolve().then(() => {
      if (!active) return;
      setEntries([]);
      setIsLoading(false);
      setLoadError(null);
    });

    if (
      !plannedDate ||
      !scope.termId ||
      !scope.classroomId ||
      !scope.teacherSubjectAllocationId
    ) {
      return () => {
        active = false;
      };
    }

    void Promise.resolve().then(() => {
      if (active) setIsLoading(true);
    });
    void getDashboardTimetable({
      termId: scope.termId,
      classroomId: scope.classroomId,
    })
      .then((dashboard) => {
        if (!active) return;
        setEntries(
          dashboardEntriesForScope(
            dashboard,
            scope,
            dayOfWeekFromDateOnly(plannedDate),
          ),
        );
      })
      .catch((error) => {
        if (active) setLoadError(error);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [onChange, plannedDate, scope]);

  return (
    <Select
      label={label}
      value={value}
      onChange={(entryId) =>
        onChange(entries.find((entry) => entry.id === entryId) ?? null)
      }
      disabled={isLoading || Boolean(loadError)}
      options={[
        { value: "", label: isLoading ? loadingMessage : emptyOptionLabel },
        ...entries.map((entry) => ({
          value: entry.id,
          label: entryOptionLabel(entry),
        })),
      ]}
      helperText={
        loadError
          ? loadErrorMessage
          : !isLoading && entries.length === 0
            ? noSlotsMessage
            : undefined
      }
    />
  );
}
