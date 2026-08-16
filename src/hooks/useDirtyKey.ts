import { useEffect, useCallback } from "react";
import { useUnsavedChanges } from "@/providers/UnsavedChangesProvider";

/**
 * Hook for managing dirty state for a specific feature/page
 * Automatically clears dirty state on unmount to avoid stale states
 * 
 * @param key - Unique identifier for the feature (e.g., "teacher-allocation", "calendar")
 * @returns Object with markDirty, clearDirty functions and isDirty state
 * 
 * @example
 * const { markDirty, clearDirty, isDirty } = useDirtyKey("teacher-allocation");
 * 
 * // When user makes changes
 * markDirty();
 * 
 * // After save success or discard
 * clearDirty();
 * 
 * // Check if dirty
 * if (isDirty) { ... }
 */
export function useDirtyKey(key: string) {
  const { setDirty, clearDirty: clearDirtyContext, dirtyKeys } = useUnsavedChanges();

  const markDirty = useCallback(() => {
    setDirty(key, true);
  }, [key, setDirty]);

  const clearDirty = useCallback(() => {
    clearDirtyContext(key);
  }, [key, clearDirtyContext]);

  // Check if this specific key is dirty
  const isDirty = dirtyKeys.includes(key);

  // Auto-clear on unmount to avoid stale dirty states
  useEffect(() => {
    return () => {
      clearDirtyContext(key);
    };
  }, [key, clearDirtyContext]);

  return { markDirty, clearDirty, isDirty };
}
