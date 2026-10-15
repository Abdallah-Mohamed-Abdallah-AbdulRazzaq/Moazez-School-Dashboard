"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  Search,
  X,
} from "lucide-react";
import { Button, Input, Select } from "@/components/ui";

interface TimetableViewNavigationProps {
  classrooms: { value: string; label: string; triggerLabel?: string }[];
  classroomId: string;
  onClassroomChange: (classroomId: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
  matchCount: number;
  matchPosition: number;
  onMatchStep: (direction: -1 | 1) => void;
  focusMode: boolean;
  onFocusModeChange: (enabled: boolean) => void;
  disabled: boolean;
}

export default function TimetableViewNavigation(
  props: TimetableViewNavigationProps,
) {
  const t = useTranslations("academics.timetable.navigation");
  const rtl = useLocale() === "ar";
  const classroomIndex = props.classrooms.findIndex(
    (classroom) => classroom.value === props.classroomId,
  );
  const PreviousIcon = rtl ? ArrowRight : ArrowLeft;
  const NextIcon = rtl ? ArrowLeft : ArrowRight;
  return (
    <div className="shrink-0 space-y-2 border-b border-gray-200 bg-white px-4 py-3 print:hidden lg:flex lg:items-end lg:gap-4 lg:space-y-0 lg:px-6">
      <div className="flex flex-wrap items-end gap-2 lg:flex-1">
        <div className="min-w-0 flex-1 lg:max-w-md">
          <Select
            label={t("classroom")}
            value={props.classroomId}
            options={[
              { value: "", label: t("allClassrooms") },
              ...props.classrooms,
            ]}
            onChange={props.onClassroomChange}
            disabled={props.disabled || !props.classrooms.length}
            searchable
            searchPlaceholder={t("searchClassrooms")}
            searchLabel={t("searchClassrooms")}
            noResultsText={t("noClassrooms")}
          />
        </div>
        <Button
          variant="secondary"
          className="min-h-11 min-w-11 px-2"
          aria-label={t("previousClassroom")}
          disabled={props.disabled || classroomIndex <= 0}
          onClick={() =>
            props.onClassroomChange(props.classrooms[classroomIndex - 1].value)
          }
        >
          <PreviousIcon className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="secondary"
          className="min-h-11 min-w-11 px-2"
          aria-label={t("nextClassroom")}
          disabled={
            props.disabled || classroomIndex >= props.classrooms.length - 1
          }
          onClick={() =>
            props.onClassroomChange(props.classrooms[classroomIndex + 1].value)
          }
        >
          <NextIcon className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="secondary"
          className="min-h-11"
          aria-pressed={props.focusMode}
          aria-label={t(props.focusMode ? "exitFocus" : "focusMode")}
          title={t(props.focusMode ? "exitFocus" : "focusMode")}
          onClick={() => props.onFocusModeChange(!props.focusMode)}
          leftIcon={
            props.focusMode ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )
          }
        >
          <span className="hidden sm:inline">
            {t(props.focusMode ? "exitFocus" : "focusMode")}
          </span>
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:flex-1">
        <div className="min-w-0 flex-1 basis-52 lg:max-w-md">
          <Input
            type="search"
            aria-label={t("findLessons")}
            placeholder={t("searchPlaceholder")}
            value={props.query}
            disabled={props.disabled}
            onChange={(event) => props.onQueryChange(event.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        {props.query.trim() && (
          <>
            <Button
              variant="ghost"
              className="min-h-11 min-w-11 px-2"
              aria-label={t("clearSearch")}
              onClick={() => props.onQueryChange("")}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
            <div className="flex items-center gap-2">
              <span role="status" className="text-xs text-gray-600">
                {props.matchCount
                  ? props.matchPosition
                    ? t("matchPosition", {
                        position: props.matchPosition,
                        count: props.matchCount,
                      })
                    : t("matchCount", { count: props.matchCount })
                  : t("noMatches")}
              </span>
              <Button
                variant="secondary"
                className="min-h-11 min-w-11 px-2"
                aria-label={t("previousMatch")}
                disabled={!props.matchCount || props.disabled}
                onClick={() => props.onMatchStep(-1)}
              >
                <PreviousIcon className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="secondary"
                className="min-h-11 min-w-11 px-2"
                aria-label={t("nextMatch")}
                disabled={!props.matchCount || props.disabled}
                onClick={() => props.onMatchStep(1)}
              >
                <NextIcon className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
