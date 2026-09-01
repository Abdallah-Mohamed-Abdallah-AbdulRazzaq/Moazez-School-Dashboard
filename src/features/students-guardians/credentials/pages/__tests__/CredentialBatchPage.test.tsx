import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import type { CredentialBatch } from "../../api/credentialBatchDtos";

const polling = vi.hoisted(() => ({
  data: null as CredentialBatch | null,
  error: null as ApiError | null,
  isInitialLoading: false,
  isRefreshing: false,
  retry: vi.fn(),
}));
const permissions = vi.hoisted(() => ({ canManage: true }));
const apiMocks = vi.hoisted(() => ({ downloadCredentialBatch: vi.fn() }));

vi.mock("next-intl", () => ({ useLocale: () => "en" }));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    isPermissionsReady: true,
    hasAllPermissions: () => permissions.canManage,
  }),
}));
vi.mock("../../hooks/useCredentialBatch", () => ({
  useCredentialBatch: () => polling,
}));
vi.mock("../../api/credentialBatchApi", () => ({
  downloadCredentialBatch: apiMocks.downloadCredentialBatch,
}));

import CredentialBatchPage from "../CredentialBatchPage";

const batch: CredentialBatch & { sharedPassword?: string; secretArtifactKey?: string } = {
  id: "batch-1",
  audienceMode: "missing_password",
  credentialMode: "unique_generated",
  selectors: {},
  status: "partial_failed",
  counters: { totalRows: 5, generatedRows: 3, skippedRows: 1, failedRows: 1 },
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:01:00.000Z",
  startedAt: "2026-09-01T00:00:10.000Z",
  completedAt: "2026-09-01T00:01:00.000Z",
  sharedPassword: "must-never-render",
  secretArtifactKey: "secret-object-key",
};

describe("CredentialBatchPage", () => {
  beforeEach(() => {
    polling.data = batch;
    polling.error = null;
    polling.isInitialLoading = false;
    polling.isRefreshing = false;
    polling.retry.mockReset();
    permissions.canManage = true;
    apiMocks.downloadCredentialBatch.mockReset().mockResolvedValue(undefined);
  });

  it("renders authoritative counters and timestamps without secret metadata", () => {
    render(<CredentialBatchPage batchId="batch-1" />);

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(2);
    expect(screen.getByText("Partially completed")).toBeInTheDocument();
    expect(screen.getByText("Created at")).toBeInTheDocument();
    expect(screen.getByText("Completed at")).toBeInTheDocument();
    expect(screen.getByText("Partially completed").closest("section")).toHaveAttribute(
      "aria-live",
      "polite",
    );
    expect(screen.queryByText("must-never-render")).not.toBeInTheDocument();
    expect(screen.queryByText("secret-object-key")).not.toBeInTheDocument();
  });

  it("shows a retryable read error when no authoritative batch is available", async () => {
    polling.data = null;
    polling.error = new ApiError("unsafe read error", 500, "future.code");
    const user = userEvent.setup();
    render(<CredentialBatchPage batchId="batch-1" />);

    expect(screen.getByText("The credential batch could not be loaded.")).toBeInTheDocument();
    expect(screen.queryByText("unsafe read error")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Refresh batch" }));
    expect(polling.retry).toHaveBeenCalledOnce();
  });

  it.each([
    ["pending", 3, true],
    ["processing", 3, true],
    ["completed", 0, true],
    ["failed", 3, true],
    ["completed", 3, false],
  ] as const)(
    "disables export for %s with %s generated rows when manage=%s",
    (status, generatedRows, canManage) => {
      polling.data = {
        ...batch,
        status,
        counters: { ...batch.counters, generatedRows },
      };
      permissions.canManage = canManage;
      render(<CredentialBatchPage batchId="batch-1" />);

      expect(screen.getByRole("button", { name: "Download credential CSV" })).toBeDisabled();
    },
  );

  it("exports once on explicit click and shows the sensitive 24-hour notice", async () => {
    const user = userEvent.setup();
    render(<CredentialBatchPage batchId="batch-1" />);

    expect(
      screen.getByText(/sensitive file.*24 hours/i),
    ).toBeInTheDocument();
    expect(apiMocks.downloadCredentialBatch).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "Download credential CSV" }),
    );

    await waitFor(() =>
      expect(apiMocks.downloadCredentialBatch).toHaveBeenCalledWith("batch-1"),
    );
    expect(apiMocks.downloadCredentialBatch).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["students.credentials.export_not_ready", undefined, "The export is not ready yet."],
    ["students.credentials.export_empty", undefined, "No generated credentials are available to export."],
    ["students.credentials.export_too_large", undefined, "The credential export is too large."],
    ["students.credentials.secret_artifact_unavailable", undefined, "The temporary credential file is unavailable."],
    ["students.credentials.secret_artifact_expired", undefined, "The temporary credential file has expired."],
    ["students.credentials.secret_artifact_invalid", undefined, "The temporary credential file is invalid."],
    [
      "students.credentials.execution_invariant_invalid",
      "export_placement_provenance_invalid",
      "The academic placement could not be verified for export.",
    ],
  ])("maps export failure %s without automatic retry", async (code, reasonCode, message) => {
    apiMocks.downloadCredentialBatch.mockRejectedValue(
      new ApiError("unsafe raw export detail", 409, code, undefined, {
        reasonCode,
      }),
    );
    const user = userEvent.setup();
    render(<CredentialBatchPage batchId="batch-1" />);

    await user.click(
      screen.getByRole("button", { name: "Download credential CSV" }),
    );

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByText("unsafe raw export detail")).not.toBeInTheDocument();
    expect(apiMocks.downloadCredentialBatch).toHaveBeenCalledTimes(1);
  });
});
