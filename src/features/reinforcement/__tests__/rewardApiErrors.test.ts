import { ApiError } from "@/lib/api-error";
import { describe, expect, it } from "vitest";
import { describeRewardApiError } from "../utils/rewardApiErrors";

describe("describeRewardApiError", () => {
  it.each([
    ["reinforcement.reward.archived", "rewardsModule.errors.archived"],
    ["reinforcement.reward.not_published", "rewardsModule.errors.notPublished"],
    ["reinforcement.reward.out_of_stock", "rewardsModule.errors.outOfStock"],
    ["reinforcement.reward.insufficient_xp", "rewardsModule.errors.insufficientXp"],
    ["reinforcement.reward.duplicate_redemption", "rewardsModule.errors.duplicateRedemption"],
    ["reinforcement.reward.invalid_status_transition", "rewardsModule.errors.invalidTransition"],
    ["reinforcement.redemption.not_requested", "rewardsModule.errors.notRequested"],
    ["reinforcement.redemption.not_approved", "rewardsModule.errors.notApproved"],
    ["reinforcement.redemption.terminal", "rewardsModule.errors.terminal"],
    ["reinforcement.redemption.invalid_source", "rewardsModule.errors.invalidSource"],
  ])("maps %s to localized feedback", (code, messageKey) => {
    expect(describeRewardApiError(new ApiError("Server message", 409, code))).toEqual({ messageKey });
  });

  it("maps validation failures without exposing the server message", () => {
    expect(describeRewardApiError(new ApiError("Validation failed", 400, "validation.failed"))).toEqual({
      messageKey: "rewardsModule.errors.validation",
    });
  });
});
