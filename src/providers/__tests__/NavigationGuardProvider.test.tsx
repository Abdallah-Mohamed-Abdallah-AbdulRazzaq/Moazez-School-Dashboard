import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NavigationGuardProvider } from "../NavigationGuardProvider";
import {
  UnsavedChangesProvider,
  useUnsavedChanges,
} from "../UnsavedChangesProvider";

const routerMocks = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => window.location.pathname,
  useRouter: () => routerMocks,
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

function DirtyStateControl() {
  const { setDirty } = useUnsavedChanges();

  return (
    <button type="button" onClick={() => setDirty("timetable", true)}>
      Edit timetable
    </button>
  );
}

describe("NavigationGuardProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(
      null,
      "",
      "/en/academics/timetable?stage=stage-1&grade=grade-1",
    );
  });

  it("preserves timetable scope while browser navigation awaits confirmation", async () => {
    const user = userEvent.setup();
    render(
      <UnsavedChangesProvider>
        <NavigationGuardProvider>
          <DirtyStateControl />
        </NavigationGuardProvider>
      </UnsavedChangesProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Edit timetable" }));

    act(() => {
      window.history.replaceState(null, "", "/en/academics/timetable");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(await screen.findByText("unsavedChangesBody")).toBeInTheDocument();
    expect(window.location.search).toBe("?stage=stage-1&grade=grade-1");
    expect(routerMocks.replace).toHaveBeenCalledWith(
      "/en/academics/timetable?stage=stage-1&grade=grade-1",
      { scroll: false },
    );
  });
});
