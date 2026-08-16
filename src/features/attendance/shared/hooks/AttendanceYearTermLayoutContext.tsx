"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useCallback,
  type PropsWithChildren,
} from "react";
import {
  useAttendanceTermContext,
  type AttendanceTermContext,
} from "@/features/attendance/shared/hooks/useAttendanceTermContext";

type AttendanceYearTermGuardHandlers = {
  onYearChange?: (yearId: string) => void | Promise<void>;
  onTermChange?: (termId: string) => void | Promise<void>;
};

export type AttendanceYearTermLayoutContextValue = AttendanceTermContext & {
  requestYearChange: (yearId: string) => void | Promise<void>;
  requestTermChange: (termId: string) => void | Promise<void>;
  setGuardHandlers: (handlers: AttendanceYearTermGuardHandlers | null) => void;
};

const AttendanceYearTermLayoutContext =
  createContext<AttendanceYearTermLayoutContextValue | null>(null);

export function AttendanceYearTermLayoutProvider({
  children,
}: PropsWithChildren) {
  // Workspace-style attendance pages keep one visible section ContextBar
  // in the shared layout, so they can reuse the existing controller here.
  const value = useAttendanceTermContext();
  const guardHandlersRef = useRef<AttendanceYearTermGuardHandlers | null>(null);

  const requestYearChange = useCallback(
    (yearId: string) => {
      if (guardHandlersRef.current?.onYearChange) {
        return guardHandlersRef.current.onYearChange(yearId);
      }

      return value.setYearId(yearId);
    },
    [value],
  );

  const requestTermChange = useCallback(
    (termId: string) => {
      if (guardHandlersRef.current?.onTermChange) {
        return guardHandlersRef.current.onTermChange(termId);
      }

      return value.setTermId(termId);
    },
    [value],
  );

  const setGuardHandlers = useCallback((handlers: AttendanceYearTermGuardHandlers | null) => {
    guardHandlersRef.current = handlers;
  }, []);

  const contextValue = useMemo<AttendanceYearTermLayoutContextValue>(
    () => ({
      ...value,
      requestYearChange,
      requestTermChange,
      setGuardHandlers,
    }),
    [requestTermChange, requestYearChange, setGuardHandlers, value],
  );

  return (
    <AttendanceYearTermLayoutContext.Provider value={contextValue}>
      {children}
    </AttendanceYearTermLayoutContext.Provider>
  );
}

export function useAttendanceYearTermLayoutContext() {
  const context = useContext(AttendanceYearTermLayoutContext);

  if (!context) {
    throw new Error(
      "useAttendanceYearTermLayoutContext must be used within AttendanceYearTermLayoutProvider"
    );
  }

  return context;
}
