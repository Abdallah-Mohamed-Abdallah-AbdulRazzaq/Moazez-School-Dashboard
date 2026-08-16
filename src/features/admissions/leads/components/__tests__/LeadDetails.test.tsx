import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LeadDetails from "../LeadDetails";
import { fetchLeadById } from "../../services/leadsApiService";

const push = vi.fn();
const showToast = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showToast }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock("@/components/ui/loaders/MainLoader", () => ({
  default: () => <div>loading</div>,
}));

vi.mock("../LeadStatusBadge", () => ({
  default: ({ status }: { status: string }) => <span>{status}</span>,
}));

vi.mock("../CreateLeadModal", () => ({
  default: () => null,
}));

vi.mock("@/features/admissions/applications/components/ApplicationCreateStepper", () => ({
  default: () => null,
}));

vi.mock("@/features/admissions/shared/TabNavigation", () => ({
  default: ({
    tabs,
  }: {
    tabs: Array<{ id: string; label: string }>;
  }) => <div>{tabs.map((tab) => <span key={tab.id}>{tab.label}</span>)}</div>,
}));

vi.mock("../../services/leadsApiService", () => ({
  fetchLeadById: vi.fn(),
  updateLead: vi.fn(),
}));

vi.mock("@/features/admissions/applications/services/applicationsApiService", () => ({
  createApplication: vi.fn(),
}));

const lead = {
  id: "lead-internal-id",
  studentName: "Mariam Ahmed",
  primaryContactName: "Ahmed Mostafa",
  phone: "+201000000000",
  email: "guardian@example.com",
  channel: "Referral" as const,
  status: "Contacted" as const,
  createdAt: "2026-06-30T09:00:00.000Z",
};

describe("LeadDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchLeadById).mockResolvedValue(lead);
  });

  it("keeps lead actions accessible and hides internal lead IDs", async () => {
    render(<LeadDetails leadId={lead.id} />);

    expect(await screen.findByRole("heading", { name: "Mariam Ahmed" })).toBeInTheDocument();

    const editButton = screen.getByRole("button", { name: /edit/i });
    const convertButton = screen.getByRole("button", {
      name: /mark_converted/i,
    });

    expect(editButton).toBeEnabled();
    expect(convertButton).toBeEnabled();
    expect(screen.queryByText("lead-internal-id")).not.toBeInTheDocument();
  });

  it("does not expose a lead chat surface", async () => {
    render(<LeadDetails leadId={lead.id} />);

    expect(await screen.findByRole("heading", { name: "Mariam Ahmed" })).toBeInTheDocument();
    expect(screen.queryByText("messages")).not.toBeInTheDocument();
  });
});
