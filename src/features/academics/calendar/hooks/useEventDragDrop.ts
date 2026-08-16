import { useState, useCallback, useEffect } from "react";
import { AcademicEvent } from "@/features/academics/calendar/services/calendarService";

interface DragState {
  eventId: string | null;
  originalStartDate: string | null;
  originalEndDate: string | null;
  durationDays: number;
  event: AcademicEvent | null;
}

interface UseEventDragDropProps {
  termStartDate: string;
  termEndDate: string;
  isReadOnly: boolean;
  onEventMove: (eventId: string, newStartDate: string, newEndDate: string) => Promise<void>;
  onInvalidDrop?: () => void;
}

export function useEventDragDrop({
  termStartDate,
  termEndDate,
  isReadOnly,
  onEventMove,
  onInvalidDrop,
}: UseEventDragDropProps) {
  const [dragState, setDragState] = useState<DragState>({
    eventId: null,
    originalStartDate: null,
    originalEndDate: null,
    durationDays: 0,
    event: null,
  });
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove("calendar-dragging");
      document.body.style.cursor = "";
    };
  }, []);

  // Calculate duration in days (inclusive)
  const calculateDuration = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Inclusive
  };

  // Format date to ISO string (YYYY-MM-DD)
  const formatDateToISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Check if date is within term range
  const isWithinTermRange = useCallback((dateStr: string): boolean => {
    return dateStr >= termStartDate && dateStr <= termEndDate;
  }, [termStartDate, termEndDate]);

  // Drag handlers
  const handleDragStart = useCallback(
    (event: AcademicEvent, e: React.DragEvent) => {
      if (isReadOnly) {
        e.preventDefault();
        return;
      }

      const duration = calculateDuration(event.startDate, event.endDate);
      
      setDragState({
        eventId: event.id,
        originalStartDate: event.startDate,
        originalEndDate: event.endDate,
        durationDays: duration,
        event,
      });

      // Set drag data
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", event.id);
      
      // Add dragging class to body for global styling
      document.body.classList.add("calendar-dragging");
    },
    [isReadOnly]
  );

  const handleDragEnd = useCallback((e?: React.DragEvent) => {
    // Always clean up drag state and cursor
    setDragState({
      eventId: null,
      originalStartDate: null,
      originalEndDate: null,
      durationDays: 0,
      event: null,
    });
    setHoverDate(null);
    
    // Force remove the dragging class and reset cursor
    document.body.classList.remove("calendar-dragging");
    document.body.style.cursor = "";
    
    // Also reset cursor on the event target if available
    if (e?.currentTarget) {
      (e.currentTarget as HTMLElement).style.cursor = "";
    }
  }, []);

  // Drop target handlers
  const getDropHandlers = useCallback(
    (date: Date) => {
      const dateStr = formatDateToISO(date);

      return {
        onDragEnter: (e: React.DragEvent) => {
          e.preventDefault();
          if (!isReadOnly && dragState.eventId) {
            setHoverDate(dateStr);
          }
        },
        onDragOver: (e: React.DragEvent) => {
          e.preventDefault();
          if (!isReadOnly && dragState.eventId) {
            e.dataTransfer.dropEffect = "move";
          }
        },
        onDragLeave: (e: React.DragEvent) => {
          // Only clear if leaving the cell entirely
          if (e.currentTarget === e.target) {
            setHoverDate(null);
          }
        },
        onDrop: async (e: React.DragEvent) => {
          e.preventDefault();
          setHoverDate(null);
          
          // Clean up cursor immediately
          document.body.classList.remove("calendar-dragging");
          document.body.style.cursor = "";

          if (!dragState.eventId || !dragState.event || isReadOnly) {
            return;
          }

          // Calculate new dates
          const newStartDate = dateStr;
          const startDate = new Date(newStartDate);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + dragState.durationDays - 1);
          const newEndDate = formatDateToISO(endDate);

          // Validate both dates are within term range
          if (!isWithinTermRange(newStartDate) || !isWithinTermRange(newEndDate)) {
            onInvalidDrop?.();
            return;
          }

          // Don't move if dropped on same date
          if (newStartDate === dragState.originalStartDate) {
            return;
          }

          // Execute move
          await onEventMove(dragState.eventId, newStartDate, newEndDate);
        },
      };
    },
    [dragState, isReadOnly, onEventMove, onInvalidDrop, isWithinTermRange]
  );

  return {
    dragState,
    hoverDate,
    isDragging: !!dragState.eventId,
    handleDragStart,
    handleDragEnd,
    getDropHandlers,
    isWithinTermRange,
    formatDateToISO,
  };
}
