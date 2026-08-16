import { describe, expect, it } from "vitest";
import {
  fingerprintCanonicalPayload,
  normalizeStringSet,
} from "@/features/settings/email/shared/previewFingerprint";

describe("preview fingerprint helpers", () => {
  it("sorts, trims, removes blanks, and deduplicates set-like values", () => {
    expect(normalizeStringSet([" user-2 ", "user-1", "", "user-2"])).toEqual([
      "user-1",
      "user-2",
    ]);
  });

  it("produces equal fingerprints for equivalent canonical payloads", () => {
    const payload = { scope: "selected", userIds: ["a", "b"] };
    expect(fingerprintCanonicalPayload(payload)).toBe(
      fingerprintCanonicalPayload(payload),
    );
  });
});
