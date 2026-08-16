import type { ExcuseType } from "../types";

export function shouldLoadExcusePeriods(
  type: ExcuseType,
): boolean {
  return type === "LATE" || type === "EARLY_LEAVE";
}
