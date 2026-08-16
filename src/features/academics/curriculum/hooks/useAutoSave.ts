import { useRef, useCallback, useState, useEffect } from "react";

export type AutoSaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

interface UseAutoSaveOptions<T> {
  enabled: boolean;
  onSave: (snapshot: T) => Promise<void>;
  debounceMs?: number;
  onError?: (error: Error) => void;
}

interface UseAutoSaveReturn<T> {
  status: AutoSaveStatus;
  lastSavedAt: Date | null;
  setDraft: (snapshot: T) => void;
  getDraft: () => T | null;
  markDirty: () => void;
  flushNow: () => Promise<void>;
  retry: () => Promise<void>;
}

export function useAutoSave<T>({
  enabled,
  onSave,
  debounceMs = 800,
  onError,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Refs for managing state without causing re-renders
  const draftRef = useRef<T | null>(null);
  const revisionRef = useRef(0);
  const savedRevisionRef = useRef(0);
  const inFlightRevisionRef = useRef<number | null>(null);
  const pendingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastErrorRef = useRef<Error | null>(null);
  
  // Use a ref to store the performSave function to avoid forward reference issues
  const performSaveRef = useRef<(() => Promise<void>) | null>(null);

  // Clear any pending timer
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Perform the actual save
  const performSave = useCallback(async () => {
    if (!enabled || !draftRef.current) {
      return;
    }

    const currentRevision = revisionRef.current;
    
    // Only save if there are unsaved changes
    if (currentRevision <= savedRevisionRef.current) {
      return;
    }

    // Capture the snapshot from draftRef (not from stale closure)
    const snapshot = { ...draftRef.current };

    // Mark as in-flight
    inFlightRevisionRef.current = currentRevision;
    pendingRef.current = false;
    setStatus("saving");

    try {
      await onSave(snapshot);

      // Only update status if this save is still relevant
      // (no newer changes have been made)
      if (revisionRef.current === currentRevision) {
        setStatus("saved");
        setLastSavedAt(new Date());
        savedRevisionRef.current = currentRevision;
        lastErrorRef.current = null;
      } else {
        // Newer changes exist, stay dirty
        setStatus("dirty");
      }

      inFlightRevisionRef.current = null;

      // If there are pending changes, save them
      if (pendingRef.current || revisionRef.current > currentRevision) {
        pendingRef.current = false;
        // Schedule next save immediately using the ref
        if (performSaveRef.current) {
          setTimeout(() => performSaveRef.current?.(), 0);
        }
      }
    } catch (error) {
      inFlightRevisionRef.current = null;
      lastErrorRef.current = error as Error;
      setStatus("error");
      
      if (onError) {
        onError(error as Error);
      }

      // Keep pending flag if there are newer changes
      if (pendingRef.current) {
        pendingRef.current = false;
      }
    }
  }, [enabled, onSave, onError]);
  
  // Store performSave in ref using useEffect
  useEffect(() => {
    performSaveRef.current = performSave;
  }, [performSave]);

  // Schedule a debounced save
  const scheduleSave = useCallback(() => {
    if (!enabled) return;

    clearTimer();
    timerRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);
  }, [enabled, debounceMs, performSave, clearTimer]);

  // Set draft and schedule save
  const setDraft = useCallback(
    (snapshot: T) => {
      if (!enabled) return;

      // Store in ref (single source of truth)
      draftRef.current = snapshot;
      
      // Increment revision
      revisionRef.current += 1;
      
      // Update status
      if (status !== "dirty" && status !== "saving") {
        setStatus("dirty");
      }

      // If a save is in-flight, mark as pending
      if (inFlightRevisionRef.current !== null) {
        pendingRef.current = true;
      } else {
        scheduleSave();
      }
    },
    [enabled, scheduleSave, status]
  );

  // Get current draft
  const getDraft = useCallback(() => {
    return draftRef.current;
  }, []);

  // Mark as dirty without scheduling save
  const markDirty = useCallback(() => {
    if (status !== "dirty" && status !== "saving") {
      setStatus("dirty");
    }
  }, [status]);

  // Flush immediately (cancel debounce and save now)
  const flushNow = useCallback(async () => {
    clearTimer();
    await performSave();
  }, [clearTimer, performSave]);

  // Retry after error
  const retry = useCallback(async () => {
    if (status === "error") {
      await performSave();
    }
  }, [status, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    status,
    lastSavedAt,
    setDraft,
    getDraft,
    markDirty,
    flushNow,
    retry,
  };
}
