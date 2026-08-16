"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { X } from "lucide-react";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import Input from "@/components/ui/input/Input";
import { Button } from "@/components/ui";
import { Room } from "@/features/academics/timetable/types/timetable";

interface RoomDialogProps {
  open: boolean;
  room: Room | null;
  isSaving?: boolean;
  onSave: (
    room: Omit<Room, "id" | "schoolId" | "createdAt" | "updatedAt">
  ) => Promise<void> | void;
  onClose: () => void;
}

export default function RoomDialog({
  open,
  room,
  isSaving = false,
  onSave,
  onClose,
}: RoomDialogProps) {
  const t = useTranslations("academics.timetable.rooms");
  const tValidation = useTranslations("academics.timetable.rooms.validation");

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [capacity, setCapacity] = useState("30");
  const [floor, setFloor] = useState("");
  const [building, setBuilding] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* eslint-disable react-hooks/set-state-in-effect */
  // Form reset pattern: sync form state with room prop and dialog open state
  useEffect(() => {
    if (room) {
      setNameAr(room.nameAr);
      setNameEn(room.nameEn);
      setCapacity(room.capacity?.toString() ?? "");
      setFloor(room.floor || "");
      setBuilding(room.building || "");
      setIsActive(room.isActive);
    } else {
      setNameAr("");
      setNameEn("");
      setCapacity("30");
      setFloor("");
      setBuilding("");
      setIsActive(true);
    }
    setErrors({});
  }, [room, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nameAr.trim()) {
      newErrors.nameAr = tValidation("nameArRequired");
    }
    if (!nameEn.trim()) {
      newErrors.nameEn = tValidation("nameEnRequired");
    }
    if (nameAr.trim() && nameEn.trim() && nameAr.trim() === nameEn.trim()) {
      newErrors.names = tValidation("namesMustDiffer");
    }
    const parsedCapacity = Number(capacity);
    if (
      capacity.trim() &&
      (!Number.isInteger(parsedCapacity) || parsedCapacity < 1)
    ) {
      newErrors.capacity = tValidation("capacityMin");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (isSaving) return;
    if (!validate()) return;

    const trimmedCapacity = capacity.trim();
    onSave({
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim(),
      capacity: trimmedCapacity ? Number(trimmedCapacity) : null,
      floor: floor.trim() || undefined,
      building: building.trim() || undefined,
      isActive,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 2,
        }}
      >
        <div className="text-lg font-semibold text-gray-900">
          {room ? t("editRoom") : t("addRoom")}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <div className="space-y-4">
          <div>
            <BilingualTextField
              label={t("name")}
              value={{ ar: nameAr, en: nameEn }}
              onChange={(value) => {
                setNameAr(value.ar);
                setNameEn(value.en);
              }}
              errors={{
                ar: errors.nameAr,
                en: errors.nameEn,
              }}
              placeholder={{
                ar: "مثال: الفصل 101",
                en: "e.g., Classroom 101",
              }}
            />
            {errors.names && (
              <p className="text-sm text-red-600 mt-1">{errors.names}</p>
            )}
          </div>
          <div>
            <Input
              label={t("capacity")}
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              error={errors.capacity}
              min="1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("building")}
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              placeholder="e.g., Block A"
            />
            <Input
              label={t("floor")}
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="e.g., 1st Floor"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              {t("active")}
            </label>
          </div>
        </div>
      </DialogContent>

      <DialogActions
        sx={{
          pb: 3,
          pt: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Button onClick={onClose} variant="secondary" disabled={isSaving}>
          {t("cancel")}
        </Button>
        <Button onClick={handleSave} variant="primary" disabled={isSaving}>
          {t("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
