import { useCallback, useState } from "react";
import type { TimetableScopeSelection } from "@/features/academics/timetable/services/timetableScope";

const termScope: TimetableScopeSelection = { scopeType: "TERM" };

export function useTimetableConfigurationScope(
  filteredScope: TimetableScopeSelection,
) {
  const [useTermDefault, setUseTermDefault] = useState(false);
  const isTermDefaultConfiguration =
    useTermDefault || filteredScope.scopeType === "TERM";

  const customizeFilteredScope = useCallback(() => {
    setUseTermDefault(false);
  }, []);

  const returnToTermDefault = useCallback(() => {
    setUseTermDefault(true);
  }, []);

  return {
    configurationScope: isTermDefaultConfiguration ? termScope : filteredScope,
    isTermDefaultConfiguration,
    customizeFilteredScope,
    returnToTermDefault,
  };
}
