"use client";

import { useEffect } from "react";
import { useAttendanceYearTermLayoutContext } from "@/features/attendance/shared/hooks/AttendanceYearTermLayoutContext";

type UseAttendanceGuardedYearTermChangeOptions = {
  onYearChange?: (yearId: string) => void | Promise<void>;
  onTermChange?: (termId: string) => void | Promise<void>;
};

export function useAttendanceGuardedYearTermChange({
  onYearChange,
  onTermChange,
}: UseAttendanceGuardedYearTermChangeOptions) {
  const { setGuardHandlers } = useAttendanceYearTermLayoutContext();

  useEffect(() => {
    setGuardHandlers({ onYearChange, onTermChange });

    return () => {
      setGuardHandlers(null);
    };
  }, [onTermChange, onYearChange, setGuardHandlers]);
}
