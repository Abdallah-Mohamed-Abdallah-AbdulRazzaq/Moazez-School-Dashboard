import { describe, expect, it } from "vitest";
import { createCommunicationMetadata } from "./communication-metadata";

describe("createCommunicationMetadata", () => {
  it("creates safe communication metadata with context", () => {
    const metadata = createCommunicationMetadata("conversation_create");

    expect(metadata).toEqual(
      expect.objectContaining({
        source: "sis_dashboard",
        clientPlatform: "web",
        uiModule: "communication",
        context: "conversation_create",
      }),
    );
  });

  it("merges safe extra fields and removes undefined values", () => {
    const metadata = createCommunicationMetadata("announcement_create", {
      createdFrom: "announcements_page",
      campaign: undefined,
    });

    expect(metadata).toEqual(
      expect.objectContaining({
        createdFrom: "announcements_page",
      }),
    );
    expect(metadata).not.toHaveProperty("campaign");
  });

  it("strips forbidden sensitive keys from extra metadata", () => {
    const metadata = createCommunicationMetadata("message_send", {
      token: "token-value",
      accessToken: "access-token-value",
      refreshToken: "refresh-token-value",
      password: "password-value",
      secret: "secret-value",
      nationalId: "national-id-value",
      composer: "conversation_thread",
    });

    expect(metadata).toEqual(
      expect.objectContaining({
        composer: "conversation_thread",
      }),
    );
    expect(metadata).not.toHaveProperty("token");
    expect(metadata).not.toHaveProperty("accessToken");
    expect(metadata).not.toHaveProperty("refreshToken");
    expect(metadata).not.toHaveProperty("password");
    expect(metadata).not.toHaveProperty("secret");
    expect(metadata).not.toHaveProperty("nationalId");
  });
});
