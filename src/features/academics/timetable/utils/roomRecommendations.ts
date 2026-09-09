import { Subject } from "@/features/academics/subjects/services/subjectsService";
import { type RoomAssignmentSource } from "@/features/academics/rooms/services/roomsService";
import { evaluateRoomEligibility } from "@/features/academics/rooms/services/roomSchedulingEligibility";
import { Room } from "@/features/academics/timetable/types/timetable";

interface ClassroomLike {
  id: string;
  nameAr: string;
  nameEn: string;
  capacity: number;
}

interface RoomRecommendationContext {
  subjectId?: string;
  subjects: Subject[];
  rooms: Room[];
  selectedClassroom?: ClassroomLike;
}

function subjectNeedsLab(subject?: Subject): boolean {
  const subjectLabel = `${subject?.nameEn || ""} ${subject?.nameAr || ""}`.toLowerCase();
  return (
    subjectLabel.includes("science") ||
    subjectLabel.includes("computer") ||
    subjectLabel.includes("stem") ||
    subjectLabel.includes("علوم") ||
    subjectLabel.includes("حاسوب")
  );
}

export function getRecommendedRooms(context: RoomRecommendationContext): Room[] {
  const selectedSubject = context.subjectId
    ? context.subjects.find((item) => item.id === context.subjectId)
    : undefined;
  const isLabSubject = subjectNeedsLab(selectedSubject);

  return context.rooms
    .filter((room) => evaluateRoomEligibility(room, context.selectedClassroom).eligible)
    .sort((left, right) => {
    const getScore = (room: Room) => {
      let score = 0;

      if (
        context.selectedClassroom &&
        (room.nameEn === context.selectedClassroom.nameEn ||
          room.nameAr === context.selectedClassroom.nameAr)
      ) {
        score += 100;
      }

      if (
        context.selectedClassroom &&
        room.capacity !== null &&
        room.capacity >= context.selectedClassroom.capacity
      ) {
        score += 10;
      }

      if (
        context.selectedClassroom &&
        (room.nameEn.toLowerCase().includes("lab") ||
          room.nameAr.includes("مختبر"))
      ) {
        if (isLabSubject) score += 50;
      }

      return score;
    };

      return getScore(right) - getScore(left);
    });
}

export function getDefaultRoomSuggestion(
  context: RoomRecommendationContext & { subjectId: string }
): {
  roomId: string | null;
  source: Exclude<RoomAssignmentSource, "MANUAL"> | null;
} {
  const [preferredRoom] = getRecommendedRooms(context);
  return {
    roomId: preferredRoom?.id || null,
    source: preferredRoom ? "RECOMMENDED" : null,
  };
}

export function getRoomSource(
  context: RoomRecommendationContext & {
    roomId: string | null;
    subjectId?: string;
  }
): RoomAssignmentSource | null {
  if (!context.roomId) {
    return null;
  }

  if (context.subjectId) {
    const [recommendedRoom] = getRecommendedRooms(context);
    if (recommendedRoom?.id === context.roomId) {
      return "RECOMMENDED";
    }
  }

  return "MANUAL";
}
