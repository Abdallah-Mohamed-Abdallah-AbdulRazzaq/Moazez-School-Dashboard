import { describe, expect, it } from "vitest";
import { targetRoleForTransition } from "@/features/communication/utils/participant-role-transitions";

describe("targetRoleForTransition", () => {
  it.each([
    ["read_only", "promote", "member"],
    ["member", "promote", "moderator"],
    ["moderator", "promote", "admin"],
    ["admin", "promote", "owner"],
    ["owner", "demote", "admin"],
    ["admin", "demote", "moderator"],
    ["moderator", "demote", "member"],
    ["member", "demote", "read_only"],
  ] as const)(
    "allows only %s as the %s target %s",
    (role, action, targetRole) => {
      expect(targetRoleForTransition(role, action)).toBe(targetRole);
    },
  );

  it.each([
    ["owner", "promote"],
    ["read_only", "demote"],
    ["system", "promote"],
    ["system", "demote"],
  ] as const)("has no %s target for %s", (role, action) => {
    expect(targetRoleForTransition(role, action)).toBeNull();
  });
});
