import { describe, expect, it } from "vitest";
import { shouldPollCredentialBatch } from "../useCredentialBatch";

describe("shouldPollCredentialBatch", () => {
  it.each([
    ["pending", true],
    ["processing", true],
    ["completed", false],
    ["partial_failed", false],
    ["failed", false],
  ] as const)("returns %s polling as %s", (status, expected) => {
    expect(shouldPollCredentialBatch({ status })).toBe(expected);
  });
});
