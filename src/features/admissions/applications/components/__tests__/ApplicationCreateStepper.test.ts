import { describe, expect, it } from "vitest";
import { getLocalizedGradeOption } from "../ApplicationCreateStepper";

describe("getLocalizedGradeOption", () => {
  const grade = {
    id: "grade-1",
    name: "Grade 1",
    nameAr: "الصف الأول",
    nameEn: "First Grade",
  };

  it("shows the Arabic grade name in Arabic locale", () => {
    expect(getLocalizedGradeOption(grade, "ar")).toEqual({
      value: "grade-1",
      label: "الصف الأول",
    });
  });

  it("shows the English grade name in English locale", () => {
    expect(getLocalizedGradeOption(grade, "en")).toEqual({
      value: "grade-1",
      label: "First Grade",
    });
  });
});
