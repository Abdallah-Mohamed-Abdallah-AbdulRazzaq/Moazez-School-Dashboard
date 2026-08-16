import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NedaaLayout from "../layout";

vi.mock(
  "@/features/academics/components/layout/AcademicsContextLayout",
  () => ({
    default: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="academics-context">{children}</div>
    ),
  }),
);

describe("NedaaLayout", () => {
  it("wraps Nedaa routes in the shared academics context", () => {
    render(
      <NedaaLayout>
        <div>Nedaa content</div>
      </NedaaLayout>,
    );

    expect(screen.getByTestId("academics-context")).toHaveTextContent(
      "Nedaa content",
    );
  });
});
