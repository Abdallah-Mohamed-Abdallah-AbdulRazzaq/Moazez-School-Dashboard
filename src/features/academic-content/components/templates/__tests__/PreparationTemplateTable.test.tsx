import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PreparationTemplateTable from "../PreparationTemplateTable";
import type { AcademicContentPreparationTemplateListItem } from "../../../types/contracts";
import { academicContentBrowseOptionsFixture } from "../../../__tests__/academicContentBrowseOptionsFixture";

const item: AcademicContentPreparationTemplateListItem = {
  id: "template-1",
  name: "Fractions lesson",
  description: "Reusable preparation",
  stageId: "stage-1",
  subjectId: "subject-1",
  objectivesCount: 2,
  learningOutcomesCount: 3,
  teachingStrategiesCount: 1,
  activitiesCount: 4,
  updatedAt: "2026-10-02T08:00:00.000Z",
};

function renderTable(canManage: boolean, onDelete = vi.fn()) {
  render(
    <PreparationTemplateTable
      items={[item]}
      page={1}
      limit={50}
      total={1}
      isLoading={false}
      searchQuery=""
      targetOptions={academicContentBrowseOptionsFixture.targetOptions}
      canManage={canManage}
      editHref={(templateId) => `/templates/${templateId}/edit`}
      onDelete={onDelete}
      onPageChange={vi.fn()}
      onPageSizeChange={vi.fn()}
    />,
  );
}

describe("PreparationTemplateTable", () => {
  it("shows template metadata without mutation controls for read-only users", () => {
    renderTable(false);

    expect(screen.getByText("Fractions lesson")).toBeInTheDocument();
    expect(screen.getByText("Primary")).toBeInTheDocument();
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
    expect(screen.queryByText("stage-1")).not.toBeInTheDocument();
    expect(screen.queryByText("subject-1")).not.toBeInTheDocument();
    expect(screen.getByText("2 objectives · 3 outcomes")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Edit" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("labels templates without a restricted scope", () => {
    render(
      <PreparationTemplateTable
        items={[
          { ...item, id: "template-global", stageId: null, subjectId: null },
        ]}
        page={1}
        limit={50}
        total={1}
        isLoading={false}
        searchQuery=""
        targetOptions={academicContentBrowseOptionsFixture.targetOptions}
        canManage={false}
        editHref={(templateId) => `/templates/${templateId}/edit`}
        onDelete={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    expect(screen.getByText("All stages")).toBeInTheDocument();
    expect(screen.getByText("All subjects")).toBeInTheDocument();
  });

  it("provides edit and soft-delete actions to template managers", () => {
    const onDelete = vi.fn();
    renderTable(true, onDelete);

    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/templates/template-1/edit",
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith(item);
  });
});
