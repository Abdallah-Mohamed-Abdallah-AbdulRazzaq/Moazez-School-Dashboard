import { describe, expect, it } from "vitest";
import AcademicContentOverviewPage from "@/features/academic-content/pages/AcademicContentOverviewPage";
import AcademicContentLibraryPage from "@/features/academic-content/pages/AcademicContentLibraryPage";
import RootRoute from "../page";
import LibraryRoute from "../library/page";

describe("academic content routes", () => {
  it("binds the root route to the overview", () => {
    expect(RootRoute).toBe(AcademicContentOverviewPage);
  });

  it("preserves the existing library on its dedicated route", () => {
    expect(LibraryRoute).toBe(AcademicContentLibraryPage);
  });
});
