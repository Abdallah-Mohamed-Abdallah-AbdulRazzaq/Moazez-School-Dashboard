import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PreparationTemplateEditorPage from "../PreparationTemplateEditorPage";

const editorState = vi.hoisted(() => ({
  canManage: false,
  getTemplate: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: editorState.push }),
  useSearchParams: () => new URLSearchParams("year=year-1&term=term-1"),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    isPermissionsReady: true,
    hasPermission: (permission: string) =>
      permission === "academics.academic_content.settings.manage" &&
      editorState.canManage,
  }),
}));

vi.mock(
  "@/features/academics/hooks/AcademicYearTermLayoutContext",
  () => ({
    useAcademicYearTermLayoutContext: () => ({
      academicYearId: "year-1",
      termId: "term-1",
    }),
  }),
);

vi.mock("../../services/academicContentSelectors", () => ({
  loadAcademicTargetOptions: vi.fn(() => new Promise(() => {})),
}));

vi.mock("../../services/academicContentApi", () => ({
  getAcademicContentPreparationTemplate: editorState.getTemplate,
  createAcademicContentPreparationTemplate: vi.fn(),
  updateAcademicContentPreparationTemplate: vi.fn(),
  deleteAcademicContentPreparationTemplate: vi.fn(),
  listAcademicContentPreparationTemplates: vi.fn(),
}));

function templateDetail() {
  return {
    id: "template-1",
    name: "Existing template",
    description: null,
    stageId: null,
    subjectId: null,
    topic: null,
    objectives: [],
    learningOutcomes: [],
    teachingStrategies: [],
    activities: [],
    resourceNotes: null,
    assessmentNotes: null,
    teacherNotes: null,
    createdByUserId: "user-1",
    updatedByUserId: null,
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-10-02T08:00:00.000Z",
  };
}

describe("PreparationTemplateEditorPage", () => {
  beforeEach(() => {
    editorState.canManage = false;
    editorState.getTemplate.mockReset().mockResolvedValue(templateDetail());
    editorState.push.mockReset();
  });

  it("does not load template details without settings-manage permission", () => {
    render(<PreparationTemplateEditorPage templateId="template-1" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "academics.academic_content.settings.manage",
    );
    expect(editorState.getTemplate).not.toHaveBeenCalled();
  });

  it("loads the existing template for authorized editors", async () => {
    editorState.canManage = true;
    render(<PreparationTemplateEditorPage templateId="template-1" />);

    expect(await screen.findByDisplayValue("Existing template")).toBeInTheDocument();
    expect(editorState.getTemplate).toHaveBeenCalledWith("template-1");
  });
});
