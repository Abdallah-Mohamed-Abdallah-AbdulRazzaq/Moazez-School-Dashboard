import { useRouter, useSearchParams } from "next/navigation";
import {
  conflictLinkScope,
  conflictLinkParams,
} from "../services/timetableConflictLink";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { TimetableScopeSelection } from "@/features/academics/timetable/services/timetableScope";
import { timetableConfigScopeId } from "../services/timetableScope";

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
    console.warn(
      "Timetable configuration preference could not be saved:",
      error,
    );
  }
  window.dispatchEvent(new Event(preferenceChanged));
}

export function useTimetableConfigurationScope(
  filteredScope: TimetableScopeSelection,
  preferenceContext: {
    userId: string | null;
    schoolId: string;
    termId: string;
    configurationQuery?: string;
  },
) {
  const { userId, schoolId, termId } = preferenceContext;
  const [customScope, setCustomScope] = useState(filteredScope);
  const router = useRouter();
  const searchParams = useSearchParams();
  // Explicit string coercion lets React Compiler preserve the scope memoization.
  const linkKey = `${preferenceContext.configurationQuery ?? searchParams.toString()}`;
  const configurationParams = new URLSearchParams(linkKey);
  const [linkSelection, setLinkSelection] = useState({
    key: linkKey,
    dismissed: false,
  });
  if (linkSelection.key !== linkKey) {
    setLinkSelection({ key: linkKey, dismissed: false });
  }
  const linkedScope = useMemo(
    () => linkSelection.key === linkKey && linkSelection.dismissed
      ? null
      : conflictLinkScope(new URLSearchParams(linkKey)),
    [linkKey, linkSelection.key, linkSelection.dismissed],
  );
  const selectConfigurationScope = (scope: TimetableScopeSelection) => {
    setLinkSelection({ key: linkKey, dismissed: true });
    const params = new URLSearchParams(searchParams.toString());
    conflictLinkParams.forEach((key) => params.delete(key));
    params.delete("configure");
    params.set("workspace", "1");
    params.set("configurationScope", scope.scopeType);
    const scopeId = timetableConfigScopeId(scope);
    if (scopeId) params.set("scopeId", scopeId);
    router.replace(`?${params}`, { scroll: false });
  };
  const storageKey =
    userId && schoolId && termId
      ? `timetable-configuration:${JSON.stringify([userId, schoolId, termId])}`
      : null;
  const useTermDefault = useSyncExternalStore(
    subscribeToPreference,
    () => readTermPreference(storageKey),
    () => false,
  );
  const isTermDefaultConfiguration = linkedScope
    ? linkedScope.scopeType === "TERM"
    : useTermDefault || customScope.scopeType === "TERM";
  const configurationScope =
    linkedScope ?? (isTermDefaultConfiguration ? termScope : customScope);
  useEffect(() => {
    if (
      !preferenceContext.configurationQuery ||
      linkedScope ||
      linkSelection.dismissed
    )
      return;
    const params = new URLSearchParams(preferenceContext.configurationQuery);
    params.set("workspace", "1");
    params.set("configurationScope", configurationScope.scopeType);
    const scopeId = timetableConfigScopeId(configurationScope);
    if (scopeId) params.set("scopeId", scopeId);
    router.replace(`?${params}`, { scroll: false });
  }, [
    configurationScope,
    linkedScope,
    linkSelection.dismissed,
    preferenceContext.configurationQuery,
    router,
  ]);

  const customizeFilteredScope = () => {
    setCustomScope(filteredScope);
    selectConfigurationScope(filteredScope);
    saveConfigurationPreference(storageKey, "scope");
  };

  const returnToTermDefault = () => {
    selectConfigurationScope(termScope);
    saveConfigurationPreference(storageKey, "term");
  };

  return {
    configurationScope,
    linkedConfigurationId: linkedScope
      ? configurationParams.get("configuration")
      : null,
    isTermDefaultConfiguration,
    customizeFilteredScope,
    returnToTermDefault,
  };
}
