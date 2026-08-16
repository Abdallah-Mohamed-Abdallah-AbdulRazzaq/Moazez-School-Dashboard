"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import {
  useAcademicYearTermContext,
  type UseAcademicYearTermContextOptions,
  type UseAcademicYearTermContextResult,
} from "@/features/academics/hooks/useAcademicYearTermContext";

type AcademicYearChangeHandler = (yearId: string) => Promise<void>;
type TermChangeHandler = (termId: string) => void;

interface AcademicYearTermLayoutGuardHandlers {
  onAcademicYearChange?: AcademicYearChangeHandler;
  onTermChange?: TermChangeHandler;
}

interface AcademicYearTermLayoutContextBarActions {
  onPromoteCarryOver?: () => void;
  showPromoteCarryOver?: boolean;
  disablePromoteCarryOver?: boolean;
  disableYearTermEditing?: boolean;
}

interface AcademicYearTermLayoutContextValue
  extends UseAcademicYearTermContextResult {
  // The shared layout owns the visible ContextBar and routes all year/term
  // changes through these request APIs so pages can optionally register guards.
  requestAcademicYearChange: AcademicYearChangeHandler;
  requestTermChange: TermChangeHandler;
  setGuardHandlers: (handlers: AcademicYearTermLayoutGuardHandlers | null) => void;
  contextBarActions: AcademicYearTermLayoutContextBarActions | null;
  setContextBarActions: (
    actions: AcademicYearTermLayoutContextBarActions | null
  ) => void;
}

const AcademicYearTermLayoutContext =
  createContext<AcademicYearTermLayoutContextValue | null>(null);

interface AcademicYearTermLayoutProviderProps
  extends PropsWithChildren {
  options?: UseAcademicYearTermContextOptions;
}

export function AcademicYearTermLayoutProvider({
  children,
  options,
}: AcademicYearTermLayoutProviderProps) {
  // This provider is the non-visual state layer for the shared academics
  // ContextBar. Route layouts decide which query-param keys it should own.
  const value = useAcademicYearTermContext(options);
  const guardHandlersRef = useRef<AcademicYearTermLayoutGuardHandlers | null>(null);
  const [contextBarActions, setContextBarActions] =
    useState<AcademicYearTermLayoutContextBarActions | null>(null);

  const setGuardHandlers = useCallback(
    (handlers: AcademicYearTermLayoutGuardHandlers | null) => {
      guardHandlersRef.current = handlers;
    },
    []
  );

  const requestAcademicYearChange = useCallback<AcademicYearChangeHandler>(
    async (yearId: string) => {
      const guardedHandler = guardHandlersRef.current?.onAcademicYearChange;

      if (guardedHandler) {
        await guardedHandler(yearId);
        return;
      }

      await value.changeAcademicYear(yearId);
    },
    [value]
  );

  const requestTermChange = useCallback<TermChangeHandler>(
    (termId: string) => {
      const guardedHandler = guardHandlersRef.current?.onTermChange;

      if (guardedHandler) {
        guardedHandler(termId);
        return;
      }

      value.changeTerm(termId);
    },
    [value]
  );

  const contextValue = useMemo<AcademicYearTermLayoutContextValue>(
    () => ({
      ...value,
      requestAcademicYearChange,
      requestTermChange,
      setGuardHandlers,
      contextBarActions,
      setContextBarActions,
    }),
    [
      contextBarActions,
      requestAcademicYearChange,
      requestTermChange,
      setContextBarActions,
      setGuardHandlers,
      value,
    ]
  );

  return (
    <AcademicYearTermLayoutContext.Provider value={contextValue}>
      {children}
    </AcademicYearTermLayoutContext.Provider>
  );
}

export function useAcademicYearTermLayoutContext() {
  const context = useContext(AcademicYearTermLayoutContext);

  if (!context) {
    throw new Error(
      "useAcademicYearTermLayoutContext must be used within AcademicYearTermLayoutProvider"
    );
  }

  return context;
}
