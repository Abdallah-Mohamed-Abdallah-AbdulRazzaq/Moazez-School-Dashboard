import { describe, expect, it } from "vitest";
import { canCorrectIncidentToEarlyLeave } from "../correctionPermissions";

describe("canCorrectIncidentToEarlyLeave", () => {
  it.each(["ABSENT", "LATE", "EARLY_LEAVE"] as const)(
    "allows %s incidents to be corrected to early leave",
    (status) => {
      expect(canCorrectIncidentToEarlyLeave(status)).toBe(true);
    },
  );

  it.each(["EXCUSED", "UNMARKED"] as const)(
    "does not allow %s incidents to be corrected to early leave",
    (status) => {
      expect(canCorrectIncidentToEarlyLeave(status)).toBe(false);
    },
  );
});
