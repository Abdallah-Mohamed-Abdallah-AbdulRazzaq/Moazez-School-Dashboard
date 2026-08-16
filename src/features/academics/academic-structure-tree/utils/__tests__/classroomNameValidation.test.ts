import { describe, expect, it } from "vitest";

import { getClassroomNameWhitespaceErrors } from "../classroomNameValidation";

describe("getClassroomNameWhitespaceErrors", () => {
  const message = "Classroom names cannot contain whitespace";

  it.each([
    ["فصل أ", "Class-A", { ar: message }],
    ["فصل-أ", "Class A", { en: message }],
    ["فصل\tأ", "Class-A", { ar: message }],
    ["فصل-أ", "Class\nA", { en: message }],
  ])("rejects whitespace in either classroom name", (nameAr, nameEn, expected) => {
    expect(
      getClassroomNameWhitespaceErrors("classroom", nameAr, nameEn, message),
    ).toEqual(expected);
  });

  it("allows classroom names without whitespace, including hyphens", () => {
    expect(
      getClassroomNameWhitespaceErrors("classroom", "فصل-أ", "Class-A", message),
    ).toEqual({});
  });

  it.each(["stage", "grade", "section"] as const)(
    "does not apply to %s names",
    (type) => {
      expect(
        getClassroomNameWhitespaceErrors(
          type,
          "اسم به مسافة",
          "Name With Space",
          message,
        ),
      ).toEqual({});
    },
  );
});
