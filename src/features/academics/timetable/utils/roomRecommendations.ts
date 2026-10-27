import type { RoomAssignmentSource } from "@/features/academics/rooms/services/roomsService";
import { evaluateRoomEligibility } from "@/features/academics/rooms/services/roomSchedulingEligibility";
import type { Room, TimetableEntry } from "../types/timetable";

interface RoomRecommendationContext {
  subjectId?: string;
  rooms: Room[];
  entries: TimetableEntry[];
  selectedClassroom?: {
    id: string;
    nameAr: string;
    nameEn: string;
    capacity: number;
  };
  isRoomUnavailable?: (roomId: string) => boolean;
}

export interface RoomRecommendation {
  room: Room;
  previousLessons: number;
  matchesClassroom: boolean;
}

function subjectRoomUsage(context: RoomRecommendationContext): Map<string, number> {
  const usage = new Map<string, number>();
  if (!context.subjectId || !context.selectedClassroom) return usage;
  for (const entry of context.entries) {
    if (entry.classroomId === context.selectedClassroom.id &&
        entry.subjectId === context.subjectId && entry.slotType !== "BREAK" && entry.roomId) {
      usage.set(entry.roomId, (usage.get(entry.roomId) ?? 0) + 1);
    }
  }
  return usage;
}

function matchesClassroomName(room: Room, context: RoomRecommendationContext): boolean {
  const classroom = context.selectedClassroom;
  return Boolean(classroom && (
    (room.nameEn.trim() && room.nameEn.trim().toLowerCase() === classroom.nameEn.trim().toLowerCase()) ||
    (room.nameAr.trim() && room.nameAr.trim() === classroom.nameAr.trim())
  ));
}

export function getRoomRecommendations(context: RoomRecommendationContext): RoomRecommendation[] {
  const usage = subjectRoomUsage(context);
  return context.rooms
    .filter((room) => evaluateRoomEligibility(room, context.selectedClassroom).eligible &&
      !context.isRoomUnavailable?.(room.id))
    .map((room) => ({ room, previousLessons: usage.get(room.id) ?? 0, matchesClassroom: matchesClassroomName(room, context) }))
    .sort((left, right) =>
      right.previousLessons - left.previousLessons ||
      Number(right.matchesClassroom) - Number(left.matchesClassroom) ||
      (left.room.capacity ?? Infinity) - (right.room.capacity ?? Infinity) ||
      left.room.id.localeCompare(right.room.id),
    );
}

export function getDefaultRoomSuggestion(
  context: RoomRecommendationContext & { subjectId: string },
): { roomId: string | null; source: Exclude<RoomAssignmentSource, "MANUAL"> | null } {
  const [preferred] = getRoomRecommendations(context);
  return {
    roomId: preferred?.room.id ?? null,
    source: preferred ? "RECOMMENDED" : null,
  };
}
