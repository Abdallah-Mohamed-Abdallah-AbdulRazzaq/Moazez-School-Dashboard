import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CampaignComposerValues } from "@/features/settings/email/campaigns/components/CampaignComposer";
import type { EmailCampaignPreviewRecipientsResponse } from "@/features/settings/email/campaigns/types";

const serviceMocks = vi.hoisted(() => ({
  fetchEmailCampaigns: vi.fn(),
  previewEmailCampaignRecipients: vi.fn(),
  previewEmailCampaign: vi.fn(),
  createEmailCampaign: vi.fn(),
  fetchAllSettingsRoles: vi.fn(),
}));

const campaignValues: CampaignComposerValues = {
  audienceMode: "all-school",
  audience: { allSchool: true },
  selectedUserIdsText: "",
  customEmailsText: "",
  templateKey: "GENERAL_MESSAGE",
  subject: "Subject",
  title: "",
  bodyHtml: "<p>Hello</p>",
  bodyText: "Hello",
  footerHtml: "",
};

vi.mock(
  "@/features/settings/email/campaigns/services/emailCampaignsService",
  () => ({
    fetchEmailCampaigns: serviceMocks.fetchEmailCampaigns,
    previewEmailCampaignRecipients:
      serviceMocks.previewEmailCampaignRecipients,
    previewEmailCampaign: serviceMocks.previewEmailCampaign,
    createEmailCampaign: serviceMocks.createEmailCampaign,
  }),
);

vi.mock("@/features/settings/services/settingsRolesService", () => ({
  fetchAllSettingsRoles: serviceMocks.fetchAllSettingsRoles,
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showSuccess: vi.fn(), showError: vi.fn() }),
}));

vi.mock("@/features/settings/components/SettingsAccessGuard", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock(
  "@/features/settings/email/campaigns/components/CampaignComposer",
  () => ({
    default: (props: {
      roles: Array<{ id: string }>;
      isLoadingRoles: boolean;
      rolesError: unknown;
      onRetryRoles: () => void;
      recipientPreview: EmailCampaignPreviewRecipientsResponse | null;
      onPreviewRecipients: (
        values: CampaignComposerValues,
      ) => Promise<EmailCampaignPreviewRecipientsResponse | null>;
      onCreate: (values: CampaignComposerValues) => Promise<unknown>;
      onRecipientPreviewInvalidated: () => void;
    }) => (
      <div>
        <span>role-count:{props.roles.length}</span>
        <span>{props.isLoadingRoles ? "roles-loading" : "roles-idle"}</span>
        <span>{props.rolesError ? "roles-error" : "roles-ok"}</span>
        <button type="button" onClick={props.onRetryRoles}>
          retry-roles
        </button>
        <span>
          {props.recipientPreview ? "preview-present" : "preview-empty"}
        </span>
        <button
          type="button"
          onClick={() => void props.onPreviewRecipients(campaignValues)}
        >
          preview
        </button>
        <button type="button" onClick={props.onRecipientPreviewInvalidated}>
          invalidate
        </button>
        <button
          type="button"
          onClick={() =>
            void props.onCreate({
              ...campaignValues,
              audienceMode: "role",
              audience: { roleKey: "teacher" },
            })
          }
        >
          create-changed
        </button>
      </div>
    ),
  }),
);

import EmailCampaignsPage from "../EmailCampaignsPage";

function eligiblePreview(): EmailCampaignPreviewRecipientsResponse {
  return {
    totalMatched: 1,
    eligibleCount: 1,
    skippedCount: 0,
    skippedReasons: {},
    recipients: [],
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe("EmailCampaignsPage preview integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.fetchEmailCampaigns.mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 10, total: 0 },
    });
    serviceMocks.fetchAllSettingsRoles.mockResolvedValue([
      { id: "role-1" },
      { id: "role-2" },
    ]);
  });

  it("passes the complete paginated role catalog to the audience selector", async () => {
    render(<EmailCampaignsPage />);

    expect(await screen.findByText("role-count:2")).toBeVisible();
  });

  it("keeps campaigns available when roles fail and retries roles independently", async () => {
    const user = userEvent.setup();
    serviceMocks.fetchAllSettingsRoles
      .mockRejectedValueOnce(new Error("roles unavailable"))
      .mockResolvedValueOnce([{ id: "role-1" }]);

    render(<EmailCampaignsPage />);

    expect(await screen.findByText("roles-error")).toBeVisible();
    expect(screen.getByText("empty.title")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "retry-roles" }));

    expect(await screen.findByText("role-count:1")).toBeVisible();
    expect(screen.getByText("roles-ok")).toBeVisible();
  });

  it("ignores a late recipient preview for an older audience", async () => {
    const user = userEvent.setup();
    const request = deferred<EmailCampaignPreviewRecipientsResponse>();
    serviceMocks.previewEmailCampaignRecipients.mockReturnValue(
      request.promise,
    );
    render(<EmailCampaignsPage />);

    await user.click(await screen.findByRole("button", { name: "preview" }));
    await user.click(screen.getByRole("button", { name: "invalidate" }));
    request.resolve(eligiblePreview());

    await waitFor(() =>
      expect(screen.getByText("preview-empty")).toBeInTheDocument(),
    );
    expect(screen.queryByText("preview-present")).not.toBeInTheDocument();
  });

  it("blocks create for an audience different from the preview", async () => {
    const user = userEvent.setup();
    serviceMocks.previewEmailCampaignRecipients.mockResolvedValue(
      eligiblePreview(),
    );
    render(<EmailCampaignsPage />);

    await user.click(await screen.findByRole("button", { name: "preview" }));
    expect(await screen.findByText("preview-present")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "create-changed" }));

    expect(serviceMocks.createEmailCampaign).not.toHaveBeenCalled();
  });
});
