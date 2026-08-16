import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SCOPE_PERMISSION_DENIED_EVENT } from "@/lib/access-denied-event";
import { ScopePermissionDeniedProvider } from "../ScopePermissionDeniedProvider";

describe("ScopePermissionDeniedProvider", () => {
  it("opens a localized permission modal after a missing-scope response", () => {
    render(
      <ScopePermissionDeniedProvider>
        <div>dashboard content</div>
      </ScopePermissionDeniedProvider>,
    );

    act(() => {
      window.dispatchEvent(new Event(SCOPE_PERMISSION_DENIED_EVENT));
    });

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "dismiss" })).toBeInTheDocument();
  });

  it("shows the permission codes required by the denied action", () => {
    render(
      <ScopePermissionDeniedProvider>
        <div>dashboard content</div>
      </ScopePermissionDeniedProvider>,
    );

    act(() => {
      window.dispatchEvent(
        new CustomEvent(SCOPE_PERMISSION_DENIED_EVENT, {
          detail: { missingPermissions: ["attendance.excuses.review"] },
        }),
      );
    });

    expect(screen.getByText("attendance.excuses.review")).toBeInTheDocument();
  });
});
