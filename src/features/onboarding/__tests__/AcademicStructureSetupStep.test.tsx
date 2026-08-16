import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createClassroom,
  createGrade,
  createSection,
  createStage,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { AcademicStructureSetupStep } from "../components/steps/AcademicStructureSetupStep";

vi.mock("@/features/academics/academic-structure-tree/services/structureService", () => ({
  createStage: vi.fn(),
  createGrade: vi.fn(),
  createSection: vi.fn(),
  createClassroom: vi.fn(),
}));

const stage = { id: "stage-1", name: "Primary", nameAr: "ابتدائي", nameEn: "Primary", order: 1 };
const grade = {
  id: "grade-1",
  name: "Grade 1",
  nameAr: "الأول",
  nameEn: "Grade 1",
  stageId: stage.id,
  capacity: 30,
  order: 1,
};
const section = {
  id: "section-1",
  name: "A",
  nameAr: "أ",
  nameEn: "A",
  gradeId: grade.id,
  capacity: 30,
  order: 1,
};
const classroom = {
  id: "classroom-1",
  name: "Room 101",
  nameAr: "غرفة 101",
  nameEn: "Room 101",
  sectionId: section.id,
  capacity: 30,
  order: 1,
};

const emptyTree = { stages: [], grades: [], sections: [], classrooms: [] };

const copy = {
  summary: "Create the first stage, grade, and section.",
  stageTitle: "Create stage",
  gradeTitle: "Create grade",
  sectionTitle: "Create section",
  classroomTitle: "Create classroom",
  nameAr: "Arabic name",
  nameEn: "English name",
  save: "Create",
  saving: "Creating",
  required: "Both names are required",
  saveFailed: "Could not create structure item",
  stageCreated: "Stage created. Now add its first grade.",
  gradeCreated: "Grade created. Now add its first section.",
  sectionCreated: "Section created. Now add its first classroom.",
  classroomCreated: "Classroom created. Your academic structure is ready.",
  complete: "Academic structure has the minimum required chain, including a classroom.",
  progressLabel: "Structure progress",
  progressText: (completed: number, total: number) => `${completed} of ${total} complete`,
  stage: "Stage",
  grade: "Grade",
  section: "Section",
  classroom: "Classroom",
  done: "Done",
  remaining: "Remaining",
};

describe("AcademicStructureSetupStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates the next missing stage, grade, section, then classroom using refreshed IDs", async () => {
    const user = userEvent.setup();
    const refreshStep = vi.fn();
    vi.mocked(createStage).mockResolvedValue(stage);
    vi.mocked(createGrade).mockResolvedValue(grade);
    vi.mocked(createSection).mockResolvedValue(section);
    vi.mocked(createClassroom).mockResolvedValue(classroom);

    const { rerender } = render(
      <AcademicStructureSetupStep
        copy={copy}
        refreshStep={refreshStep}
        termId="term-1"
        tree={emptyTree}
        yearId="year-1"
      />,
    );

    expect(screen.getByRole("heading", { name: "Create stage" })).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "Structure progress" })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    expect(screen.getByText("Stage").parentElement).toHaveTextContent("Remaining");
    await user.type(screen.getByRole("textbox", { name: "Arabic name" }), "ابتدائي");
    await user.type(screen.getByRole("textbox", { name: "English name" }), "Primary");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(createStage).toHaveBeenCalledWith("year-1", "term-1", {
      name: "Primary",
      nameAr: "ابتدائي",
      nameEn: "Primary",
      order: 1,
    });
    await waitFor(() => expect(refreshStep).toHaveBeenCalledWith("structure"));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Stage created. Now add its first grade.",
    );

    rerender(
      <AcademicStructureSetupStep
        copy={copy}
        refreshStep={refreshStep}
        termId="term-1"
        tree={{ ...emptyTree, stages: [stage] }}
        yearId="year-1"
      />,
    );

    expect(screen.getByRole("heading", { name: "Create grade" })).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "Structure progress" })).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
    expect(screen.getByText("Stage").parentElement).toHaveTextContent("Done");
    expect(screen.getByText("Grade").parentElement).toHaveTextContent("Remaining");
    await user.type(screen.getByRole("textbox", { name: "Arabic name" }), "الأول");
    await user.type(screen.getByRole("textbox", { name: "English name" }), "Grade 1");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(createGrade).toHaveBeenCalledWith("year-1", "term-1", {
      name: "Grade 1",
      nameAr: "الأول",
      nameEn: "Grade 1",
      stageId: stage.id,
      capacity: 30,
      order: 1,
    });

    rerender(
      <AcademicStructureSetupStep
        copy={copy}
        refreshStep={refreshStep}
        termId="term-1"
        tree={{ ...emptyTree, stages: [stage], grades: [grade] }}
        yearId="year-1"
      />,
    );

    expect(screen.getByRole("heading", { name: "Create section" })).toBeVisible();
    await user.type(screen.getByRole("textbox", { name: "Arabic name" }), "أ");
    await user.type(screen.getByRole("textbox", { name: "English name" }), "A");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(createSection).toHaveBeenCalledWith("year-1", "term-1", {
      name: "A",
      nameAr: "أ",
      nameEn: "A",
      gradeId: grade.id,
      capacity: 30,
      order: 1,
    });
    rerender(
      <AcademicStructureSetupStep
        copy={copy}
        refreshStep={refreshStep}
        termId="term-1"
        tree={{ ...emptyTree, stages: [stage], grades: [grade], sections: [section] }}
        yearId="year-1"
      />,
    );

    expect(screen.getByRole("heading", { name: "Create classroom" })).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "Structure progress" })).toHaveAttribute(
      "aria-valuenow",
      "3",
    );
    await user.type(screen.getByRole("textbox", { name: "Arabic name" }), "غرفة 101");
    await user.type(screen.getByRole("textbox", { name: "English name" }), "Room 101");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(createClassroom).toHaveBeenCalledWith("year-1", "term-1", {
      name: "Room 101",
      nameAr: "غرفة 101",
      nameEn: "Room 101",
      sectionId: section.id,
      capacity: 30,
      order: 1,
    });
  });

  it("preserves field values after a failed request", async () => {
    const user = userEvent.setup();
    vi.mocked(createStage).mockRejectedValue(new Error("failed"));

    render(
      <AcademicStructureSetupStep
        copy={copy}
        refreshStep={vi.fn()}
        termId="term-1"
        tree={emptyTree}
        yearId="year-1"
      />,
    );

    await user.type(screen.getByRole("textbox", { name: "Arabic name" }), "ابتدائي");
    await user.type(screen.getByRole("textbox", { name: "English name" }), "Primary");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Could not create structure item")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Arabic name" })).toHaveValue("ابتدائي");
    expect(screen.getByRole("textbox", { name: "English name" })).toHaveValue("Primary");
  });
});
