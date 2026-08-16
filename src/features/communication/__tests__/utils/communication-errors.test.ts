import { describe, it, expect } from "vitest";
import {
  handleConversationError,
  normalizeStatus,
  normalizeRole,
} from "../../utils/communication-errors";
import { conversationRedesignLabels } from "../../conversations_redesign/labels";

const labels = conversationRedesignLabels.en;

describe("normalizeStatus", () => {
  it("converts values to lowercase and defaults to empty string", () => {
    expect(normalizeStatus("Active")).toBe("active");
    expect(normalizeStatus("PENDING")).toBe("pending");
    expect(normalizeStatus(null)).toBe("");
    expect(normalizeStatus(undefined)).toBe("");
    expect(normalizeStatus("")).toBe("");
  });
});

describe("normalizeRole", () => {
  it("converts values to uppercase and defaults to empty string", () => {
    expect(normalizeRole("admin")).toBe("ADMIN");
    expect(normalizeRole("Member")).toBe("MEMBER");
    expect(normalizeRole(null)).toBe("");
    expect(normalizeRole(undefined)).toBe("");
    expect(normalizeRole("")).toBe("");
  });
});

describe("handleConversationError", () => {
  it("correctly resolves a mapped error code to message and action", () => {
    const mockError = {
      response: {
        data: {
          error: {
            code: "communication.policy.disabled"
          }
        }
      }
    };
    const result = handleConversationError(mockError, labels);
    expect(result.code).toBe("communication.policy.disabled");
    expect(result.message).toBe(labels.errorPolicyDisabled);
    expect(result.action).toBe("DISABLE_COMPOSER");
  });

  it("correctly parses validation.failed DTO errors with HTTP 400 status and sets fieldErrors", () => {
    const mockError = {
      response: {
        status: 400,
        data: {
          error: {
            code: "validation.failed",
            details: {
              fields: {
                title: ["must not be empty"],
                description: "exceeds limit"
              }
            }
          }
        }
      }
    };
    const result = handleConversationError(mockError, labels);
    expect(result.code).toBe("validation.failed");
    expect(result.action).toBe("SHOW_FORM_ERROR");
    expect(result.fieldErrors).toEqual({
      title: "must not be empty",
      description: "exceeds limit"
    });
  });

  it("returns details.field and fieldErrors when communication.scope.invalid is returned with field details", () => {
    const mockError = {
      response: {
        status: 422,
        data: {
          error: {
            code: "communication.scope.invalid",
            details: {
              field: "classroomId",
              fields: {
                classroomId: ["invalid selection"]
              }
            }
          }
        }
      }
    };
    const result = handleConversationError(mockError, labels);
    expect(result.code).toBe("communication.scope.invalid");
    expect(result.field).toBe("classroomId");
    expect(result.action).toBe("SHOW_FORM_ERROR");
    expect(result.fieldErrors).toEqual({
      classroomId: "invalid selection"
    });
  });

  it("falls back to generic error message and SHOW_TOAST for unmapped error codes", () => {
    const mockError = {
      response: {
        data: {
          error: {
            code: "some.unmapped.error"
          }
        }
      }
    };
    const result = handleConversationError(mockError, labels);
    expect(result.message).toBe(labels.errorGeneric);
    expect(result.action).toBe("SHOW_TOAST");
  });
});
