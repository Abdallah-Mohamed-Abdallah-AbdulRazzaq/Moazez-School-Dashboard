import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getBulkCredentialPreviewPayloadKey } from "../../services/credentialsService";
import BulkGenerateCredentialsModal from "../BulkGenerateCredentialsModal";
import type { BulkCredentialPreviewResponse } from "../../types";

const labels = {
  title: "Bulk generate credentials",
  description: "Preview eligible users.",
  role: "Role",
  status: "Scope",
  all: "All",
  active: "Include users with passwords",
  invited: "Invited",
  inactive: "Include disabled users",
  missingOnly: "Missing passwords",
  mustChangeOnly: "Must change",
  forceChange: "Force change",
  preview: "Preview",
  previewing: "Previewing",
  generate: "Generate",
  generating: "Generating",
  cancel: "Cancel",
  totalMatched: "Total matched",
  eligible: "Eligible",
  skipped: "Skipped",
  skippedReasons: "Why users were skipped",
  skipReasonLabels: {
    already_has_password: "Already has a password",
    disabled_user: "Disabled user",
  },
  unknownSkipReason: (reason: string) => `Skipped: ${reason}`,
};

function renderModal(
  preview: BulkCredentialPreviewResponse,
  previewPayloadKey = getBulkCredentialPreviewPayloadKey({
    scope: "missing_password",
    includeUsersWithPassword: false,
    includeDisabledUsers: false,
  }),
) {
  render(
    <BulkGenerateCredentialsModal
      isOpen
      roles={[]}
      preview={preview}
      previewPayloadKey={previewPayloadKey}
      isPreviewing={false}
      isGenerating={false}
      onClose={vi.fn()}
      onPreview={vi.fn()}
      onGenerate={vi.fn()}
      labels={labels}
    />,
  );
}

describe("BulkGenerateCredentialsModal preview", () => {
  it("locks a teacher-directory bulk action to the teacher role", async () => {
    const user = userEvent.setup();
    const onPreview = vi.fn().mockResolvedValue(undefined);
    render(
      <BulkGenerateCredentialsModal
        isOpen
        roles={[]}
        fixedRoleKey="teacher"
        preview={null}
        previewPayloadKey={null}
        isPreviewing={false}
        isGenerating={false}
        onClose={vi.fn()}
        onPreview={onPreview}
        onGenerate={vi.fn()}
        labels={labels}
      />,
    );

    expect(screen.queryByLabelText("Scope")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Preview" }));

    expect(onPreview).toHaveBeenCalledWith({
      scope: "role",
      roleKeys: ["teacher"],
      includeUsersWithPassword: false,
      includeDisabledUsers: false,
    });
  });

  it("shows production counts and translated and fallback skip reasons", () => {
    renderModal({
      totalMatched: 26,
      eligibleCount: 0,
      skippedCount: 26,
      skippedReasons: {
        already_has_password: 25,
        disabled_user: 1,
        policy_blocked: 2,
      },
      recipients: [
        {
          userId: "user-1",
          fullName: "Ahmed Ali",
          username: null,
          loginEmail: "ahmed@school.edu",
          eligible: false,
          skipReason: "already_has_password",
        },
      ],
    });

    expect(screen.getByText(/Total matched:/)).toHaveTextContent("26");
    expect(screen.getByText(/Eligible:/)).toHaveTextContent("0");
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "SPAN" && element.textContent === "Skipped: 26",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Already has a password: 25")).toBeInTheDocument();
    expect(screen.getByText("Disabled user: 1")).toBeInTheDocument();
    expect(screen.getByText("Skipped: policy_blocked: 2")).toBeInTheDocument();
    expect(screen.getByText("ahmed@school.edu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();
  });

  it("disables generation when a successful preview becomes stale", async () => {
    const user = userEvent.setup();
    renderModal({
      totalMatched: 1,
      eligibleCount: 1,
      skippedCount: 0,
      skippedReasons: {},
      recipients: [],
    });

    const generate = screen.getByRole("button", { name: "Generate" });
    expect(generate).toBeEnabled();

    await user.click(
      screen.getByRole("checkbox", { name: "Include users with passwords" }),
    );

    expect(generate).toBeDisabled();
    expect(screen.queryByText(/Total matched:/)).not.toBeInTheDocument();
  });
});
