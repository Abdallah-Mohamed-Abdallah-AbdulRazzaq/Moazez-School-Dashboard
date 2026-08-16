import { describe, it, expect } from "vitest";
import { conversationRedesignLabels } from "../conversations_redesign/labels";

describe("conversationRedesignLabels", () => {
  const requiredLabels = [
    "userType_platform_user",
    "userType_organization_user",
    "userType_school_user",
    "userType_teacher",
    "userType_parent",
    "userType_student",
    "userType_guardian",
    "userType_applicant",
    "userType_pickup_delegate",
    "userType_service_account",
  ] as const;

  it("should contain all required userType labels in English", () => {
    requiredLabels.forEach((label) => {
      expect(conversationRedesignLabels.en).toHaveProperty(label);
      expect(typeof conversationRedesignLabels.en[label as keyof typeof conversationRedesignLabels.en]).toBe("string");
    });
  });

  it("should contain all required userType labels in Arabic", () => {
    requiredLabels.forEach((label) => {
      expect(conversationRedesignLabels.ar).toHaveProperty(label);
      expect(typeof conversationRedesignLabels.ar[label as keyof typeof conversationRedesignLabels.ar]).toBe("string");
    });
  });
});

describe("New translation labels", () => {
  it("keeps interaction labels available in both locales", () => {
    const keys = [
      "voiceRecordingUnavailable",
      "filters",
      "clearFilters",
      "newMessage",
      "newMessages",
      "endOfConversation",
    ] as const;

    for (const key of keys) {
      expect(conversationRedesignLabels.en[key]).toBeTruthy();
      expect(conversationRedesignLabels.ar[key]).toBeTruthy();
    }
  });

  it("has all new error and banner keys in both English and Arabic with non-empty strings", () => {
    const keys: (keyof typeof conversationRedesignLabels.en)[] = [
      "errorPolicyDisabled",
      "errorPolicyNotConfigured",
      "errorPolicyInvalid",
      "errorScopeInvalid",
      "errorConversationNotMember",
      "errorConversationArchived",
      "errorConversationClosed",
      "errorConversationInvalidType",
      "errorConversationDirectDuplicate",
      "errorConversationGroupLimitExceeded",
      "errorParticipantAlreadyExists",
      "errorParticipantNotFound",
      "errorParticipantLimitExceeded",
      "errorParticipantRoleForbidden",
      "errorParticipantCannotRemoveOwner",
      "errorParticipantNotActive",
      "errorInviteInvalidStatus",
      "errorInviteDuplicatePending",
      "errorJoinRequestInvalidStatus",
      "errorJoinRequestDuplicatePending",
      "errorMessageEmpty",
      "errorMessageTooLong",
      "errorMessageHidden",
      "errorMessageDeleted",
      "errorMessageNotEditable",
      "errorMessageNotSender",
      "errorMessageSendForbidden",
      "errorMessageKindInvalid",
      "errorAttachmentNotAllowed",
      "errorAttachmentInvalidFile",
      "errorFileUploadSizeExceeded",
      "errorFileUploadMimeNotAllowed",
      "errorFilesNotFound",
      "errorValidationFailed",
      "errorNotFound",
      "errorGeneric",
      "errorReceiptInvalidRecipient",
      "errorReactionDuplicate",
      "errorReportDuplicate",
      "errorReportInvalidStatus",
      "errorModerationForbidden",
      "errorUserBlocked",
      "errorUserRestricted",
      "errorUserRestrictionConflict",
      "bannerArchived",
      "bannerClosed",
      "bannerReadOnly",
      "bannerMuted",
      "bannerReadOnlyParticipant"
    ];
    for (const key of keys) {
      expect(typeof conversationRedesignLabels.en[key]).toBe("string");
      expect(conversationRedesignLabels.en[key].trim().length).toBeGreaterThan(0);
      expect(typeof conversationRedesignLabels.ar[key]).toBe("string");
      expect(conversationRedesignLabels.ar[key].trim().length).toBeGreaterThan(0);
    }
  });
});
