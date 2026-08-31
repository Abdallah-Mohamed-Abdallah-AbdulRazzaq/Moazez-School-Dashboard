import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { previewCredentialAudience } from "../../api/credentialBatchApi";
import type { CredentialAudiencePreviewSnapshot } from "../CredentialAudiencePreview";
import CredentialAudiencePreview from "../CredentialAudiencePreview";

vi.mock("next-intl", () => ({ useLocale: () => "en" }));
vi.mock("../../api/credentialBatchApi", () => ({
  previewCredentialAudience: vi.fn(),
}));

const audience = {
  audienceMode: "missing_password" as const,
};
const result = {
  totalMatched: 2,
  eligible: 0,
  skipped: 2,
  skippedReasons: { password_already_present: 2 },
  sample: [],
};

describe("CredentialAudiencePreview", () => {
  beforeEach(() => {
    vi.mocked(previewCredentialAudience).mockReset().mockResolvedValue(result);
  });

  it("loads only on explicit request and reports a zero-eligible blocker", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <CredentialAudiencePreview
        audience={audience}
        snapshot={null}
        onChange={onChange}
      />,
    );

    expect(previewCredentialAudience).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Preview audience" }));

    await waitFor(() => expect(previewCredentialAudience).toHaveBeenCalledWith(audience));
    expect(onChange).toHaveBeenCalledWith({
      audienceKey: JSON.stringify(audience),
      result,
    });
    expect(await screen.findByText("No eligible students matched.")).toBeInTheDocument();
    expect(screen.getByText("password_already_present")).toBeInTheDocument();
  });

  it("invalidates a stored preview when the audience changes", async () => {
    const onChange = vi.fn();
    const snapshot: CredentialAudiencePreviewSnapshot = {
      audienceKey: JSON.stringify(audience),
      result: { ...result, eligible: 1 },
    };
    const { rerender } = render(
      <CredentialAudiencePreview
        audience={audience}
        snapshot={snapshot}
        onChange={onChange}
      />,
    );

    rerender(
      <CredentialAudiencePreview
        audience={{
          audienceMode: "academic_year",
          academicYearId: "00000000-0000-4000-8000-000000000001",
        }}
        snapshot={snapshot}
        onChange={onChange}
      />,
    );

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(null));
  });
});
