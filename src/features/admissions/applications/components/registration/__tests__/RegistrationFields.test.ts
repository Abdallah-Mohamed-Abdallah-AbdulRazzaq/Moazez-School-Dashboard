import { describe, expect, it } from "vitest";
import { getLocalizedRegistrationOption } from "../RegistrationFields";

describe("getLocalizedRegistrationOption", () => {
  const namedEntity = {
    id: "grade-1",
    name: "Grade 1",
    nameAr: "الصف الأول",
    nameEn: "First Grade",
  };

  it("uses Arabic names in Arabic locale", () => {
    expect(getLocalizedRegistrationOption(namedEntity, "ar")).toEqual({
      value: "grade-1",
      label: "الصف الأول",
    });
  });

  it("uses English names in English locale", () => {
    expect(getLocalizedRegistrationOption(namedEntity, "en")).toEqual({
      value: "grade-1",
      label: "First Grade",
    });
  });
});
