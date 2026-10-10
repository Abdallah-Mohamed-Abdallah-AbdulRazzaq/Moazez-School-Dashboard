import { describe, expect, it, vi } from "vitest";
import AcademicContentLibraryPage from "@/features/academic-content/pages/AcademicContentLibraryPage";
import TeacherPreparationsPage from "@/features/academic-content/pages/TeacherPreparationsPage";
import RootRoute from "../page";
import LibraryRoute from "../library/page";
import PreparationsRoute from "../preparations/page";

vi.mock("next/navigation", () => ({
  redirect: (href: string) => {
    throw new Error(`REDIRECT:${href}`);
  },
}));

describe("academic content routes", () => {
  it.each<[
    string,
    Record<string, string | string[] | undefined>,
    string,
  ]>([
    ["en", {}, "/en/academic-content-hub/library"],
    [
      "ar",
      { year: "year-1", term: "term-1" },
      "/ar/academic-content-hub/library?year=year-1&term=term-1",
    ],
    [
      "en",
      { year: "year-1", term: "term-1", tag: ["one", "two"], q: "a & b", empty: undefined },
      "/en/academic-content-hub/library?year=year-1&term=term-1&tag=one&tag=two&q=a+%26+b",
    ],
  ])(
    "redirects the old %s overview to All Content with its filters",
    async (lang, searchParams, destination) => {
      await expect(
        RootRoute({
          params: Promise.resolve({ lang }),
          searchParams: Promise.resolve(searchParams),
        }),
      ).rejects.toThrow(`REDIRECT:${destination}`);
    },
  );

  it("preserves the existing library on its dedicated route", () => {
    expect(LibraryRoute).toBe(AcademicContentLibraryPage);
  });

  it("binds the dedicated teacher preparations route", () => {
    expect(PreparationsRoute).toBe(TeacherPreparationsPage);
  });
});
