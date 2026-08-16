import { describe, expect, it } from "vitest";
import { getReinforcementProofDownloadUrl } from "../reinforcementFileUrl";

describe("getReinforcementProofDownloadUrl", () => {
  it("uses the authorized Next download route", () => {
    expect(getReinforcementProofDownloadUrl("proof-123")).toBe(
      "/api/files/proof-123/download",
    );
  });

  it("encodes file ids before placing them in the route", () => {
    expect(getReinforcementProofDownloadUrl("proof/123")).toBe(
      "/api/files/proof%2F123/download",
    );
  });
});
