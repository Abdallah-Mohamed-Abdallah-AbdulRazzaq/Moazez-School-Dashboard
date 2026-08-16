import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement, type PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";
import Sidebar from "../Sidebar";
import {
  filterMenuItems,
  groupMenuChildren,
  menuItems,
} from "@/config/navigation";

const navigationState = vi.hoisted(() => ({
  pathname: "/en/dashboard",
  grantedPermissions: null as Set<string> | null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/usePermissions", async (importOriginal) => {
  const permissions = await importOriginal<typeof import("@/hooks/usePermissions")>();

  return {
    ...permissions,
    usePermissions: () => ({
      hasPermission: (permission: string) =>
        navigationState.grantedPermissions?.has(permission) ?? true,
    }),
  };
});

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ logout: vi.fn() }),
}));

vi.mock("@/components/navigation/GuardedLink", () => ({
  default: (props: PropsWithChildren<Record<string, unknown>>) => {
    const { children, ...linkProps } = props;
    delete linkProps.onNavigationStart;
    delete linkProps.prefetch;
    return createElement("a", linkProps, children);
  },
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { priority, ...imageProps } = props;
    void priority;
    return createElement("img", { alt: "", ...imageProps });
  },
}));

describe("Sidebar toggle control", () => {
  it("shows System Health without a membership permission", () => {
    navigationState.grantedPermissions = new Set();

    try {
      render(<Sidebar isOpen onToggle={vi.fn()} />);

      expect(screen.getByRole("link", { name: "System Health" })).toBeInTheDocument();
    } finally {
      navigationState.grantedPermissions = null;
    }
  });

  it("shows only the grade destinations granted by the backend membership", () => {
    navigationState.grantedPermissions = new Set(["grades.assessments.view"]);

    try {
      render(<Sidebar isOpen onToggle={vi.fn()} />);

      fireEvent.click(
        screen.getByRole("button", { name: "Assessments & Grades" }),
      );

      expect(screen.getByText("Assessments")).toBeInTheDocument();
      expect(screen.queryByText("Gradebook")).not.toBeInTheDocument();
    } finally {
      navigationState.grantedPermissions = null;
    }
  });

  it("links the logo to the localized dashboard", () => {
    navigationState.pathname = "/ar/settings/users";

    try {
      render(<Sidebar isOpen onToggle={vi.fn()} />);

      expect(screen.getByRole("link", { name: "Logo" })).toHaveAttribute(
        "href",
        "/ar/dashboard",
      );
    } finally {
      navigationState.pathname = "/en/dashboard";
    }
  });

  it("filters top-level and child navigation labels", () => {
    const topLevelMatches = filterMenuItems(menuItems, "dash", false);
    const childMatches = filterMenuItems(menuItems, "application", false);

    expect(topLevelMatches.map((item) => item.key)).toEqual(["dashboard"]);
    expect(childMatches.map((item) => item.key)).toEqual([
      "admissions-registration",
    ]);
    expect(childMatches[0].children?.map((child) => child.key)).toContain(
      "admissions-applications",
    );
    expect(childMatches[0].children?.map((child) => child.key)).not.toContain(
      "admissions-leads",
    );
  });

  it("renders subgroup headings above related links", () => {
    render(<Sidebar isOpen onToggle={vi.fn()} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Admissions & Registration" }),
    );

    expect(screen.getByText("Application Pipeline")).toBeInTheDocument();
    expect(screen.getByText("Enrollment", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("Applications")).toBeInTheDocument();
  });

  it("omits subgroup headings when permission filtering removes every child", () => {
    const admissions = menuItems.find(
      (item) => item.key === "admissions-registration",
    );
    const visibleChildren = admissions!.children!.filter(
      (child) => child.subgroup !== "pipeline",
    );

    const groups = groupMenuChildren(admissions!, visibleChildren);

    expect(groups.map(({ subgroup }) => subgroup.key)).toEqual(["enrollment"]);
  });

  it("filters visible tabs and restores them after clearing", async () => {
    const user = userEvent.setup();
    render(<Sidebar isOpen onToggle={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: "Admissions & Registration" }),
    );

    const search = screen.getByRole("searchbox", {
      name: "Search navigation",
    });
    expect(search).toHaveClass("sidebar-search-input");
    await user.type(search, "Applications");

    expect(screen.getByText("Applications")).toBeInTheDocument();
    expect(screen.queryByText("Leads")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Clear navigation search" }),
    );
    expect(screen.getByText("Leads")).toBeInTheDocument();
  });

  it("shows a localized empty state for an unmatched search", async () => {
    const user = userEvent.setup();
    render(<Sidebar isOpen onToggle={vi.fn()} />);

    await user.type(
      screen.getByRole("searchbox", { name: "Search navigation" }),
      "does-not-exist",
    );

    expect(screen.getByText("No tabs found")).toBeInTheDocument();
  });

  it("opens the search from the collapsed sidebar", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<Sidebar isOpen={false} onToggle={onToggle} />);

    await user.click(
      screen.getByRole("button", { name: "Open navigation search" }),
    );

    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("searches Arabic navigation labels in RTL mode", async () => {
    const user = userEvent.setup();
    navigationState.pathname = "/ar/dashboard";

    try {
      render(<Sidebar isOpen onToggle={vi.fn()} />);

      expect(
        screen.getByRole("searchbox", { name: "بحث في التنقل" }),
      ).toBeInTheDocument();

      await user.type(
        screen.getByRole("searchbox", { name: "بحث في التنقل" }),
        "الطلاب",
      );

      expect(screen.getByText("الطلاب")).toBeInTheDocument();
    } finally {
      navigationState.pathname = "/en/dashboard";
    }
  });

  it("provides an accessible collapse action when expanded", () => {
    const onToggle = vi.fn();
    render(<Sidebar isOpen onToggle={onToggle} />);

    const toggle = screen.getByRole("button", { name: "collapse" });

    expect(toggle).toHaveAccessibleName("collapse");
    toggle.click();
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("keeps the expand control available when collapsed", () => {
    render(<Sidebar isOpen={false} onToggle={vi.fn()} />);

    expect(screen.getByRole("button", { name: "expand" })).toHaveAccessibleName(
      "expand",
    );
  });
});
