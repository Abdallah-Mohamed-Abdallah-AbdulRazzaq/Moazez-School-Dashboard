import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../LoginForm";

const mockPush = vi.fn();
const mockLogin = vi.fn();
let mockPathname = "/en/login";
let mockSearchParams = new URLSearchParams();

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt ?? ""} {...props} />
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ login: mockLogin }),
}));

describe("LoginForm Sprint 11 behavior", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockLogin.mockReset();
    mockPathname = "/en/login";
    mockSearchParams = new URLSearchParams();
  });

  it("redirects mustChangePassword users to the change-password route", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ id: "u1", mustChangePassword: true });

    const { container } = render(<LoginForm currentYear={2026} />);

    await user.type(screen.getByRole("textbox"), "user@example.edu");
    await user.type(
      container.querySelector('input[name="password"]') as HTMLInputElement,
      "valid-password",
    );
    await user.click(screen.getByRole("button", { name: "submit" }));

    expect(mockLogin).toHaveBeenCalledWith({
      email: "user@example.edu",
      password: "valid-password",
    });
    expect(mockPush).toHaveBeenCalledWith("/en/change-password");
  });

  it("returns users to a safe next path after login", async () => {
    const user = userEvent.setup();
    mockPathname = "/ar/login";
    mockSearchParams = new URLSearchParams({
      next: "/ar/dashboard/recent-activities",
    });
    mockLogin.mockResolvedValue({
      id: "u1",
      mustChangePassword: false,
      activeMembership: { permissions: ["dashboard.summary.view"] },
    });

    const { container } = render(<LoginForm currentYear={2026} />);

    await user.type(screen.getByRole("textbox"), "user@example.edu");
    await user.type(
      container.querySelector('input[name="password"]') as HTMLInputElement,
      "valid-password",
    );
    await user.click(screen.getByRole("button", { name: "submit" }));

    expect(mockPush).toHaveBeenCalledWith("/ar/dashboard/recent-activities");
  });

  it("supports the legacy redirect parameter after login", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams({
      redirect: "/en/dashboard/recent-activities",
    });
    mockLogin.mockResolvedValue({
      id: "u1",
      mustChangePassword: false,
      activeMembership: { permissions: ["dashboard.summary.view"] },
    });

    const { container } = render(<LoginForm currentYear={2026} />);

    await user.type(screen.getByRole("textbox"), "user@example.edu");
    await user.type(
      container.querySelector('input[name="password"]') as HTMLInputElement,
      "valid-password",
    );
    await user.click(screen.getByRole("button", { name: "submit" }));

    expect(mockPush).toHaveBeenCalledWith("/en/dashboard/recent-activities");
  });

  it("falls back to dashboard when next points outside the active locale", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams({
      next: "//evil.example",
    });
    mockLogin.mockResolvedValue({
      id: "u1",
      mustChangePassword: false,
      activeMembership: { permissions: ["dashboard.summary.view"] },
    });

    const { container } = render(<LoginForm currentYear={2026} />);

    await user.type(screen.getByRole("textbox"), "user@example.edu");
    await user.type(
      container.querySelector('input[name="password"]') as HTMLInputElement,
      "valid-password",
    );
    await user.click(screen.getByRole("button", { name: "submit" }));

    expect(mockPush).toHaveBeenCalledWith("/en/dashboard");
  });

  it("opens the first permitted tab when the dashboard overview is unavailable", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({
      id: "u1",
      mustChangePassword: false,
      activeMembership: { permissions: ["grades.assessments.view"] },
    });

    const { container } = render(<LoginForm currentYear={2026} />);

    await user.type(screen.getByRole("textbox"), "user@example.edu");
    await user.type(
      container.querySelector('input[name="password"]') as HTMLInputElement,
      "valid-password",
    );
    await user.click(screen.getByRole("button", { name: "submit" }));

    expect(mockPush).toHaveBeenCalledWith("/en/grades/assessments");
  });
});
