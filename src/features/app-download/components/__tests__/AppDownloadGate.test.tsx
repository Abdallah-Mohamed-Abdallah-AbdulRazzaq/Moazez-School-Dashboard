import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppDownloadGate } from "../AppDownloadGate";

const authMocks = vi.hoisted(() => ({
  auth: { isLoading: false, user: null as unknown, logout: vi.fn() },
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => authMocks.auth,
}));

function makeUser(userType: string, roleKey = "school.admin") {
  return { userType, activeMembership: { roleKey } };
}

describe("AppDownloadGate", () => {
  it("replaces dashboard children for a parent", () => {
    authMocks.auth = { isLoading: false, user: makeUser("PARENT") };

    render(
      <AppDownloadGate>
        <div>Dashboard content</div>
      </AppDownloadGate>,
    );

    expect(screen.getByRole("heading", { name: "title" })).toBeInTheDocument();
    expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();
  });

  it("passes dashboard children through for a school admin", () => {
    authMocks.auth = { isLoading: false, user: makeUser("SCHOOL_USER") };

    render(
      <AppDownloadGate>
        <div>Dashboard content</div>
      </AppDownloadGate>,
    );

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  });
});
