import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import { createCurriculum } from "../../services/curriculumService";
import CreateCurriculumDialog from "../CreateCurriculumDialog";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/ui/modal/Modal", () => ({
  default: ({
    children,
    footer,
    isOpen,
  }: {
    children: React.ReactNode;
    footer: React.ReactNode;
    isOpen: boolean;
  }) => (isOpen ? <div>{children}{footer}</div> : null),
}));

vi.mock("../../services/curriculumService", () => ({
  createCurriculum: vi.fn(),
}));

describe("CreateCurriculumDialog", () => {
  it("shows backend field errors inline and unmatched errors at form level", async () => {
    const user = userEvent.setup();
    vi.mocked(createCurriculum).mockRejectedValueOnce(
      new ApiError(
        "Validation failed",
        422,
        "validation.failed",
        {
          title: ["Title already exists"],
          academicYearId: ["Academic year is closed"],
        },
      ),
    );

    render(
      <CreateCurriculumDialog
        isOpen
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        academicYearId="year-1"
        termId="term-1"
        gradeId="grade-1"
        subjectId="subject-1"
        gradeName="Grade 1"
        subjectName="Math"
      />,
    );

    const titleInput = screen.getByLabelText(/name/);
    await user.type(titleInput, "My curriculum");
    await user.click(screen.getByRole("button", { name: "create" }));

    expect(await screen.findByText("Title already exists")).toBeInTheDocument();
    expect(screen.getByText("Academic year is closed")).toBeInTheDocument();
    expect(screen.getByDisplayValue("My curriculum")).toBeInTheDocument();

    await user.clear(titleInput);
    await user.type(titleInput, "Replacement");

    expect(screen.queryByText("Title already exists")).not.toBeInTheDocument();
    expect(screen.getByText("Academic year is closed")).toBeInTheDocument();
  });
});
