import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CampaignComposer from "../CampaignComposer";
import type { EmailCampaignPreviewRecipientsResponse } from "@/features/settings/email/campaigns/types";
import type { EmailCampaignBatch } from "@/features/settings/email/campaigns/types";

function eligiblePreview(): EmailCampaignPreviewRecipientsResponse {
  return {
    totalMatched: 1,
    eligibleCount: 1,
    skippedCount: 0,
    skippedReasons: {},
    recipients: [],
  };
}

function createdBatch(): EmailCampaignBatch {
  return {
    batchId: "batch-1",
    status: "QUEUED",
    kind: "GENERAL_CAMPAIGN",
    templateKey: "GENERAL_MESSAGE",
    subject: "Welcome",
    totalRecipients: 1,
    queuedCount: 1,
    sentCount: 0,
    failedCount: 0,
    skippedCount: 0,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    failureReason: null,
    createdAt: "2026-07-30T10:00:00.000Z",
    updatedAt: "2026-07-30T10:00:00.000Z",
    deliveryMode: "queued",
    cancellable: true,
  };
}

describe("CampaignComposer Sprint 11 behavior", () => {
  it("blocks credential-only variables in general campaigns", async () => {
    const user = userEvent.setup();
    const onPreviewRecipients = vi.fn();
    render(
      <CampaignComposer
        canManage
        roles={[]}
        isLoadingRoles={false}
        rolesError={false}
        recipientPreview={null}
        recipientPreviewFingerprint={null}
        renderedPreview={null}
        createdBatch={null}
        isPreviewingRecipients={false}
        isPreviewingCampaign={false}
        isCreating={false}
        onPreviewRecipients={onPreviewRecipients}
        onPreviewCampaign={vi.fn()}
        onCreate={vi.fn()}
        onRetryRoles={vi.fn()}
        onRecipientPreviewInvalidated={vi.fn()}
        onStartNewCampaign={vi.fn()}
      />,
    );

    fireEvent.change(
      screen.getByRole("textbox", { name: /fields\.subject/ }),
      {
        target: { value: "Welcome" },
      },
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: /fields\.body_html/ }),
      {
        target: { value: "<p>{{credential.temporaryPassword}}</p>" },
      },
    );
    await user.click(
      screen.getByRole("button", { name: "actions.preview_recipients" }),
    );

    expect(
      screen.getByText(/validation\.credential_variables_blocked/),
    ).toBeInTheDocument();
    expect(onPreviewRecipients).not.toHaveBeenCalled();
  });

  it("invalidates recipient preview for audience changes but not content edits", async () => {
    const user = userEvent.setup();
    const onRecipientPreviewInvalidated = vi.fn();
    render(
      <CampaignComposer
        canManage
        roles={[]}
        isLoadingRoles={false}
        rolesError={false}
        recipientPreview={eligiblePreview()}
        recipientPreviewFingerprint="current"
        renderedPreview={null}
        createdBatch={null}
        isPreviewingRecipients={false}
        isPreviewingCampaign={false}
        isCreating={false}
        onPreviewRecipients={vi.fn()}
        onPreviewCampaign={vi.fn()}
        onCreate={vi.fn()}
        onRetryRoles={vi.fn()}
        onRecipientPreviewInvalidated={onRecipientPreviewInvalidated}
        onStartNewCampaign={vi.fn()}
      />,
    );

    fireEvent.change(
      screen.getByRole("textbox", { name: /fields\.subject/ }),
      { target: { value: "Updated" } },
    );
    expect(onRecipientPreviewInvalidated).not.toHaveBeenCalled();

    await user.type(
      screen.getByRole("textbox", { name: /audience\.custom_emails/ }),
      "extra@example.com",
    );
    await user.click(
      screen.getByRole("button", { name: /audience\.custom_email_add/ }),
    );

    expect(onRecipientPreviewInvalidated).toHaveBeenCalledTimes(1);
  });

  it("prevents overlapping campaign operations", () => {
    render(
      <CampaignComposer
        canManage
        roles={[]}
        isLoadingRoles={false}
        rolesError={false}
        recipientPreview={null}
        recipientPreviewFingerprint={null}
        renderedPreview={null}
        createdBatch={null}
        isPreviewingRecipients
        isPreviewingCampaign={false}
        isCreating={false}
        onPreviewRecipients={vi.fn()}
        onPreviewCampaign={vi.fn()}
        onCreate={vi.fn()}
        onRetryRoles={vi.fn()}
        onRecipientPreviewInvalidated={vi.fn()}
        onStartNewCampaign={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "actions.preview_recipients" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "actions.preview_campaign" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "actions.create" }),
    ).toBeDisabled();
  });

  it("warns clearly when the backend finds no eligible recipients", () => {
    render(
      <CampaignComposer
        canManage
        roles={[]}
        isLoadingRoles={false}
        rolesError={false}
        recipientPreview={{
          totalMatched: 3,
          eligibleCount: 0,
          skippedCount: 3,
          skippedReasons: { missing_contact_email: 3 },
          recipients: [],
        }}
        recipientPreviewFingerprint={null}
        renderedPreview={null}
        createdBatch={null}
        isPreviewingRecipients={false}
        isPreviewingCampaign={false}
        isCreating={false}
        onPreviewRecipients={vi.fn()}
        onPreviewCampaign={vi.fn()}
        onCreate={vi.fn()}
        onRetryRoles={vi.fn()}
        onRecipientPreviewInvalidated={vi.fn()}
        onStartNewCampaign={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "recipients.zero_eligible_warning",
    );
    expect(
      screen.getByText("recipients.skip_reasons.missing_contact_email"),
    ).toBeVisible();
  });

  it("preserves the draft after queueing until create another is selected", async () => {
    const user = userEvent.setup();
    const onStartNewCampaign = vi.fn();
    const { rerender } = render(
      <CampaignComposer
        canManage
        roles={[]}
        isLoadingRoles={false}
        rolesError={false}
        recipientPreview={null}
        recipientPreviewFingerprint={null}
        renderedPreview={null}
        createdBatch={null}
        isPreviewingRecipients={false}
        isPreviewingCampaign={false}
        isCreating={false}
        onPreviewRecipients={vi.fn()}
        onPreviewCampaign={vi.fn()}
        onCreate={vi.fn()}
        onRetryRoles={vi.fn()}
        onRecipientPreviewInvalidated={vi.fn()}
        onStartNewCampaign={onStartNewCampaign}
      />,
    );

    const subject = screen.getByRole("textbox", { name: /fields\.subject/ });
    await user.type(subject, "Kept draft");
    rerender(
      <CampaignComposer
        canManage
        roles={[]}
        isLoadingRoles={false}
        rolesError={false}
        recipientPreview={null}
        recipientPreviewFingerprint={null}
        renderedPreview={null}
        createdBatch={createdBatch()}
        isPreviewingRecipients={false}
        isPreviewingCampaign={false}
        isCreating={false}
        onPreviewRecipients={vi.fn()}
        onPreviewCampaign={vi.fn()}
        onCreate={vi.fn()}
        onRetryRoles={vi.fn()}
        onRecipientPreviewInvalidated={vi.fn()}
        onStartNewCampaign={onStartNewCampaign}
      />,
    );

    expect(subject).toHaveValue("Kept draft");
    await user.click(
      screen.getByRole("button", { name: "actions.create_another" }),
    );
    expect(subject).toHaveValue("");
    expect(onStartNewCampaign).toHaveBeenCalledOnce();
  });
});
