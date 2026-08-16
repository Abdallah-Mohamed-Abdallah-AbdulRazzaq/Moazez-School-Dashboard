"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/ui/input/DatePicker";
import { AcademicEvent } from "@/features/academics/calendar/services/calendarService";
import { Term } from "@/features/academics/academic-structure-tree/services/structureService";

interface MoveEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: AcademicEvent | null;
  term: Term;
  onMove: (newStartDate: string, newEndDate: string) => Promise<void>;
}

export default function MoveEventDialog({
  isOpen,
  onClose,
  event,
  term,
  onMove,
}: MoveEventDialogProps) {
  const t = useTranslations("academics.calendar");
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState("");

  const handleMove = async () => {
    if (!newDate || !event) return;

    setError("");
    setIsMoving(true);

    try {
      // Calculate duration
      const originalStart = new Date(event.startDate);
      const originalEnd = new Date(event.endDate);
      const durationMs = originalEnd.getTime() - originalStart.getTime();
      const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1;

      // Calculate new dates
      const formatDateToISO = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const newStartDate = formatDateToISO(newDate);
      const endDate = new Date(newDate);
      endDate.setDate(endDate.getDate() + durationDays - 1);
      const newEndDate = formatDateToISO(endDate);

      // Validate within term range
      if (newStartDate < term.startDate || newEndDate > term.endDate) {
        setError(t("dropOutsideTerm"));
        setIsMoving(false);
        return;
      }

      await onMove(newStartDate, newEndDate);
      onClose();
    } catch {
      setError(t("moveFailed"));
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("moveEvent")}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {t("selectNewDate")}
        </p>

        <DatePicker
          label={t("start_date")}
          value={newDate}
          onChange={setNewDate}
          minDate={new Date(term.startDate)}
          maxDate={new Date(term.endDate)}
        />

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isMoving}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleMove}
            disabled={!newDate || isMoving}
            loading={isMoving}
          >
            {t("moveEvent")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
