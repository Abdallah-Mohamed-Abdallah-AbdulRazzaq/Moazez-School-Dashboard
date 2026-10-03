"use client";

import { useTranslations } from "next-intl";
import { BookOpen, MapPin, UserRound } from "lucide-react";
import type { Subject } from "@/features/academics/subjects/services/subjectsService";
import type { Teacher } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import TimetableDraggableCard from "@/features/academics/timetable/components/TimetableDraggableCard";
import type { TimetableLibraryItem } from "@/features/academics/timetable/services/timetableDragDrop";
import type { Room } from "@/features/academics/timetable/types/timetable";

interface TimetableResourceCardProps {
  item: TimetableLibraryItem;
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  locale: string;
  selected: boolean;
  disabled: boolean;
  onSelect: (item: TimetableLibraryItem | null) => void;
}

interface ResourceCatalog {
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  locale: string;
}

export default function TimetableResourceCard({
  item,
  subjects,
  teachers,
  rooms,
  locale,
  selected,
  disabled,
  onSelect,
}: TimetableResourceCardProps) {
  const t = useTranslations("academics.timetable.schedulingLibrary");
  const catalog = { subjects, teachers, rooms, locale };
  const cardContent = resourceCardContent(item, catalog, t);

  return (
    <TimetableDraggableCard
      item={item}
      selected={selected}
      disabled={disabled}
      accessibleName={cardContent.accessibleName}
      onSelect={onSelect}
    >
      {cardContent.content}
    </TimetableDraggableCard>
  );
}

function resourceCardContent(
  item: TimetableLibraryItem,
  catalog: ResourceCatalog,
  t: ReturnType<typeof useTranslations>,
) {
  if (item.kind === "LESSON") return lessonCardContent(item, catalog, t);
  if (item.kind === "TEACHER") return teacherCardContent(item, catalog);
  if (item.kind === "ROOM") return roomCardContent(item, catalog, t);
  return { accessibleName: item.entryId, content: item.entryId };
}

function lessonCardContent(
  item: Extract<TimetableLibraryItem, { kind: "LESSON" }>,
  catalog: ResourceCatalog,
  t: ReturnType<typeof useTranslations>,
) {
  const subjectName = localizedName(catalog.subjects, item.subjectId, catalog.locale);
  const teacherName = localizedName(catalog.teachers, item.teacherId, catalog.locale);
  const roomName = localizedName(catalog.rooms, item.roomId, catalog.locale);
  const remainingLabel = t("remainingPeriods", {
    remaining: item.remainingPeriods,
    target: item.targetPeriods,
  });
  return {
    accessibleName: [subjectName, teacherName, roomName, remainingLabel]
      .filter(Boolean)
      .join(", "),
    content: (
      <div className="space-y-1.5">
        <ResourceLine icon={BookOpen} prominent text={subjectName} />
        {teacherName && <ResourceLine icon={UserRound} text={teacherName} />}
        {roomName && <ResourceLine icon={MapPin} text={roomName} />}
        <p className="text-xs font-medium text-primary">{remainingLabel}</p>
      </div>
    ),
  };
}

function teacherCardContent(
  item: Extract<TimetableLibraryItem, { kind: "TEACHER" }>,
  catalog: ResourceCatalog,
) {
  const teacherName = localizedName(catalog.teachers, item.teacherId, catalog.locale);
  const subjectName = localizedName(catalog.subjects, item.subjectId, catalog.locale);
  return {
    accessibleName: [teacherName, subjectName].filter(Boolean).join(", "),
    content: (
      <div className="space-y-1.5">
        <ResourceLine icon={UserRound} prominent text={teacherName} />
        <ResourceLine icon={BookOpen} text={subjectName} />
      </div>
    ),
  };
}

function roomCardContent(
  item: Extract<TimetableLibraryItem, { kind: "ROOM" }>,
  catalog: ResourceCatalog,
  t: ReturnType<typeof useTranslations>,
) {
  const room = catalog.rooms.find((candidate) => candidate.id === item.roomId);
  const roomName = room ? localizedEntityName(room, catalog.locale) : item.roomId;
  const capacityLabel =
    room?.capacity != null
      ? t("roomCapacity", { capacity: room.capacity })
      : null;
  return {
    accessibleName: [roomName, capacityLabel].filter(Boolean).join(", "),
    content: (
      <div className="space-y-1.5">
        <ResourceLine icon={MapPin} prominent text={roomName} />
        {capacityLabel && <p className="text-xs text-gray-500">{capacityLabel}</p>}
      </div>
    ),
  };
}

function ResourceLine({
  icon: Icon,
  text,
  prominent = false,
}: {
  icon: typeof BookOpen;
  text: string;
  prominent?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
      <span
        className={`truncate ${
          prominent
            ? "text-sm font-semibold text-gray-900"
            : "text-xs text-gray-600"
        }`}
      >
        {text}
      </span>
    </div>
  );
}

function localizedName<T extends { id: string; nameAr: string; nameEn: string }>(
  entities: T[],
  entityId: string | null,
  locale: string,
): string {
  const entity = entities.find((candidate) => candidate.id === entityId);
  return entity ? localizedEntityName(entity, locale) : "";
}

function localizedEntityName(
  entity: { nameAr: string; nameEn: string },
  locale: string,
): string {
  return locale === "ar" ? entity.nameAr : entity.nameEn;
}

