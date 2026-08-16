import type {
  BackendTimetableEntryDto,
  BulkSaveTimetableRequest,
  CreateEntryRequest,
} from "@/features/academics/timetable/services/timetableApiTypes";
import type { TimetableEntry } from "@/features/academics/timetable/types/timetable";

const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const dayIndexByKey: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export const dayIndexToKey = (day: number) => dayKeys[day] ?? "sun";

export const dayKeyToIndex = (key: string) => dayIndexByKey[key] ?? 0;

export interface TimetableEntryBackendMeta {
  timetableConfigId: string;
  periodId: string;
  teacherSubjectAllocationId: string | null;
  notes: string | null;
}

export type TimetableEntryBackendMetaMap = Record<
  string,
  TimetableEntryBackendMeta
>;

export function mapBackendEntryToUi(
  dto: BackendTimetableEntryDto,
): TimetableEntry {
  return {
    id: dto.id,
    termId: "",
    sectionId: "",
    classroomId: dto.classroom?.id,
    dayKey: dayIndexToKey(dto.dayOfWeek),
    periodIndex: dto.period?.index ?? 1,
    subjectId: dto.subject?.id ?? null,
    teacherId: dto.teacher?.userId ?? null,
    roomId: dto.room?.id ?? null,
    status: dto.status === "active" ? "PUBLISHED" : "DRAFT",
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    day: dto.dayOfWeek,
    period: dto.period?.index,
  };
}

export function mapBackendEntryToMeta(
  dto: BackendTimetableEntryDto,
): TimetableEntryBackendMeta {
  return {
    timetableConfigId: dto.timetableConfigId,
    periodId: dto.periodId,
    teacherSubjectAllocationId: dto.teacherSubjectAllocationId,
    notes: dto.notes,
  };
}

export function mapBackendEntriesToUi(
  dtos: BackendTimetableEntryDto[],
): {
  entries: TimetableEntry[];
  backendMetaByEntryId: TimetableEntryBackendMetaMap;
} {
  return dtos.reduce(
    (mappedEntries, dto) => {
      mappedEntries.entries.push(mapBackendEntryToUi(dto));
      mappedEntries.backendMetaByEntryId[dto.id] = mapBackendEntryToMeta(dto);
      return mappedEntries;
    },
    {
      entries: [],
      backendMetaByEntryId: {},
    } as {
      entries: TimetableEntry[];
      backendMetaByEntryId: TimetableEntryBackendMetaMap;
    },
  );
}

export function mapUiEntryToCreateEntryRequest(
  entry: TimetableEntry,
  backendMeta: TimetableEntryBackendMeta,
): CreateEntryRequest {
  return {
    timetableConfigId: backendMeta.timetableConfigId,
    periodId: backendMeta.periodId,
    dayOfWeek: dayKeyToIndex(entry.dayKey),
    classroomId: requiredClassroomId(entry),
    subjectId: entry.subjectId ?? undefined,
    teacherSubjectAllocationId: requiredTeacherSubjectAllocationId(
      entry,
      backendMeta,
    ),
    roomId: entry.roomId,
    notes: backendMeta.notes,
  };
}

export function mapUiEntriesToBulkSaveRequest(
  termId: string,
  entries: TimetableEntry[],
  backendMetaByEntryId: TimetableEntryBackendMetaMap,
): BulkSaveTimetableRequest {
  return {
    termId,
    items: entries.map((entry) => {
      const backendMeta = requiredBackendMeta(entry, backendMetaByEntryId);
      return {
        classroomId: requiredClassroomId(entry),
        dayOfWeek: dayKeyToIndex(entry.dayKey),
        periodId: backendMeta.periodId,
        teacherSubjectAllocationId: requiredTeacherSubjectAllocationId(
          entry,
          backendMeta,
        ),
        roomId: entry.roomId,
      };
    }),
  };
}

function requiredBackendMeta(
  entry: TimetableEntry,
  backendMetaByEntryId: TimetableEntryBackendMetaMap,
): TimetableEntryBackendMeta {
  const backendMeta = backendMetaByEntryId[entry.id];
  if (!backendMeta) {
    throw new Error(`Missing backend timetable metadata for entry ${entry.id}`);
  }
  return backendMeta;
}

function requiredClassroomId(entry: TimetableEntry): string {
  if (!entry.classroomId) {
    throw new Error(`Missing classroomId for timetable entry ${entry.id}`);
  }
  return entry.classroomId;
}

function requiredTeacherSubjectAllocationId(
  entry: TimetableEntry,
  backendMeta: TimetableEntryBackendMeta,
): string {
  if (!backendMeta.teacherSubjectAllocationId) {
    throw new Error(
      `Missing teacherSubjectAllocationId for timetable entry ${entry.id}`,
    );
  }
  return backendMeta.teacherSubjectAllocationId;
}
