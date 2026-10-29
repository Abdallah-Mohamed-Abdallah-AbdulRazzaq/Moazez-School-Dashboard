"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { RoomRecommendation } from "../utils/roomRecommendations";

interface RoomSuggestionsProps {
  suggestions: RoomRecommendation[];
  selectedRoomId: string;
  locale: string;
  onSelect: (roomId: string) => void;
}

function suggestionReason({ room, previousLessons, matchesClassroom }: RoomRecommendation) {
  if (previousLessons > 0) return "roomUsedForSubject";
  if (matchesClassroom) return "roomMatchesClassroom";
  return room.capacity !== null ? "roomSuitableCapacity" : null;
}

export default function RoomSuggestions({ suggestions, selectedRoomId, locale, onSelect }: RoomSuggestionsProps) {
  const t = useTranslations("academics.timetable.editSlot");
  return (
    <div className="mt-2 space-y-2" role="group" aria-label={t("roomSuggestions")}>
      <p className="text-xs font-medium text-gray-700">{t("roomSuggestions")}</p>
      {suggestions.length === 0 && (
        <p role="status" className="text-sm text-amber-800">{t("noSuitableRoom")}</p>
      )}
      {suggestions.slice(0, 3).map((suggestion) => {
        const { room } = suggestion;
        const reason = suggestionReason(suggestion);
        const details = [
          t("roomAvailable"),
          room.capacity === null ? t("roomCapacityUnknown") : t("roomSeats", { count: room.capacity }),
          reason ? t(reason) : null,
        ].filter(Boolean).join(" · ");
        return (
          <Button
            key={room.id}
            type="button"
            variant="secondary"
            fullWidth
            aria-pressed={selectedRoomId === room.id}
            className="min-h-11 cursor-pointer justify-start text-start focus-visible:ring-2 focus-visible:ring-primary aria-pressed:border-primary aria-pressed:bg-primary/5 motion-reduce:transition-none"
            onClick={() => onSelect(room.id)}
          >
            <span className="block">{locale === "ar" ? room.nameAr || room.nameEn : room.nameEn || room.nameAr}</span>
            <span className="mt-1 block text-xs font-normal text-gray-600">
              {details}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
