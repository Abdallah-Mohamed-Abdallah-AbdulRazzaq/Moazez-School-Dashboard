import { beforeAll, describe, expect, it, vi } from "vitest";
import arMessages from "@/messages/ar.json";
import enMessages from "@/messages/en.json";

vi.unmock("next-intl");

let createTranslator: typeof import("next-intl").createTranslator;

beforeAll(async () => {
  ({ createTranslator } = await import("next-intl"));
});

describe("campaign email messages", () => {
  it.each([
    ["en", enMessages],
    ["ar", arMessages],
  ])("formats credential safety text for %s without treating template braces as ICU arguments", (locale, messages) => {
    const t = createTranslator({
      locale,
      messages,
      namespace: "settings.email.campaigns",
    });

    expect(() => t("composer.credential_safety")).not.toThrow();
    expect(t("composer.credential_safety")).toContain(
      "{{credential.temporaryPassword}}",
    );
  });
});
