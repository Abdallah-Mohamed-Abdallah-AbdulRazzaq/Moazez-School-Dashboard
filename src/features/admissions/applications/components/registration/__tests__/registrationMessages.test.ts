import { describe, expect, it } from "vitest";
import { translateRegistrationMessage } from "../ApplicationRegistrationWizard";

describe("translateRegistrationMessage", () => {
  const translate = (key: string) => key;

  it("maps backend guardian and enrollment codes to localized validation keys", () => {
    expect(translateRegistrationMessage("guardian[0].profile.full_name", translate))
      .toBe("validation.guardian_name_required");
    expect(translateRegistrationMessage("enrollment.classroomId_required", translate))
      .toBe("validation.classroom_required");
  });

  it("uses a friendly fallback for unknown backend codes", () => {
    expect(translateRegistrationMessage("unknown.backend_code", translate))
      .toBe("validation.registration_incomplete");
  });
});
