import { render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReinforcementLayout from "@/app/[lang]/(dashboard)/reinforcement/layout";
import { useReinforcementAcademicContext } from "../hooks/useReinforcementAcademicContext";

const contextState = vi.hoisted(() => ({
  selectedAcademicYear: { id: "year-1", name: "2026/2027" },
  selectedTerm: { id: "term-1", name: "Term 1" },
}));

vi.mock("@/features/academics/components/layout/AcademicsContextLayout", () => ({
  default: ({
    children,
    contextOptions,
  }: {
    children: React.ReactNode;
    contextOptions?: { yearParamKey?: string; termParamKey?: string };
  }) => (
    <div
      data-testid="reinforcement-context"
      data-year-key={contextOptions?.yearParamKey}
      data-term-key={contextOptions?.termParamKey}
    >
      {children}
    </div>
  ),
}));

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => contextState,
}));

describe("reinforcement academic layout", () => {
  it("uses the backend academic query parameter names", () => {
    render(
      <ReinforcementLayout>
        <span>Content</span>
      </ReinforcementLayout>,
    );

    expect(screen.getByTestId("reinforcement-context")).toHaveAttribute(
      "data-year-key",
      "academicYearId",
    );
    expect(screen.getByTestId("reinforcement-context")).toHaveAttribute(
      "data-term-key",
      "termId",
    );
  });

  it("reuses the layout-selected academic context", () => {
    const { result } = renderHook(() => useReinforcementAcademicContext());

    expect(result.current).toEqual(contextState);
  });
});
