import { describe, expect, it } from "vitest";
import {
  canPrepareApplicationRegistration,
  canReviewApplicationDocument,
  canSubmitApplication,
} from "../workflow";

describe("application workflow rules", () => {
  it("allows submit only once from documents pending", () => {
    expect(canSubmitApplication("documents_pending", null)).toBe(true);
    expect(canSubmitApplication("documents_pending", "2026-06-30T09:00:00.000Z")).toBe(false);
    expect(canSubmitApplication("submitted", null)).toBe(false);
  });

  it("limits document review and registration to valid states", () => {
    expect(canReviewApplicationDocument("under_review", "pending_review")).toBe(true);
    expect(canReviewApplicationDocument("accepted", "pending_review")).toBe(false);
    expect(canReviewApplicationDocument("under_review", "complete")).toBe(false);
    expect(canPrepareApplicationRegistration("accepted")).toBe(true);
    expect(canPrepareApplicationRegistration("waitlisted")).toBe(false);
  });
});

