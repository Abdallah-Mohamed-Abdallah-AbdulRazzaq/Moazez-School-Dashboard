"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Button from "@/components/ui/button/Button";
import RoomDialog from "@/features/academics/rooms/components/RoomDialog";
import { createRoom, updateRoom } from "@/features/academics/rooms/services/roomsService";
import type { Room } from "@/features/academics/timetable/types/timetable";

export interface RoomsSetupStepCopy {
  summary: string;
  createRoom: string;
  missingSchool: string;
  saveFailed: string;
  manage: string;
}

interface RoomsSetupStepProps {
  copy: RoomsSetupStepCopy;
  schoolId: string;
  rooms: Room[];
  refreshStep(stepId: "rooms"): Promise<void> | void;
}

export function RoomsSetupStep({ copy, schoolId, rooms = [], refreshStep }: RoomsSetupStepProps) {
  const locale = useLocale();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const handleSave = async (
    payload: Omit<Room, "id" | "schoolId" | "createdAt" | "updatedAt">,
  ) => {
    if (!schoolId) {
      setError(copy.missingSchool);
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, payload);
      } else {
        await createRoom(schoolId, payload);
      }
      setIsDialogOpen(false);
      setEditingRoom(null);
      await refreshStep("rooms");
    } catch {
      setError(copy.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  if (!schoolId) {
    return <p className="text-sm text-red-700">{copy.missingSchool}</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{copy.summary}</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setIsDialogOpen(true)} type="button">
          {copy.createRoom}
        </Button>
      </div>
      {rooms.map((room) => (
        <Button key={room.id} onClick={() => { setEditingRoom(room); setIsDialogOpen(true); }} size="sm" type="button" variant="secondary">
          {copy.manage}: {locale === "ar" ? room.nameAr || room.name : room.nameEn || room.name}
        </Button>
      ))}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <RoomDialog
        isSaving={isSaving}
        onClose={() => { setIsDialogOpen(false); setEditingRoom(null); }}
        onSave={handleSave}
        open={isDialogOpen}
        room={editingRoom}
      />
    </div>
  );
}
