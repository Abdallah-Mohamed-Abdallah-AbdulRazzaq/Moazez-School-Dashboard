import { describe, expect, it } from "vitest";
import { applicationSourceLabel } from "@/features/admissions/applications/utils/applicationSourceLabel";

const knownLabels = {
  in_app: "In app",
  referral: "Referral",
};

describe("applicationSourceLabel", () => {
  it.each([
    ["in_app", "In app"],
    ["future_portal_source", "Future portal source"],
    [null, "—"],
    ["", "—"],
  ])("renders source %s as %s", (source, expectedLabel) => {
    expect(applicationSourceLabel(source, knownLabels)).toBe(expectedLabel);
  });
});
