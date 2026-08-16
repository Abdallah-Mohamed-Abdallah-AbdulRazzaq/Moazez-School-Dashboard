import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import type { CredentialDeliveryWizardValues } from "@/features/settings/email/credential-deliveries/components/CredentialDeliveryWizard";
import type { CredentialDeliveryPreviewResponse } from "@/features/settings/email/credential-deliveries/types";

const serviceMocks = vi.hoisted(() => ({
  previewCredentialDeliveryRecipients: vi.fn(),
  createCredentialDelivery: vi.fn(),
  fetchAllSettingsRoles: vi.fn(),
}));

const credentialValues: CredentialDeliveryWizardValues = {
  audienceMode: "missing-password",
  audience: { missingPasswordOnly: true },
  selectedUserIdsText: "",
  requireContactEmail: true,
  allowLoginEmailFallback: false,
  templateKey: "ACCOUNT_CREDENTIALS",
  credentialMode: "LOGIN_INFO_ONLY",
};

vi.mock(
  "@/features/settings/email/credential-deliveries/services/credentialDeliveryService",
  () => ({
    previewCredentialDeliveryRecipients:
      serviceMocks.previewCredentialDeliveryRecipients,
    createCredentialDelivery: serviceMocks.createCredentialDelivery,
  }),
);

vi.mock("@/features/settings/services/settingsRolesService", () => ({
  fetchAllSettingsRoles: serviceMocks.fetchAllSettingsRoles,
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showSuccess: vi.fn() }),
}));

vi.mock("@/features/settings/components/SettingsAccessGuard", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock(
  "@/features/settings/email/credential-deliveries/components/CredentialDeliveryWizard",
  () => ({
    default: function MockCredentialDeliveryWizard(props: {
      preview: CredentialDeliveryPreviewResponse | null;
      onPreview: (
        values: CredentialDeliveryWizardValues,
      ) => Promise<CredentialDeliveryPreviewResponse | null>;
      onCreate: (values: CredentialDeliveryWizardValues) => Promise<unknown>;
      onPreviewInvalidated: () => void;
    }) {
      const [dirty, setDirty] = useState(false);
      return (
        <div>
          <span>{props.preview ? "preview-present" : "preview-empty"}</span>
          <span>{dirty ? "wizard-dirty" : "wizard-clean"}</span>
          <button type="button" onClick={() => setDirty(true)}>
            dirty-wizard
          </button>
          <button
            type="button"
            onClick={() => void props.onPreview(credentialValues)}
          >
            preview
          </button>
          <button type="button" onClick={props.onPreviewInvalidated}>
            invalidate
          </button>
          <button
            type="button"
            onClick={() =>
              void props.onCreate({
                ...credentialValues,
                credentialMode: "GENERATE_TEMPORARY_PASSWORD",
              })
            }
          >
            create-changed
          </button>
        </div>
      );
    },
  }),
);

import CredentialDeliveriesPage from "../CredentialDeliveriesPage";

function eligiblePreview(): CredentialDeliveryPreviewResponse {
  return {
    totalMatched: 1,
    eligibleCount: 1,
    skippedCount: 0,
    skippedReasons: {},
    eligibleSample: [],
    skippedSample: [],
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe("CredentialDeliveriesPage preview integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.fetchAllSettingsRoles.mockResolvedValue([]);
  });

  it("ignores a late preview response after values change", async () => {
    const user = userEvent.setup();
    const request = deferred<CredentialDeliveryPreviewResponse>();
    serviceMocks.previewCredentialDeliveryRecipients.mockReturnValue(
      request.promise,
    );
    render(<CredentialDeliveriesPage />);

    await user.click(screen.getByRole("button", { name: "preview" }));
    await user.click(screen.getByRole("button", { name: "invalidate" }));
    request.resolve(eligiblePreview());

    await waitFor(() =>
      expect(screen.getByText("preview-empty")).toBeInTheDocument(),
    );
    expect(screen.queryByText("preview-present")).not.toBeInTheDocument();
  });

  it("blocks create when current values do not match the preview", async () => {
    const user = userEvent.setup();
    serviceMocks.previewCredentialDeliveryRecipients.mockResolvedValue(
      eligiblePreview(),
    );
    render(<CredentialDeliveriesPage />);

    await user.click(screen.getByRole("button", { name: "preview" }));
    expect(await screen.findByText("preview-present")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "create-changed" }));

    expect(serviceMocks.createCredentialDelivery).not.toHaveBeenCalled();
  });

  it("resets the wizard state from the page action", async () => {
    const user = userEvent.setup();
    render(<CredentialDeliveriesPage />);

    await user.click(screen.getByRole("button", { name: "dirty-wizard" }));
    expect(screen.getByText("wizard-dirty")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "reset" }));

    expect(screen.getByText("wizard-clean")).toBeVisible();
  });

});
