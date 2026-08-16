import { describe, expect, it } from "vitest";
import {
  AVAILABLE_POLICY_SCOPE_TYPES,
  isAvailablePolicyScope,
} from "../policyScopes";

describe("available policy scopes", () => {
  it("excludes stage policies from the frontend", () => {
    expect(AVAILABLE_POLICY_SCOPE_TYPES).not.toContain("STAGE");
    expect(isAvailablePolicyScope("STAGE")).toBe(false);
  });
});
