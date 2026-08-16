import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithPermissions } from "@/__tests__/test-utils/renderWithPermissions";
import Page from "../page";

vi.mock("@/features/nedaa/pages/NedaaOperationsPage", () => ({
  default: () => <div>Nedaa Operations Route</div>,
}));

describe("Nedaa operations route", () => {
  it("renders the operations workspace page", () => {
    renderWithPermissions(<Page />, ["dismissal.requests.view"]);

    expect(screen.getByText("Nedaa Operations Route")).toBeInTheDocument();
  });
});
