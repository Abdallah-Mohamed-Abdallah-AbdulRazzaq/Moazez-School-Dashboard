"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Search, X } from "lucide-react";
import { Button, Input } from "@/components/ui";
import type { Subject } from "@/features/academics/subjects/services/subjectsService";
import type { Teacher } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import TimetableResourceCard from "@/features/academics/timetable/components/TimetableResourceCard";
import type { TimetableLibraryItem } from "@/features/academics/timetable/services/timetableDragDrop";
import type { Room } from "@/features/academics/timetable/types/timetable";

export type TimetableLibraryTab = "LESSONS" | "TEACHERS" | "ROOMS";

export interface TimetableResourceLibraryProps {
  items: TimetableLibraryItem[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  locale: string;
  selectedItemId: string | null;
  isOpen: boolean;
  mobile: boolean;
  disabled: boolean;
  onOpenChange: (open: boolean) => void;
  onItemSelect: (item: TimetableLibraryItem | null) => void;
}

const tabKinds: Record<TimetableLibraryTab, TimetableLibraryItem["kind"]> = {
  LESSONS: "LESSON",
  TEACHERS: "TEACHER",
  ROOMS: "ROOM",
};

export default function TimetableResourceLibrary(
  props: TimetableResourceLibraryProps,
) {
  const t = useTranslations("academics.timetable.schedulingLibrary");
  const [activeTab, setActiveTab] = useState<TimetableLibraryTab>("LESSONS");
  const [searchQuery, setSearchQuery] = useState("");
  const [unscheduledOnly, setUnscheduledOnly] = useState(false);
  const visibleItems = useMemo(
    () => filteredLibraryItems(props, activeTab, searchQuery, unscheduledOnly),
    [activeTab, props, searchQuery, unscheduledOnly],
  );

  if (!props.isOpen) return null;

  const panel = (
    <section className="flex h-full max-h-full min-h-0 flex-col overflow-hidden bg-white">
      <LibraryHeader mobile={props.mobile} onClose={() => props.onOpenChange(false)} />
      <div className="space-y-3 border-b border-gray-200 p-3">
        <Input
          type="search"
          inputSize="sm"
          label={t("searchLabel")}
          placeholder={t("searchPlaceholder")}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
        />
        <LibraryTabs activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === "LESSONS" && (
          <Button
            type="button"
            size="sm"
            variant={unscheduledOnly ? "primary" : "secondary"}
            aria-pressed={unscheduledOnly}
            fullWidth
            onClick={() => setUnscheduledOnly((current) => !current)}
          >
            {t("unscheduledOnly")}
          </Button>
        )}
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3">
        {visibleItems.length > 0 ? (
          visibleItems.map((libraryItem) => (
            <TimetableResourceCard
              key={libraryItem.id}
              item={libraryItem}
              subjects={props.subjects}
              teachers={props.teachers}
              rooms={props.rooms}
              locale={props.locale}
              selected={props.selectedItemId === libraryItem.id}
              disabled={props.disabled}
              onSelect={props.onItemSelect}
            />
          ))
        ) : (
          <p className="px-3 py-8 text-center text-sm text-gray-500">
            {t(emptyStateKey(activeTab))}
          </p>
        )}
      </div>
    </section>
  );

  if (!props.mobile) {
    return (
      <aside className="hidden h-full min-h-0 w-80 shrink-0 overflow-hidden border-e border-gray-200 lg:block print:hidden">
        {panel}
      </aside>
    );
  }

  return (
    <div className="fixed inset-0 z-40 lg:hidden print:hidden">
      <button
        type="button"
        aria-label={t("close")}
        className="absolute inset-0 cursor-default bg-black/30"
        onClick={() => props.onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className="absolute inset-x-0 bottom-0 h-[min(72vh,36rem)] overflow-hidden rounded-t-2xl border border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl"
      >
        {panel}
      </div>
    </div>
  );
}

function LibraryHeader({
  mobile,
  onClose,
}: {
  mobile: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("academics.timetable.schedulingLibrary");
  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{t("title")}</h2>
        <p className="mt-0.5 text-xs text-gray-500">{t("hint")}</p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-label={t("close")}
        onClick={onClose}
        leftIcon={
          mobile ? (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <X className="h-4 w-4" aria-hidden="true" />
          )
        }
      >
        {t("close")}
      </Button>
    </div>
  );
}

function LibraryTabs({
  activeTab,
  onChange,
}: {
  activeTab: TimetableLibraryTab;
  onChange: (tab: TimetableLibraryTab) => void;
}) {
  const t = useTranslations("academics.timetable.schedulingLibrary");
  const tabs: TimetableLibraryTab[] = ["LESSONS", "TEACHERS", "ROOMS"];
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label={t("tabs.label")}>
      {tabs.map((tab) => (
        <Button
          key={tab}
          type="button"
          size="sm"
          variant={activeTab === tab ? "primary" : "secondary"}
          aria-pressed={activeTab === tab}
          onClick={() => onChange(tab)}
          className="px-2"
        >
          {t(`tabs.${tab.toLowerCase()}`)}
        </Button>
      ))}
    </div>
  );
}

function filteredLibraryItems(
  props: TimetableResourceLibraryProps,
  activeTab: TimetableLibraryTab,
  searchQuery: string,
  unscheduledOnly: boolean,
): TimetableLibraryItem[] {
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase(props.locale);
  return props.items.filter((item) => {
    if (item.kind !== tabKinds[activeTab]) return false;
    if (
      unscheduledOnly &&
      item.kind === "LESSON" &&
      item.remainingPeriods === 0
    ) {
      return false;
    }
    return resourceSearchText(item, props)
      .toLocaleLowerCase(props.locale)
      .includes(normalizedQuery);
  });
}

function resourceSearchText(
  item: TimetableLibraryItem,
  props: TimetableResourceLibraryProps,
): string {
  if (item.kind === "LESSON") {
    return [
      localizedName(props.subjects, item.subjectId, props.locale),
      localizedName(props.teachers, item.teacherId, props.locale),
      localizedName(props.rooms, item.roomId, props.locale),
    ].join(" ");
  }
  if (item.kind === "TEACHER") {
    return [
      localizedName(props.teachers, item.teacherId, props.locale),
      localizedName(props.subjects, item.subjectId, props.locale),
    ].join(" ");
  }
  if (item.kind === "ROOM") {
    return localizedName(props.rooms, item.roomId, props.locale);
  }
  return "";
}

function localizedName<T extends { id: string; nameAr: string; nameEn: string }>(
  entities: T[],
  entityId: string | null,
  locale: string,
): string {
  const entity = entities.find((candidate) => candidate.id === entityId);
  return entity ? (locale === "ar" ? entity.nameAr : entity.nameEn) : "";
}

function emptyStateKey(
  activeTab: TimetableLibraryTab,
): "noLessons" | "noTeachers" | "noRooms" {
  if (activeTab === "TEACHERS") return "noTeachers";
  if (activeTab === "ROOMS") return "noRooms";
  return "noLessons";
}
