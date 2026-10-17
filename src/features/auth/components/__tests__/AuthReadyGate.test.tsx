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
    mockedUseAuth.mockReturnValue({ isLoading: false, isAuthenticated: true } as never);

    render(
      <AuthReadyGate>
        <div>Dashboard shell</div>
      </AuthReadyGate>,
    );

    expect(screen.queryByTestId("main-loader")).not.toBeInTheDocument();
    expect(screen.getByText("Dashboard shell")).toBeInTheDocument();
  });

  it("removes protected children immediately when the user signs out", () => {
    mockedUseAuth.mockReturnValue({ isLoading: false, isAuthenticated: true } as never);
    const { rerender } = render(<AuthReadyGate><div>Private school content</div></AuthReadyGate>);
    expect(screen.getByText("Private school content")).toBeInTheDocument();

    mockedUseAuth.mockReturnValue({ isLoading: false, isAuthenticated: false } as never);
    rerender(<AuthReadyGate><div>Private school content</div></AuthReadyGate>);
    expect(screen.queryByText("Private school content")).not.toBeInTheDocument();
    expect(screen.getByTestId("main-loader")).toBeInTheDocument();
  });
});
