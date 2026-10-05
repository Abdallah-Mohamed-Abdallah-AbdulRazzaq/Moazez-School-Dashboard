import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AcademicContentLibraryItem,
  AcademicContentListResponse,
  ListAcademicContentQuery,
} from "../../types/contracts";
import AcademicContentOverviewPage from "../AcademicContentOverviewPage";

const testState = vi.hoisted(() => ({
  academicYearId: "year-1",
  termId: "term-1",
  canApprove: false,
  push: vi.fn(),
}));
const listAcademicContent = vi.hoisted(() => vi.fn());

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => ({
    academicYearId: testState.academicYearId,
    termId: testState.termId,
  }),
}));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) =>
      permission === "academics.academic_content.approve" && testState.canApprove,
  }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: testState.push }),
}));
vi.mock("../../services/academicContentApi", () => ({ listAcademicContent }));

function content(): AcademicContentLibraryItem {
  return {
    id: "content-1",
    academicYearId: "year-1",
    termId: "term-1",
    type: "TEACHER_PREPARATION",
    audience: "INTERNAL_STAFF",
    title: "Fractions preparation",
    description: null,
    status: "DRAFT",
    archivedAt: null,
    createdAt: "2026-10-05T08:00:00.000Z",
    updatedAt: "2026-10-05T09:00:00.000Z",
    summary: null,
  };
}

function response(
  contentItems: AcademicContentLibraryItem[],
  total = contentItems.length,
): AcademicContentListResponse {
  return { items: contentItems, page: 1, limit: 100, total };
}

describe("AcademicContentOverviewPage", () => {
  beforeEach(() => {
    testState.academicYearId = "year-1";
    testState.termId = "term-1";
    testState.canApprove = false;
    testState.push.mockReset();
    listAcademicContent.mockReset().mockImplementation(
      (query: ListAcademicContentQuery) => {
        if (query.status === "DRAFT") return Promise.resolve(response([content()]));
        if (query.type && query.limit === 1) return Promise.resolve(response([], 1));
        return Promise.resolve(response([]));
      },
    );
  });

  it("composes contract-backed overview resources and context-aware open actions", async () => {
    render(<AcademicContentOverviewPage />);

    expect(screen.getAllByRole("article")).toHaveLength(6);
    fireEvent.click(await screen.findByRole("button", { name: "Open" }));
    expect(testState.push).toHaveBeenCalledWith(
      "/en/academic-content-hub/content-1?year=year-1&term=term-1",
    );
    expect(screen.queryByRole("link", { name: /Review queue/ })).not.toBeInTheDocument();
  });

  it("passes approval permission to quick links", async () => {
    testState.canApprove = true;
    render(<AcademicContentOverviewPage />);

    expect(await screen.findByRole("link", { name: /Review queue/ })).toBeVisible();
  });

  it("renders no overview surface while academic context is incomplete", async () => {
    testState.academicYearId = "";
    testState.termId = "";
    const { container } = render(<AcademicContentOverviewPage />);
    await act(async () => Promise.resolve());

    expect(listAcademicContent).not.toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });
});
