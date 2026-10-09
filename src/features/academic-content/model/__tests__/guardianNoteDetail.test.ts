import { describe, expect, it } from "vitest";
import {
  emptyGuardianNoteDetail,
  isGuardianNoteBodyValid,
  normalizeGuardianNoteDetail,
} from "../guardianNoteDetail";

describe("guardianNoteDetail", () => {
  it("provides backend-compatible defaults", () => {
    expect(emptyGuardianNoteDetail()).toEqual({
      body: "",
      priority: "NORMAL",
      requiresAcknowledgement: false,
    });
  });

  it("normalizes only the message body and preserves delivery settings", () => {
    expect(
      normalizeGuardianNoteDetail({
        body: "  **Bring the workbook**  ",
        priority: "IMPORTANT",
        requiresAcknowledgement: true,
      }),
    ).toEqual({
      body: "**Bring the workbook**",
      priority: "IMPORTANT",
      requiresAcknowledgement: true,
    });
  });

  it.each([
    ["", false],
    ["   ", false],
    ["Guardian message", true],
  ])("validates message body %j", (body, expected) => {
    expect(isGuardianNoteBodyValid(body)).toBe(expected);
  });
});
