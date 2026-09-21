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
});
