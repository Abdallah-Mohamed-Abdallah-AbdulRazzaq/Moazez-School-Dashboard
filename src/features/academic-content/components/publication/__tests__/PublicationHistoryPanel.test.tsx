import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  AcademicContentPublication,
  AcademicContentPublicationHistoryResponse,
} from "../../../types/contracts";
import PublicationHistoryPanel from "../PublicationHistoryPanel";

const NOW = "2026-10-05T08:00:00.000Z";

function publication(
  publicationId: string,
  status: AcademicContentPublication["status"],
): AcademicContentPublication {
  return {
    publicationId,
    revisionId: `revision-${publicationId}`,
    status,
    sourceContentStatus: "DRAFT",
    publishAt: NOW,
    visibleFrom: NOW,
    visibleUntil: null,
    publishedAt: status === "PUBLISHED" ? NOW : null,
    expiredAt: status === "EXPIRED" ? NOW : null,
    cancelledAt: status === "CANCELLED" ? NOW : null,
    studentRecipientCount: 0,
    guardianRecipientContextCount: 0,
    createdByUserId: "user-1",
    createdAt: NOW,
  };
}

function history(
  items: AcademicContentPublication[],
  overrides: Partial<AcademicContentPublicationHistoryResponse> = {},
): AcademicContentPublicationHistoryResponse {
  return { items, page: 1, limit: 20, total: items.length, ...overrides };
}

function renderHistory(
  response: AcademicContentPublicationHistoryResponse,
  options: { canMutate?: boolean; isMutating?: boolean } = {},
) {
  const callbacks = {
    onPageChange: vi.fn(),
    onRetry: vi.fn(),
    onViewDetail: vi.fn(),
    onUnschedule: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn().mockResolvedValue(undefined),
  };
  render(
    <PublicationHistoryPanel
      history={response}
      error={null}
      canMutate={options.canMutate ?? true}
      isMutating={options.isMutating ?? false}
      {...callbacks}
    />,
  );
  return callbacks;
}

describe("PublicationHistoryPanel", () => {
  it("renders backend order, historical zero counts, and detail routing", () => {
    const callbacks = renderHistory(
      history([
        publication("newest", "PUBLISHED"),
        publication("older", "CANCELLED"),
      ]),
    );

    const rows = screen.getAllByRole("article");
    expect(within(rows[0]).getByText("Published")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Cancelled")).toBeInTheDocument();
    expect(within(rows[0]).getAllByText("0")).toHaveLength(2);

    fireEvent.click(
      within(rows[0]).getByRole("button", { name: "View publication details" }),
    );
    expect(callbacks.onViewDetail).toHaveBeenCalledWith("newest");
  });

  it("renders the shared empty state", () => {
    renderHistory(history([]));
    expect(screen.getByText("No publication attempts yet.")).toBeInTheDocument();
  });

  it("routes pagination at the twenty-item boundary", () => {
    const callbacks = renderHistory(
      history([publication("first", "PUBLISHED")], { total: 21 }),
    );

    expect(screen.getByRole("button", { name: "Previous publication page" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next publication page" }));
    expect(callbacks.onPageChange).toHaveBeenCalledWith(2);
  });

  it.each([
    ["SCHEDULED", "Unschedule"],
    ["PUBLISHED", "Withdraw publication"],
  ] as const)("shows the permitted %s lifecycle action", async (status, action) => {
    const callbacks = renderHistory(history([publication("target", status)]));

    fireEvent.click(screen.getByRole("button", { name: action }));
    fireEvent.click(
      screen.getByRole("button", {
        name: status === "SCHEDULED" ? "Confirm unschedule" : "Confirm withdrawal",
      }),
    );

    await waitFor(() => {
      const callback =
        status === "SCHEDULED" ? callbacks.onUnschedule : callbacks.onCancel;
      expect(callback).toHaveBeenCalledWith("target");
    });
  });

  it.each(["EXPIRED", "CANCELLED"] as const)(
    "does not offer lifecycle actions for %s",
    (status) => {
      renderHistory(history([publication("target", status)]));
      expect(screen.queryByRole("button", { name: "Unschedule" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Withdraw publication" })).toBeNull();
    },
  );

  it("hides lifecycle mutations from view-only users", () => {
    renderHistory(history([publication("scheduled", "SCHEDULED")]), {
      canMutate: false,
    });
    expect(screen.queryByRole("button", { name: "Unschedule" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "View publication details" }),
    ).toBeInTheDocument();
  });
});
