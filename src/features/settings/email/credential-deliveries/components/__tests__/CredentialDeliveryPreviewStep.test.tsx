import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CredentialDeliveryPreviewStep from "../CredentialDeliveryPreviewStep";
import type { CredentialDeliveryWizardValues } from "../CredentialDeliveryWizard";

const translations: Record<string, string> = {
  "preview.title": "Preview recipients",
  "preview.description": "Review eligibility.",
  "preview.template": "Template",
  "preview.mode": "Mode",
  "preview.contact_email": "Email policy",
  "preview.contact_email_only": "Contact email only",
  "preview.eligible": "Eligible",
  "preview.skipped": "Skipped",
  "preview.sample_eligible": "Eligible sample",
  "preview.sample_skipped": "Skipped sample",
  "preview.no_eligible": "No eligible recipients.",
  "preview.no_skipped": "No skipped recipients.",
  "preview.zero_eligible_warning": "No recipients are eligible.",
  "preview.skip_reasons.title": "Why recipients are skipped",
  "preview.skip_reasons.already_has_password": "Already has a password",
  "templateKeys.ACCOUNT_CREDENTIALS": "Account credentials",
  "credentialModes.LOGIN_INFO_ONLY": "Login info only",
  "actions.preview": "Preview",
};

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => translations[key] ?? key,
}));

const values: CredentialDeliveryWizardValues = {
  audienceMode: "missing-password",
  audience: { missingPasswordOnly: true },
  selectedUserIdsText: "",
  templateKey: "ACCOUNT_CREDENTIALS",
  credentialMode: "LOGIN_INFO_ONLY",
  requireContactEmail: true,
  allowLoginEmailFallback: false,
};

describe("CredentialDeliveryPreviewStep", () => {
  it("renders the backend skipped-reason totals with localized labels", () => {
    render(
      <CredentialDeliveryPreviewStep
        values={values}
        preview={{
          totalMatched: 8,
          eligibleCount: 1,
          skippedCount: 7,
          skippedReasons: { already_has_password: 7 },
          eligibleSample: [],
          skippedSample: [],
        }}
        isPreviewing={false}
        onPreview={vi.fn()}
      />,
    );

    const skipReasonSummary = screen
      .getByText("Why recipients are skipped")
      .closest("div");
    expect(skipReasonSummary).not.toBeNull();
    expect(
      within(skipReasonSummary as HTMLElement).getByText(
        "Already has a password",
      ),
    ).toBeVisible();
    expect(within(skipReasonSummary as HTMLElement).getByText("7")).toBeVisible();
    expect(screen.queryByText("already_has_password")).not.toBeInTheDocument();
  });

  it("announces when the backend finds no eligible recipients", () => {
    render(
      <CredentialDeliveryPreviewStep
        values={values}
        preview={{
          totalMatched: 2,
          eligibleCount: 0,
          skippedCount: 2,
          skippedReasons: { already_has_password: 2 },
          eligibleSample: [],
          skippedSample: [],
        }}
        isPreviewing={false}
        onPreview={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No recipients are eligible.",
    );
  });
});
