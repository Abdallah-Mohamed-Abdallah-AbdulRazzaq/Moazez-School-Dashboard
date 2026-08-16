/**
 * Smoke tests for render-helpers utility.
 * Verifies that the helper functions produce correct default values
 * and that overrides work as expected.
 */

import { describe, it, expect } from "vitest";
import { createTestUser } from "./render-helpers";

describe("createTestUser", () => {
  it("returns a valid default test user", () => {
    const user = createTestUser();

    expect(user.id).toBe("user-test-001");
    expect(user.email).toBe("test@school.edu");
    expect(user.firstName).toBe("Test");
    expect(user.lastName).toBe("User");
    expect(user.userType).toBe("SCHOOL_USER");
    expect(user.status).toBe("ACTIVE");
    expect(user.activeMembership).not.toBeNull();
    expect(user.activeMembership?.permissions).toContain("communication:read");
  });

  it("allows overriding individual fields", () => {
    const user = createTestUser({
      id: "custom-id",
      firstName: "Custom",
      userType: "TEACHER",
    });

    expect(user.id).toBe("custom-id");
    expect(user.firstName).toBe("Custom");
    expect(user.userType).toBe("TEACHER");
    // Non-overridden fields retain defaults
    expect(user.lastName).toBe("User");
    expect(user.email).toBe("test@school.edu");
  });

  it("allows setting user to unauthenticated state with null membership", () => {
    const user = createTestUser({ activeMembership: null });

    expect(user.activeMembership).toBeNull();
    expect(user.id).toBe("user-test-001");
  });
});
