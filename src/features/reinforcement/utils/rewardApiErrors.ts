import { isApiError } from "@/lib/api-error";

export interface RewardApiErrorDescriptor {
  messageKey: string;
}

const MESSAGE_KEYS: Record<string, string> = {
  "reinforcement.reward.archived": "rewardsModule.errors.archived",
  "reinforcement.reward.not_published": "rewardsModule.errors.notPublished",
  "reinforcement.reward.out_of_stock": "rewardsModule.errors.outOfStock",
  "reinforcement.reward.insufficient_xp": "rewardsModule.errors.insufficientXp",
  "reinforcement.reward.duplicate_redemption": "rewardsModule.errors.duplicateRedemption",
  "reinforcement.reward.invalid_status_transition": "rewardsModule.errors.invalidTransition",
  "reinforcement.redemption.not_requested": "rewardsModule.errors.notRequested",
  "reinforcement.redemption.not_approved": "rewardsModule.errors.notApproved",
  "reinforcement.redemption.terminal": "rewardsModule.errors.terminal",
  "reinforcement.redemption.invalid_source": "rewardsModule.errors.invalidSource",
};

export function describeRewardApiError(error: unknown): RewardApiErrorDescriptor {
  if (!isApiError(error)) return { messageKey: "common.error" };

  return {
    messageKey: MESSAGE_KEYS[error.code] ?? (
      error.isValidationError()
        ? "rewardsModule.errors.validation"
        : "common.error"
    ),
  };
}
