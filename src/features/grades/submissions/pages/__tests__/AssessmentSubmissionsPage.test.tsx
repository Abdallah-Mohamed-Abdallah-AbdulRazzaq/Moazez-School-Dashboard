import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AssessmentSubmissionsPage from "../AssessmentSubmissionsPage";

const api = vi.hoisted(() => ({ apiGet: vi.fn(), apiPost: vi.fn(), apiPut: vi.fn(), apiPatch: vi.fn() }));
const router = vi.hoisted(() => ({ push: vi.fn() }));
const translate = vi.hoisted(() => (key: string) => key);
const searchParams = vi.hoisted(() => new URLSearchParams("year=year-1&term=term-1"));
vi.mock("@/lib/api", () => api);
vi.mock("next-intl", () => ({ useLocale: () => "en", useTranslations: () => translate }));
vi.mock("next/navigation", () => ({ useRouter: () => router, useSearchParams: () => searchParams, usePathname: () => "/en/grades" }));

const uuid = "123e4567-e89b-42d3-a456-426614174001";
const bootstrap = { grades: [{ id: uuid, nameAr: "الصف", nameEn: "Grade" }], sections: [{ id: "123e4567-e89b-42d3-a456-426614174002", parentId: uuid, nameAr: "الشعبة", nameEn: "Section" }], classrooms: [{ id: "123e4567-e89b-42d3-a456-426614174003", parentId: "123e4567-e89b-42d3-a456-426614174002", nameAr: "الفصل", nameEn: "Classroom" }] };

beforeEach(() => { vi.clearAllMocks(); api.apiGet.mockImplementation((url: string) => url === "/grades/bootstrap" ? Promise.resolve(bootstrap) : Promise.resolve({ items: [] })); });

describe("AssessmentSubmissionsPage", () => {
  it("returns to assessments with the current academic context", async () => {
    const user = userEvent.setup();
    render(<AssessmentSubmissionsPage assessmentId={uuid} />);

    await user.click(screen.getByRole("button", { name: "backToAssessments" }));

    expect(router.push).toHaveBeenCalledWith("/en/grades/assessments?year=year-1&term=term-1");
  });

  it("waits for typing to stop before applying the student search", async () => {
    const user = userEvent.setup();
    render(<AssessmentSubmissionsPage assessmentId={uuid} />);
    await waitFor(() => expect(api.apiGet).toHaveBeenCalledWith(
      `/grades/assessments/${uuid}/submissions`,
      expect.anything(),
    ));
    api.apiGet.mockClear();

    await user.type(screen.getByLabelText("search"), "Adam");
    expect(api.apiGet).not.toHaveBeenCalled();

    await waitFor(() => expect(api.apiGet).toHaveBeenCalledWith(
      `/grades/assessments/${uuid}/submissions`,
      expect.objectContaining({ params: expect.objectContaining({ search: "Adam" }) }),
    ), { timeout: 1_000 });
  });

  it("enables the cascade and sends selected ids", async () => {
    const user = userEvent.setup();
    render(<AssessmentSubmissionsPage assessmentId={uuid} />);
    await user.click(await screen.findByText("allGrades")); await user.click(screen.getByText("Grade"));
    await user.click(screen.getByText("allSections")); await user.click(screen.getByText("Section"));
    await user.click(screen.getByText("allClassrooms")); await user.click(screen.getByText("Classroom"));
    await waitFor(() => expect(api.apiGet).toHaveBeenCalledWith(`/grades/assessments/${uuid}/submissions`, expect.objectContaining({ params: expect.objectContaining({ gradeId: uuid, sectionId: bootstrap.sections[0].id, classroomId: bootstrap.classrooms[0].id }) })));
  });

  it("keeps search, status, and list usable when bootstrap fails", async () => {
    api.apiGet.mockImplementation((url: string) => url === "/grades/bootstrap" ? Promise.reject(new Error("offline")) : Promise.resolve({ items: [] }));
    render(<AssessmentSubmissionsPage assessmentId={uuid} />);
    expect(await screen.findByText("filterOptionsUnavailable")).toBeInTheDocument();
    expect(screen.getByLabelText("search")).toBeInTheDocument();
    expect(api.apiGet).toHaveBeenCalledWith(`/grades/assessments/${uuid}/submissions`, expect.anything());
  });
});
