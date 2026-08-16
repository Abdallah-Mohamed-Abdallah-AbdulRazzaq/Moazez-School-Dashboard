import { render, screen, waitFor } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api";
import UserMultiSearchSelect from "../UserMultiSearchSelect";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
}));

describe("UserMultiSearchSelect", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the users-endpoint label for a preselected user ID", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        {
          id: "user-1",
          fullName: "Amina Parent",
          loginEmail: "amina@school.test",
          contactEmail: "amina@example.test",
          roleId: "parent-role",
          status: "invited",
        },
      ],
      pagination: { page: 1, limit: 20, total: 1 },
    });

    render(
      <UserMultiSearchSelect
        label="Users"
        value={["user-1"]}
        onChange={vi.fn()}
      />,
    );

    expect(await screen.findByText(/Amina Parent/)).toBeVisible();
    expect(screen.queryByText("user-1")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "remove Amina Parent" }),
    ).toBeInTheDocument();
  });

  it("searches the users endpoint for a handed-off preselected user", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 20, total: 0 },
    });
    const SelectWithInitialQuery = UserMultiSearchSelect as ComponentType<
      React.ComponentProps<typeof UserMultiSearchSelect> & {
        initialQuery?: string;
      }
    >;

    render(
      <SelectWithInitialQuery
        label="Users"
        value={["user-42"]}
        initialQuery="amina@school.test"
        onChange={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith(
        "/settings/users?search=amina%40school.test&page=1&limit=20",
      );
    });
  });
});
