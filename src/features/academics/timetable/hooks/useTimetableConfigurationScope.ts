import { useCallback, useSyncExternalStore } from "react";
import type { TimetableScopeSelection } from "@/features/academics/timetable/services/timetableScope";

const termScope: TimetableScopeSelection = { scopeType: "TERM" };
const preferenceChanged = "timetable-configuration-preference-changed";
const sessionPreferences = new Map<string, boolean>();

function subscribeToPreference(onChange: () => void) {
  const onStorageChange = (event: StorageEvent) => {
    if (event.key) sessionPreferences.delete(event.key);
    else sessionPreferences.clear();
    onChange();
  };
  window.addEventListener("storage", onStorageChange);
  window.addEventListener(preferenceChanged, onChange);
  return () => {
    window.removeEventListener("storage", onStorageChange);
    window.removeEventListener(preferenceChanged, onChange);
  };
}

// If browser storage is blocked, keep the choice for this session only.
function readTermPreference(storageKey: string | null): boolean {
  if (!storageKey) return false;
  const sessionPreference = sessionPreferences.get(storageKey);
  if (sessionPreference !== undefined) return sessionPreference;
  try {
    return window.localStorage.getItem(storageKey) === "term";
  } catch (error) {
    if (!(error instanceof DOMException)) throw error;
    return false;
  }
}

function saveConfigurationPreference(
  storageKey: string | null,
  mode: "term" | "scope",
) {
  if (!storageKey) return;
  try {
    window.localStorage.setItem(storageKey, mode);
    sessionPreferences.delete(storageKey);
  } catch (error) {
    if (!(error instanceof DOMException)) throw error;
    sessionPreferences.set(storageKey, mode === "term");
    console.warn("Timetable configuration preference could not be saved:", error);
  }
  window.dispatchEvent(new Event(preferenceChanged));
}

export function useTimetableConfigurationScope(
  filteredScope: TimetableScopeSelection,
  preferenceContext: { userId: string | null; schoolId: string; termId: string },
) {
  const { userId, schoolId, termId } = preferenceContext;
  const storageKey =
    userId && schoolId && termId
      ? `timetable-configuration:${JSON.stringify([userId, schoolId, termId])}`
      : null;
  const useTermDefault = useSyncExternalStore(
    subscribeToPreference,
    () => readTermPreference(storageKey),
    () => false,
  );
  const isTermDefaultConfiguration =
    useTermDefault || filteredScope.scopeType === "TERM";

  const customizeFilteredScope = useCallback(() => {
    saveConfigurationPreference(storageKey, "scope");
  }, [storageKey]);

  const returnToTermDefault = useCallback(() => {
    saveConfigurationPreference(storageKey, "term");
  }, [storageKey]);

  return {
    configurationScope: isTermDefaultConfiguration ? termScope : filteredScope,
    isTermDefaultConfiguration,
    configurationMode: useTermDefault ? ("term" as const) : ("scope" as const),
    customizeFilteredScope,
    returnToTermDefault,
  };
}
