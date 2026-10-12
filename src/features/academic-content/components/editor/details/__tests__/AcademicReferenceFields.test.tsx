import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  OptionalReferenceSelect,
  ReferenceChecklist,
} from "../AcademicReferenceFields";

describe("AcademicReferenceFields", () => {
  it("hides backend identifiers when saved references are unavailable", () => {
    render(
      <>
        <OptionalReferenceSelect
          label="Curriculum"
          value="curriculum-uuid"
          options={[]}
          disabled={false}
          onChange={vi.fn()}
        />
        <ReferenceChecklist
          label="Homework"
          values={["homework-uuid"]}
          options={[]}
          disabled={false}
          onChange={vi.fn()}
        />
      </>,
    );

    expect(screen.getAllByText("Unavailable reference")).toHaveLength(2);
    expect(screen.queryByText("curriculum-uuid")).not.toBeInTheDocument();
    expect(screen.queryByText("homework-uuid")).not.toBeInTheDocument();
  });

  it("explains when reference options depend on saved academic targets", () => {
    render(
      <OptionalReferenceSelect
        label="Curriculum"
        value={null}
        options={[]}
        disabled={false}
        helperText="Available options depend on the saved academic targets."
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/depend on the saved academic targets/i),
    ).toBeInTheDocument();
  });
});
