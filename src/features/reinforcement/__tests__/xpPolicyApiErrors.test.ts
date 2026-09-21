import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { describeXpPolicyApiError } from "../utils/xpPolicyApiErrors";

describe("XP policy API errors", () => {
  it.each([
    [
      new ApiError("Active policy exists", 409, "reinforcement.policy.conflict"),
      { messageKey: "xp.validation.policyConflict" },
    ],
    [
      new ApiError("Weekly cap is invalid", 400, "validation.failed", undefined, {
        dailyCap: 20,
        weeklyCap: 10,
      }),
      { field: "caps", messageKey: "xp.validation.invalidCaps" },
    ],
    [
      new ApiError("Date range is invalid", 400, "validation.failed", undefined, {
        startsAt: "2026-12-31",
        endsAt: "2026-09-06",
      }),
      { field: "dates", messageKey: "xp.invalidDateRange" },
    ],
  ])("maps %s to actionable policy feedback", (error, expected) => {
    expect(describeXpPolicyApiError(error)).toMatchObject(expected);
  });
});
