"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface UnsavedChangesContextType {
  setDirty: (key: string, dirty: boolean) => void;
  clearDirty: (key: string) => void;
  isDirty: boolean;
  dirtyKeys: string[];
  resetAll: () => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | undefined>(
  undefined
);

export function UnsavedChangesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dirtyKeysSet, setDirtyKeysSet] = useState<Set<string>>(new Set());

  const setDirty = useCallback((key: string, dirty: boolean) => {
    setDirtyKeysSet((prev) => {
      const newSet = new Set(prev);
      if (dirty) {
        newSet.add(key);
      } else {
        newSet.delete(key);
      }
      return newSet;
    });
  }, []);

  const clearDirty = useCallback((key: string) => {
    setDirtyKeysSet((prev) => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  }, []);

  const resetAll = useCallback(() => {
    setDirtyKeysSet(new Set());
  }, []);

  const dirtyKeys = Array.from(dirtyKeysSet);
  const isDirty = dirtyKeys.length > 0;

  return (
    <UnsavedChangesContext.Provider
      value={{ setDirty, clearDirty, isDirty, dirtyKeys, resetAll }}
    >
      {children}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error(
      "useUnsavedChanges must be used within UnsavedChangesProvider"
    );
  }
  return context;
}
