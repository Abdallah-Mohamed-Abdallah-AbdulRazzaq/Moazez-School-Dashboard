import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReadinessPanel from "../ReadinessPanel";

describe("ReadinessPanel", () => {
  it("renders unknown backend reasons and optional details without filtering", () => {
    render(
      <ReadinessPanel
        readiness={{
          canAdvance: false,
          blockingReasons: [
            {
              code: "future.rule.code",
              message: "A future backend rule is blocking this draft",
              details: { targetId: "target-1" },
            },
          ],
        }}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Incomplete");
    expect(screen.getByText("future.rule.code")).toBeInTheDocument();
    expect(screen.getByText("A future backend rule is blocking this draft")).toBeInTheDocument();
    expect(screen.getByText(/target-1/)).toBeInTheDocument();
  });

  it("shows ready state and allows an explicit refresh", async () => {
    const onRefresh = vi.fn(async () => undefined);
    render(
      <ReadinessPanel
        readiness={{ canAdvance: true, blockingReasons: [] }}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Ready");
    fireEvent.click(screen.getByRole("button", { name: "Refresh readiness" }));
    await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Refresh readiness" })).toBeEnabled(),
    );
  });
});
