import { describe, expect, it } from "vitest";
import AcademicContentOverviewPage from "@/features/academic-content/pages/AcademicContentOverviewPage";
import AcademicContentLibraryPage from "@/features/academic-content/pages/AcademicContentLibraryPage";
import TeacherPreparationsPage from "@/features/academic-content/pages/TeacherPreparationsPage";
import RootRoute from "../page";
import LibraryRoute from "../library/page";
import PreparationsRoute from "../preparations/page";

describe("academic content routes", () => {
  it("binds the root route to the overview", () => {
    expect(RootRoute).toBe(AcademicContentOverviewPage);
  });

  it("preserves the existing library on its dedicated route", () => {
    expect(LibraryRoute).toBe(AcademicContentLibraryPage);
  });

  it("binds the dedicated teacher preparations route", () => {
    expect(PreparationsRoute).toBe(TeacherPreparationsPage);
  });
});
