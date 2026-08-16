import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import CurriculumActionsMenu from "../CurriculumActionsMenu";

const labels = {
  menu: "Curriculum actions",
  export: "Export",
  activate: "Activate",
  archive: "Archive",
  delete: "Delete",
};

describe("CurriculumActionsMenu", () => {
  const getBoundingClientRect = vi.spyOn(
    HTMLElement.prototype,
    "getBoundingClientRect",
  );

  beforeAll(() => {
    getBoundingClientRect.mockReturnValue(
      DOMRect.fromRect({ x: 1, y: 1, width: 1, height: 1 }),
    );
  });

  afterAll(() => getBoundingClientRect.mockRestore());

  it("shows all curriculum actions and invokes the selected action", () => {
    const onExport = vi.fn();
    render(
      <CurriculumActionsMenu
        labels={labels}
        onExport={onExport}
        onActivate={vi.fn()}
        onArchive={vi.fn()}
        onDelete={vi.fn()}
        canExport
        canActivate
        canArchive
        canDelete
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: labels.menu }));
    expect(screen.getByRole("menuitem", { name: labels.export })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: labels.activate })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: labels.archive })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: labels.delete })).toBeVisible();

    fireEvent.click(screen.getByRole("menuitem", { name: labels.export }));
    expect(onExport).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menuitem", { name: labels.export })).not.toBeInTheDocument();
  });

  it("preserves disabled action states", () => {
    render(
      <CurriculumActionsMenu
        labels={labels}
        onExport={vi.fn()}
        onActivate={vi.fn()}
        onArchive={vi.fn()}
        onDelete={vi.fn()}
        canExport={false}
        canActivate={false}
        canArchive={false}
        canDelete={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: labels.menu }));
    expect(screen.getByRole("menuitem", { name: labels.export })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("menuitem", { name: labels.delete })).toHaveAttribute("aria-disabled", "true");
  });
});
