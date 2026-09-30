import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CreateAcademicContentPage from "../CreateAcademicContentPage";

const state = vi.hoisted(() => ({
  push: vi.fn(),
  create: vi.fn(),
  termStatus: "open" as "open" | "closed",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: state.push }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) =>
      permission === "academics.academic_content.manage",
    isPermissionsReady: true,
  }),
}));

vi.mock(
  "@/features/academics/hooks/AcademicYearTermLayoutContext",
  () => ({
    useAcademicYearTermLayoutContext: () => ({
      academicYearId: "year-1",
      termId: "term-1",
      termStatus: state.termStatus,
      isInitializing: false,
    }),
  }),
);

vi.mock("../../services/academicContentApi", () => ({
  createAcademicContent: state.create,
}));

function choose(triggerName: string, optionName: string) {
  fireEvent.click(screen.getByRole("button", { name: triggerName }));
  fireEvent.click(screen.getByRole("button", { name: optionName }));
}

describe("CreateAcademicContentPage", () => {
  beforeEach(() => {
    state.push.mockReset();
    state.create.mockReset().mockResolvedValue({ id: "content-1" });
    state.termStatus = "open";
  });

  it("requires a title and enforces backend field limits", async () => {
    render(<CreateAcademicContentPage />);

    expect(screen.getByLabelText("Title")).toHaveAttribute("maxlength", "180");
    expect(screen.getByLabelText("Description")).toHaveAttribute("maxlength", "4000");
    fireEvent.click(screen.getByRole("button", { name: "Create draft" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Title is required");
    expect(state.create).not.toHaveBeenCalled();
  });

  it("updates audience choices when the content type changes", () => {
    render(<CreateAcademicContentPage />);

    expect(screen.getByRole("button", { name: "Content type" })).toHaveTextContent(
      "Teacher preparation",
    );
    expect(screen.getByRole("button", { name: "Audience" })).toHaveTextContent(
      "Internal staff",
    );

    choose("Content type", "Weekly plan");

    expect(screen.getByRole("button", { name: "Audience" })).toHaveTextContent(
      "Students",
    );
  });

  it("creates only the supported six-field payload and redirects with context", async () => {
    render(<CreateAcademicContentPage />);
    choose("Content type", "Weekly plan");
    choose("Audience", "Students and guardians");
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "  Week 1  " },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "  Focus areas  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create draft" }));

    await waitFor(() =>
      expect(state.create).toHaveBeenCalledWith({
        academicYearId: "year-1",
        termId: "term-1",
        type: "WEEKLY_PLAN",
        audience: "STUDENTS_AND_GUARDIANS",
        title: "Week 1",
        description: "Focus areas",
      }),
    );
    expect(state.push).toHaveBeenCalledWith(
      "/en/academic-content-hub/content-1?year=year-1&term=term-1",
    );
  });

  it("disables creation in a closed term", () => {
    state.termStatus = "closed";
    render(<CreateAcademicContentPage />);

    expect(screen.getByRole("button", { name: "Create draft" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("closed term");
  });

  it("shows backend errors without leaving the form", async () => {
    state.create.mockRejectedValue(new Error("Creation failed"));
    render(<CreateAcademicContentPage />);
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Week 1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create draft" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Creation failed");
    expect(state.push).not.toHaveBeenCalled();
  });
});
