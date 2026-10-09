import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { academicContentBrowseOptionsFixture } from "../../../__tests__/academicContentBrowseOptionsFixture";
import PreparationTemplateFilters from "../PreparationTemplateFilters";

describe("PreparationTemplateFilters", () => {
  it("uses shared localized stage and subject options", () => {
    const onFiltersChange = vi.fn();
    render(
      <PreparationTemplateFilters
        filters={{
          page: 1,
          limit: 50,
          stageId: "",
          subjectId: "",
          search: "",
        }}
        search=""
        browseOptions={academicContentBrowseOptionsFixture}
        onSearchChange={vi.fn()}
        onFiltersChange={onFiltersChange}
        onClear={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Show template filters" }),
    );
    fireEvent.click(screen.getByLabelText("Stage"));
    fireEvent.click(screen.getByRole("button", { name: "Primary" }));

    expect(onFiltersChange).toHaveBeenCalledWith({ stageId: "stage-1" });
    expect(screen.queryByText("stage-1")).not.toBeInTheDocument();
  });
});
