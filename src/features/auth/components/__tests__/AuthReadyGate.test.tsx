import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/hooks/use-auth";
import { AuthReadyGate } from "../AuthReadyGate";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/components/ui/loaders/MainLoader", () => ({
  default: () => <div data-testid="main-loader" />,
}));

const mockedUseAuth = vi.mocked(useAuth);

describe("AuthReadyGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the main loader and withholds children while auth is restoring", () => {
    mockedUseAuth.mockReturnValue({ isLoading: true } as never);

    render(
      <AuthReadyGate>
        <div>Dashboard shell</div>
      </AuthReadyGate>,
    );

    expect(screen.getByTestId("main-loader")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard shell")).not.toBeInTheDocument();
  });

  it("renders children after auth restoration completes", () => {
    mockedUseAuth.mockReturnValue({ isLoading: false } as never);

    render(
      <AuthReadyGate>
        <div>Dashboard shell</div>
      </AuthReadyGate>,
    );

    expect(screen.queryByTestId("main-loader")).not.toBeInTheDocument();
    expect(screen.getByText("Dashboard shell")).toBeInTheDocument();
  });
});
