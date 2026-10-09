import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

describe("timetable translations", () => {
  it.each(["room_inactive", "room_capacity_insufficient"] as const)(
    "defines %s in both locales",
    (errorKey) => {
      expect(en.academics.timetable.errors[errorKey]).toEqual(
        expect.any(String),
      );
      expect(ar.academics.timetable.errors[errorKey]).toEqual(
        expect.any(String),
      );
    },
  );

  it("defines the direct-scheduling copy in both locales", () => {
    const englishLibrary = leafMessages(
      en.academics.timetable.schedulingLibrary,
    );
    const arabicLibrary = leafMessages(
      ar.academics.timetable.schedulingLibrary,
    );

    expect(Object.keys(arabicLibrary).sort()).toEqual(
      Object.keys(englishLibrary).sort(),
    );
    Object.keys(englishLibrary).forEach((key) => {
      expect(interpolationVariables(arabicLibrary[key])).toEqual(
        interpolationVariables(englishLibrary[key]),
      );
    });
  });
});

function leafMessages(
  value: Record<string, unknown>,
  prefix = "",
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, child]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof child === "string"
        ? [[path, child]]
        : Object.entries(leafMessages(child as Record<string, unknown>, path));
    }),
  );
}

function interpolationVariables(message: string): string[] {
  return [...message.matchAll(/\{([^},]+)[^}]*\}/g)]
    .map((match) => match[1])
    .sort();
}
