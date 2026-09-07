import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import StructureTree, { type StructureView } from "../StructureTree";
import type {
  Classroom,
  Grade,
  Section,
  Stage,
} from "../../services/structureService";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

const stages: Stage[] = [
  {
    id: "stage-1",
    name: "Primary",
    nameAr: "ابتدائي",
    nameEn: "Primary",
    order: 1,
  },
];
const grades: Grade[] = [
  {
    id: "grade-1",
    name: "Grade 1",
    nameAr: "الصف الأول",
    nameEn: "Grade 1",
    stageId: "stage-1",
    capacity: 30,
    order: 1,
  },
];
const sections: Section[] = [
  {
    id: "section-1",
    name: "Section A",
    nameAr: "شعبة أ",
    nameEn: "Section A",
    gradeId: "grade-1",
    capacity: 30,
    order: 1,
  },
  {
    id: "section-2",
    name: "Section B",
    nameAr: "شعبة ب",
    nameEn: "Section B",
    gradeId: "grade-1",
    capacity: 30,
    order: 2,
  },
];
const classrooms: Classroom[] = [
  {
    id: "classroom-1",
    name: "Classroom A",
    nameAr: "فصل أ",
    nameEn: "Classroom A",
    sectionId: "section-1",
    capacity: 30,
    order: 1,
  },
];

interface ExpansionState {
  stages: Set<string>;
  grades: Set<string>;
  sections: Set<string>;
}

const collapsedExpansionState: ExpansionState = {
  stages: new Set(),
  grades: new Set(),
  sections: new Set(),
};

interface RenderStructureTreeOptions {
  expansionState: ExpansionState;
  view?: StructureView;
  selectedNode?: {
    type: "stage" | "grade" | "section" | "classroom";
    id: string;
  } | null;
}

function renderStructureTree({
  expansionState,
  view = "tree",
  selectedNode = null,
}: RenderStructureTreeOptions) {
  const expansionCallbacks = {
    onExpandedStagesChange: vi.fn(),
    onExpandedGradesChange: vi.fn(),
    onExpandedSectionsChange: vi.fn(),
    onExpandedBranchesChange: vi.fn(),
  };
  const onViewChange = vi.fn();
  const onSelectNode = vi.fn();
  const onClearSelection = vi.fn();

  render(
    <StructureTree
      stages={stages}
      grades={grades}
      sections={sections}
      classrooms={classrooms}
      searchQuery=""
      onSearchQueryChange={vi.fn()}
      view={view}
      onViewChange={onViewChange}
      onClearSelection={onClearSelection}
      expandedStages={expansionState.stages}
      expandedGrades={expansionState.grades}
      expandedSections={expansionState.sections}
      {...expansionCallbacks}
      selectedNode={selectedNode}
      onSelectNode={onSelectNode}
      onAddStage={vi.fn()}
      onAddGrade={vi.fn()}
      onAddSection={vi.fn()}
      onAddClassroom={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onReorderStage={vi.fn()}
      onReorderGrade={vi.fn()}
      onReorderSection={vi.fn()}
      onReorderClassroom={vi.fn()}
      onDragReorder={vi.fn()}
      onDragReorderGrade={vi.fn()}
      onDragReorderSection={vi.fn()}
      onDragReorderClassroom={vi.fn()}
    />,
  );

  return {
    ...expansionCallbacks,
    onViewChange,
    onSelectNode,
    onClearSelection,
  };
}

describe("StructureTree", () => {
  it("expands every visible hierarchy level in one action", async () => {
    const user = userEvent.setup();
    const expansionCallbacks = renderStructureTree({
      expansionState: collapsedExpansionState,
    });

    await user.click(screen.getByRole("button", { name: "tree.expand_all" }));

    expect(expansionCallbacks.onExpandedBranchesChange).toHaveBeenCalledWith({
      stages: new Set(["stage-1"]),
      grades: new Set(["grade-1"]),
      sections: new Set(["section-1", "section-2"]),
    });
  });

  it("collapses every expanded hierarchy level in one action", async () => {
    const user = userEvent.setup();
    const expansionCallbacks = renderStructureTree({
      expansionState: {
        stages: new Set(["stage-1"]),
        grades: new Set(["grade-1"]),
        sections: new Set(["section-1"]),
      },
    });

    await user.click(screen.getByRole("button", { name: "tree.collapse_all" }));

    expect(expansionCallbacks.onExpandedBranchesChange).toHaveBeenCalledWith({
      stages: new Set(),
      grades: new Set(),
      sections: new Set(),
    });
  });

  it("marks sections without classrooms in the tree view", () => {
    renderStructureTree({
      expansionState: {
        stages: new Set(["stage-1"]),
        grades: new Set(["grade-1"]),
        sections: new Set(),
      },
    });

    expect(
      screen.getByLabelText("tree.views.validation.no_classrooms"),
    ).toBeInTheDocument();
  });

  it("explains how to reach classrooms in the tree view", () => {
    renderStructureTree({
      expansionState: collapsedExpansionState,
    });

    expect(screen.getByText("tree.views.hints.tree")).toBeInTheDocument();
  });

  it("lets the user switch from the tree to the list view", async () => {
    const user = userEvent.setup();
    const { onViewChange } = renderStructureTree({
      expansionState: collapsedExpansionState,
    });

    await user.click(screen.getByRole("tab", { name: "tree.views.list" }));

    expect(onViewChange).toHaveBeenCalledWith("list");
  });

  it("starts the drill-down view with stages", async () => {
    const user = userEvent.setup();
    const { onSelectNode } = renderStructureTree({
      expansionState: collapsedExpansionState,
      view: "list",
    });

    expect(screen.getByText("Primary")).toBeInTheDocument();
    expect(screen.queryByText("Grade 1")).not.toBeInTheDocument();
    expect(screen.getByText("tree.views.hints.stages")).toBeInTheDocument();

    await user.click(screen.getByText("Primary"));
    expect(onSelectNode).toHaveBeenCalledWith({ type: "stage", id: "stage-1" });
  });

  it("shows the next hierarchy level for the selected parent", () => {
    renderStructureTree({
      expansionState: collapsedExpansionState,
      view: "list",
      selectedNode: { type: "grade", id: "grade-1" },
    });

    expect(screen.getByText("Section A")).toBeInTheDocument();
    expect(screen.getByText("Section B")).toBeInTheDocument();
    expect(screen.queryByText("Classroom A")).not.toBeInTheDocument();
    expect(
      screen.getByText("tree.views.validation.sections_without_classrooms"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("tree.views.validation.no_classrooms"),
    ).toBeInTheDocument();
  });

  it("opens classrooms from a section and returns to its grade", async () => {
    const user = userEvent.setup();
    const { onSelectNode } = renderStructureTree({
      expansionState: collapsedExpansionState,
      view: "list",
      selectedNode: { type: "section", id: "section-1" },
    });

    expect(screen.getByText("Classroom A")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "tree.views.back" }),
    );
    expect(onSelectNode).toHaveBeenCalledWith({ type: "grade", id: "grade-1" });
  });
});
