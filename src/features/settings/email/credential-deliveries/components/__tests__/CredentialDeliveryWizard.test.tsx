import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CredentialDeliveryWizard from "../CredentialDeliveryWizard";
import type { CredentialDeliveryPreviewResponse } from "@/features/settings/email/credential-deliveries/types";

const preview: CredentialDeliveryPreviewResponse = {
  totalMatched: 1,
  eligibleCount: 1,
  skippedCount: 0,
  skippedReasons: {},
  eligibleSample: [],
  skippedSample: [],
};

describe("CredentialDeliveryWizard", () => {
  it("defaults to the backend contact-email-only recipient policy", () => {
    render(
      <CredentialDeliveryWizard
        canManage
        roles={[]}
        isLoadingRoles={false}
        rolesError={false}
        preview={null}
        previewFingerprint={null}
        createdBatch={null}
        isPreviewing={false}
        isCreating={false}
        onPreview={vi.fn()}
        onCreate={vi.fn()}
        onPreviewInvalidated={vi.fn()}
        onRetryRoles={vi.fn()}
      />,
    );

    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("keeps confirmation unavailable until a current eligible preview exists", () => {
    render(
      <CredentialDeliveryWizard
        canManage
        roles={[]}
        isLoadingRoles={false}
        rolesError={false}
        preview={null}
        previewFingerprint={null}
        createdBatch={null}
        isPreviewing={false}
        isCreating={false}
        onPreview={vi.fn()}
        onCreate={vi.fn()}
        onPreviewInvalidated={vi.fn()}
        onRetryRoles={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /steps.preview/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /steps.confirm/ })).toBeDisabled();
  });

  it("invalidates preview when credential mode changes", async () => {
    const user = userEvent.setup();
    const onPreviewInvalidated = vi.fn();
    render(
      <CredentialDeliveryWizard
        canManage
        roles={[]}
        isLoadingRoles={false}
        rolesError={false}
        preview={preview}
        previewFingerprint="current"
        createdBatch={null}
        isPreviewing={false}
        isCreating={false}
        onPreview={vi.fn()}
        onCreate={vi.fn()}
        onPreviewInvalidated={onPreviewInvalidated}
        onRetryRoles={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "actions.next" }));
    await user.click(
      screen.getByRole("button", {
        name: "mode.credential_mode",
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "credentialModes.REGENERATE_TEMPORARY_PASSWORD",
      }),
    );

    expect(onPreviewInvalidated).toHaveBeenCalledTimes(1);
  });

  it("locks wizard navigation while a preview request is running", () => {
    render(
      <CredentialDeliveryWizard
        canManage
        roles={[]}
        isLoadingRoles={false}
        rolesError={false}
        preview={null}
        previewFingerprint={null}
        createdBatch={null}
        isPreviewing
        isCreating={false}
        onPreview={vi.fn()}
        onCreate={vi.fn()}
        onPreviewInvalidated={vi.fn()}
        onRetryRoles={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "actions.next" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "actions.previewing" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /steps.audience/ }),
    ).toBeDisabled();
  });
});
