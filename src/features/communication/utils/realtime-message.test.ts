import { describe, expect, it } from "vitest";
import { messageFromRealtimePayload } from "./realtime-message";

describe("messageFromRealtimePayload", () => {
  it("normalizes a nested moderation event without inventing missing fields", () => {
    expect(
      messageFromRealtimePayload({
        conversationId: "conversation-1",
        message: { id: "message-1", status: "HIDDEN" },
      }),
    ).toEqual({
      id: "message-1",
      conversationId: "conversation-1",
      status: "hidden",
    });
  });

  it("preserves an explicitly empty body", () => {
    expect(
      messageFromRealtimePayload({
        id: "message-1",
        content: "",
        status: "sent",
      }),
    ).toMatchObject({ body: "", status: "sent" });
  });

  it("rejects payloads without a message id", () => {
    expect(messageFromRealtimePayload({ status: "deleted" })).toBeNull();
  });
});
