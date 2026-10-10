import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GuardedLink from "../GuardedLink";
import { NavigationGuardProvider } from "@/providers/NavigationGuardProvider";
import { ProgressBarProvider } from "@/providers/ProgressBarProvider";
import {
  UnsavedChangesProvider,
  useUnsavedChanges,
} from "@/providers/UnsavedChangesProvider";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

function DirtyControl() {
  const { setDirty } = useUnsavedChanges();
  return <button onClick={() => setDirty("editor", true)}>Edit content</button>;
}

function QueryLink({ href }: { href: string }) {
  return (
    <UnsavedChangesProvider>
      <NavigationGuardProvider>
        <ProgressBarProvider>
          <DirtyControl />
          <GuardedLink href={href}>Content destination</GuardedLink>
        </ProgressBarProvider>
      </NavigationGuardProvider>
    </UnsavedChangesProvider>
  );
}

describe("Academic Content query-only navigation regression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(
      null,
      "",
      "/ar/academic-content-hub/library?year=year-1&term=term-1",
    );
  });

  it.each([
    ["", "&contentStatus=DRAFT"],
    ["&contentStatus=DRAFT", "&contentStatus=ARCHIVED"],
    ["&contentStatus=ARCHIVED", ""],
  ])(
    "navigates from %s to %s without treating the shared pathname as a no-op",
    (currentFilter, targetFilter) => {
      const base = "/ar/academic-content-hub/library?year=year-1&term=term-1";
      window.history.replaceState(null, "", base + currentFilter);
      render(<QueryLink href={base + targetFilter} />);
      fireEvent.click(screen.getByRole("link", { name: "Content destination" }));
      expect(router.push).toHaveBeenCalledWith(base + targetFilter);
    },
  );

  it("does not navigate when the complete destination is already selected", () => {
    render(<QueryLink href={window.location.pathname + window.location.search} />);
    fireEvent.click(screen.getByRole("link", { name: "Content destination" }));
    expect(router.push).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("protects unsaved edits before applying a query-only destination", () => {
    const destination =
      window.location.pathname + window.location.search + "&contentStatus=DRAFT";
    render(<QueryLink href={destination} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit content" }));
    fireEvent.click(screen.getByRole("link", { name: "Content destination" }));
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(router.push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "stay" }));
    expect(router.push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("link", { name: "Content destination" }));
    fireEvent.click(screen.getByRole("button", { name: "leave" }));
    expect(router.push).toHaveBeenCalledWith(destination);
  });
});
