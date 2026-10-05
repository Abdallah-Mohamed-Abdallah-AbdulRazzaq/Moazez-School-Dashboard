import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TeacherPreparationsPage from "../TeacherPreparationsPage";

const apiGet = vi.hoisted(() => vi.fn());
const push = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({ apiGet }));
vi.mock("next/navigation", () => ({
  useLocale: () => "en",
  usePathname: () => "/en/academic-content-hub/preparations",
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams("year=year-1&term=term-1"),
}));
vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => ({ academicYearId: "year-1", termId: "term-1" }),
}));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));
vi.mock("@/features/academics/academic-structure-tree/services/structureService", () => ({
  fetchStructureTree: vi.fn().mockResolvedValue({ stages: [], grades: [], sections: [], classrooms: [] }),
}));
vi.mock("@/features/academics/subjects/services/subjectsService", () => ({
  fetchSubjects: vi.fn().mockResolvedValue([]),
  fetchSubjectAllocations: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/features/academics/teacher-allocation/services/teacherAllocationService", () => ({
  fetchTeacherAllocations: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/features/teachers/services/teacherApi", () => ({
  teacherApi: { list: vi.fn().mockResolvedValue({ items: [] }) },
}));

const preparation = {
  id: "content/1",
  academicYearId: "year-1",
  termId: "term-1",
  type: "TEACHER_PREPARATION",
  audience: "INTERNAL_STAFF",
  title: "Fractions",
  description: "Compare fractions",
  status: "DRAFT",
  archivedAt: null,
  createdAt: "2026-10-01T08:00:00.000Z",
  updatedAt: "2026-10-05T08:00:00.000Z",
  summary: { type: "TEACHER_PREPARATION", topic: "Equivalent fractions" },
};

describe("TeacherPreparationsPage", () => {
  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    apiGet.mockReset().mockImplementation((_, options) =>
      Promise.resolve({
        items: options.params.limit === 10 ? [preparation] : [],
        page: 1,
        limit: options.params.limit,
        total: options.params.status ? 1 : 4,
      }),
    );
  });

  it("composes contract-backed counts, filters, and preparation navigation", async () => {
    render(<TeacherPreparationsPage />);

    expect(screen.getByRole("heading", { name: "Teacher Preparations" })).toBeVisible();
    expect(await screen.findAllByText("Fractions")).not.toHaveLength(0);
    expect(screen.getByLabelText("Teacher")).toBeVisible();
    expect(apiGet).toHaveBeenCalledTimes(5);

    fireEvent.click(screen.getAllByRole("button", { name: "Open" })[0]);
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(
        "/en/academic-content-hub/content%2F1?year=year-1&term=term-1",
      ),
    );
  });
});
