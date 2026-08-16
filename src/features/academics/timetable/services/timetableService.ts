import type {
  TimetableConflict,
  TimetableEntry,
} from "@/features/academics/timetable/types/timetable";

type NamedEntity = { id: string; nameAr: string; nameEn: string };

export function detectConflicts(
  entries: TimetableEntry[],
  sections: NamedEntity[],
  classrooms: NamedEntity[],
  teachers: NamedEntity[],
  rooms: NamedEntity[],
  subjects: NamedEntity[],
): TimetableConflict[] {
  const timetableConflicts: TimetableConflict[] = [];
  const occupiedSlots = entries
    .filter((entry) => entry.subjectId)
    .reduce<Map<string, TimetableEntry[]>>((slots, entry) => {
      const slotKey = `${entry.dayKey}-${entry.periodIndex}`;
      slots.set(slotKey, [...(slots.get(slotKey) ?? []), entry]);
      return slots;
    }, new Map());

  occupiedSlots.forEach((slotEntries, slotKey) => {
    timetableConflicts.push(
      ...detectResourceConflicts({
        slotEntries,
        slotKey,
        resourceField: "teacherId",
        conflictType: "TEACHER",
        resources: teachers,
        sections,
        classrooms,
        subjects,
      }),
      ...detectResourceConflicts({
        slotEntries,
        slotKey,
        resourceField: "roomId",
        conflictType: "ROOM",
        resources: rooms,
        sections,
        classrooms,
        subjects,
      }),
    );
  });

  return timetableConflicts;
}

function detectResourceConflicts({
  slotEntries,
  slotKey,
  resourceField,
  conflictType,
  resources,
  sections,
  classrooms,
  subjects,
}: {
  slotEntries: TimetableEntry[];
  slotKey: string;
  resourceField: "teacherId" | "roomId";
  conflictType: "TEACHER" | "ROOM";
  resources: NamedEntity[];
  sections: NamedEntity[];
  classrooms: NamedEntity[];
  subjects: NamedEntity[];
}): TimetableConflict[] {
  return Array.from(entriesByResource(slotEntries, resourceField).entries())
    .filter(([, entriesForResource]) => entriesForResource.length > 1)
    .map(([resourceId, entriesForResource]) =>
      resourceConflict({
        slotKey,
        resourceId,
        entriesForResource,
        conflictType,
        resources,
        sections,
        classrooms,
        subjects,
      }),
    );
}

function entriesByResource(
  entries: TimetableEntry[],
  resourceField: "teacherId" | "roomId",
): Map<string, TimetableEntry[]> {
  return entries.reduce<Map<string, TimetableEntry[]>>((resourceEntries, entry) => {
    const resourceId = entry[resourceField];
    if (!resourceId) {
      return resourceEntries;
    }
    resourceEntries.set(resourceId, [
      ...(resourceEntries.get(resourceId) ?? []),
      entry,
    ]);
    return resourceEntries;
  }, new Map());
}

function resourceConflict({
  slotKey,
  resourceId,
  entriesForResource,
  conflictType,
  resources,
  sections,
  classrooms,
  subjects,
}: {
  slotKey: string;
  resourceId: string;
  entriesForResource: TimetableEntry[];
  conflictType: "TEACHER" | "ROOM";
  resources: NamedEntity[];
  sections: NamedEntity[];
  classrooms: NamedEntity[];
  subjects: NamedEntity[];
}): TimetableConflict {
  const [dayKey, periodIndex] = slotKey.split("-");
  const resource = resources.find((entity) => entity.id === resourceId);
  return {
    type: conflictType,
    dayKey,
    periodIndex: Number(periodIndex),
    resourceId,
    resourceName: resource?.nameEn || resource?.nameAr || "Unknown",
    sections: entriesForResource.map((entry) =>
      conflictSection(entry, sections, classrooms, subjects),
    ),
  };
}

function conflictSection(
  entry: TimetableEntry,
  sections: NamedEntity[],
  classrooms: NamedEntity[],
  subjects: NamedEntity[],
): TimetableConflict["sections"][number] {
  const section = sections.find((entity) => entity.id === entry.sectionId);
  const classroom = entry.classroomId
    ? classrooms.find((entity) => entity.id === entry.classroomId)
    : undefined;
  const subject = entry.subjectId
    ? subjects.find((entity) => entity.id === entry.subjectId)
    : undefined;

  return {
    sectionId: entry.sectionId,
    sectionName: section?.nameEn || section?.nameAr || "Unknown Section",
    classroomId: entry.classroomId,
    classroomName: classroom?.nameEn || classroom?.nameAr,
    subjectName: subject?.nameEn || subject?.nameAr || "Unknown Subject",
  };
}
