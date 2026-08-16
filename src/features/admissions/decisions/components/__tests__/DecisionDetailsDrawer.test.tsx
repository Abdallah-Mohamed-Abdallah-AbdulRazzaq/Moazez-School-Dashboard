import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DecisionDetailsDrawer from "../DecisionDetailsDrawer";
import { fetchDecisionById } from "../../services/decisionsApiService";

const push = vi.fn();

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("../../services/decisionsApiService", () => ({
  fetchDecisionById: vi.fn(),
}));

const decision = {
  id: "decision-internal-id",
  applicationId: "application-123",
  studentName: "Mariam Ahmed",
  decision: "accept" as const,
  reason: "Completed all admission steps",
  decisionDate: "2026-06-30T09:40:00.000Z",
  decidedBy: "Admissions Officer",
  applicationStatus: "accepted",
};

describe("DecisionDetailsDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchDecisionById).mockResolvedValue(decision);
  });

  it("shows user-facing decision details without exposing internal IDs", async () => {
    render(
      <DecisionDetailsDrawer decisionId={decision.id} isOpen onClose={vi.fn()} />,
    );

    expect(await screen.findByText("Mariam Ahmed")).toBeInTheDocument();
    expect(screen.getByText("Completed all admission steps")).toBeInTheDocument();
    expect(screen.getByText("Admissions Officer")).toBeInTheDocument();
    expect(screen.queryByText("decision-internal-id")).not.toBeInTheDocument();
    expect(screen.queryByText("application-123")).not.toBeInTheDocument();
  });

  it("opens the related application from the loaded decision", async () => {
    const user = userEvent.setup();
    render(
      <DecisionDetailsDrawer decisionId={decision.id} isOpen onClose={vi.fn()} />,
    );

    await user.click(await screen.findByRole("button", { name: "open_application" }));
    expect(push).toHaveBeenCalledWith("/en/admissions/applications/application-123");
  });

  it("keeps the drawer open after a failed request and retries", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchDecisionById)
      .mockRejectedValueOnce({ status: 404 })
      .mockResolvedValueOnce(decision);

    render(
      <DecisionDetailsDrawer decisionId={decision.id} isOpen onClose={vi.fn()} />,
    );

    expect(await screen.findByText("errors.not_found")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "retry" }));
    await waitFor(() => expect(screen.getByText("Mariam Ahmed")).toBeInTheDocument());
  });
});
