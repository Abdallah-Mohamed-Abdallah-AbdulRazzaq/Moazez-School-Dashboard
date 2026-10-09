import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReadinessPanel from "../ReadinessPanel";

describe("ReadinessPanel", () => {
  it("uses localized fallback copy and presents useful details without identifiers", () => {
    render(
      <ReadinessPanel
        readiness={{
          canAdvance: false,
          blockingReasons: [
            {
              code: "future.rule.code",
              message: "A future backend rule is blocking this draft",
              details: {
                missingCount: 2,
                targetIds: ["target-1", "target-2"],
                internal: { id: "secret" },
              },
            },
          ],
        }}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Incomplete");
    expect(
      screen.getByText(
        "Content readiness could not be confirmed. Refresh the data; contact support if the problem continues.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("future.rule.code")).not.toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.queryByText(/target-1|target-2/)).not.toBeInTheDocument();
    expect(screen.queryByText(/secret/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\{"/u)).not.toBeInTheDocument();
  });

  it("localizes known readiness reasons without exposing backend copy", () => {
    render(
      <ReadinessPanel
        readiness={{
          canAdvance: false,
          blockingReasons: [
            {
              code: "academic_content.readiness.targets_missing",
              message: "Backend copy that should not be shown",
            },
          ],
        }}
        onRefresh={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Select at least one content scope."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Backend copy that should not be shown"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("academic_content.readiness.targets_missing"),
    ).not.toBeInTheDocument();
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
      expect(
        screen.getByRole("button", { name: "Refresh readiness" }),
      ).toBeEnabled(),
    );
  });
});
