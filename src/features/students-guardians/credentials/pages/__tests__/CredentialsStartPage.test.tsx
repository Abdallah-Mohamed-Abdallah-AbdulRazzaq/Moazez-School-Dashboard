import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  sourceRegistrationBatchId: null as string | null,
}));
const permissions = vi.hoisted(() => ({ canManage: true }));
const apiMocks = vi.hoisted(() => ({ createCredentialBatch: vi.fn() }));
const toastMocks = vi.hoisted(() => ({ showError: vi.fn(), showSuccess: vi.fn() }));
const academicServiceMocks = vi.hoisted(() => ({
  fetchAcademicYears: vi.fn(),
  fetchTermsByYear: vi.fn(),
  fetchStructureTree: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ lang: "en" }),
  useRouter: () => ({ replace: navigation.replace }),
  useSearchParams: () =>
    new URLSearchParams(
      navigation.sourceRegistrationBatchId
        ? { sourceRegistrationBatchId: navigation.sourceRegistrationBatchId }
        : {},
    ),
}));
vi.mock("next-intl", () => ({ useLocale: () => "en" }));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    isPermissionsReady: true,
    hasAllPermissions: (required: string[]) =>
      required.includes("settings.users.manage") ? permissions.canManage : true,
  }),
}));
vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => toastMocks,
}));
vi.mock(
  "@/features/academics/academic-structure-tree/services/structureService",
  () => academicServiceMocks,
);
vi.mock("../../api/credentialBatchApi", () => ({
  createCredentialBatch: apiMocks.createCredentialBatch,
}));
vi.mock("../../components/CredentialAudienceForm", () => ({
  default: ({ draft, onChange }: { draft: unknown; onChange: (value: unknown) => void }) => (
    <div>
      <output data-testid="audience-draft">{JSON.stringify(draft)}</output>
      <button type="button" onClick={() => onChange({ audienceMode: "missing_password" })}>
        Choose missing passwords
      </button>
      <button
        type="button"
        onClick={() =>
          onChange({
            audienceMode: "academic_year",
            academicYearId: "00000000-0000-4000-8000-000000000002",
          })
        }
      >
        Change audience
      </button>
    </div>
  ),
}));
vi.mock("../../components/CredentialAudiencePreview", () => ({
  default: ({ audience, onChange }: { audience: unknown; onChange: (value: unknown) => void }) => (
    <div>
      <button
        type="button"
        disabled={!audience}
        onClick={() =>
          onChange({
            audienceKey: JSON.stringify(audience),
            result: {
              totalMatched: 1,
              eligible: 1,
              skipped: 0,
              skippedReasons: {},
              sample: [],
            },
          })
        }
      >
        Publish eligible preview
      </button>
      <button
        type="button"
        disabled={!audience}
        onClick={() =>
          onChange({
            audienceKey: JSON.stringify(audience),
            result: {
              totalMatched: 1,
              eligible: 0,
              skipped: 1,
              skippedReasons: { ineligible: 1 },
              sample: [],
            },
          })
        }
      >
        Publish empty preview
      </button>
    </div>
  ),
}));
vi.mock("../../components/CredentialModeForm", () => ({
  default: ({
    enabled,
    onSubmit,
  }: {
    enabled: boolean;
    onSubmit: (value: {
      credentialMode: "shared_admin_provided";
      sharedPassword: string;
    }) => Promise<void>;
  }) => (
    <button
      type="button"
      disabled={!enabled}
      onClick={() =>
        onSubmit({
          credentialMode: "shared_admin_provided",
          sharedPassword: "F2Admin!Pass123",
        })
      }
    >
      Create batch
    </button>
  ),
}));

import CredentialsStartPage from "../CredentialsStartPage";

describe("CredentialsStartPage", () => {
  beforeEach(() => {
    navigation.replace.mockReset();
    navigation.sourceRegistrationBatchId = null;
    permissions.canManage = true;
    apiMocks.createCredentialBatch.mockReset().mockResolvedValue({ id: "batch-1" });
    academicServiceMocks.fetchAcademicYears.mockReset().mockResolvedValue([]);
    academicServiceMocks.fetchTermsByYear.mockReset().mockResolvedValue([]);
    academicServiceMocks.fetchStructureTree.mockReset().mockResolvedValue(null);
  });

  it("shows non-academic audiences immediately and loads academic options on demand", async () => {
    const user = userEvent.setup();
    render(<CredentialsStartPage />);

    expect(screen.getByTestId("audience-draft")).toHaveTextContent(
      '"audienceMode":"missing_password"',
    );
    expect(academicServiceMocks.fetchAcademicYears).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Change audience" }));

    await waitFor(() =>
      expect(academicServiceMocks.fetchAcademicYears).toHaveBeenCalledTimes(1),
    );
  });

  it("requires a fresh eligible preview and invalidates it on audience change", async () => {
    const user = userEvent.setup();
    render(<CredentialsStartPage />);
    const create = screen.getByRole("button", { name: "Create batch" });

    expect(create).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Publish eligible preview" }));
    expect(create).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Change audience" }));
    expect(create).toBeDisabled();
  });

  it("does not enable creation for a zero-eligible preview", async () => {
    const user = userEvent.setup();
    render(<CredentialsStartPage />);

    await user.click(screen.getByRole("button", { name: "Publish empty preview" }));
    expect(screen.getByRole("button", { name: "Create batch" })).toBeDisabled();
  });

  it("allows viewing and previewing without rendering manage controls", async () => {
    permissions.canManage = false;
    render(<CredentialsStartPage />);

    expect(
      screen.getByRole("button", { name: "Publish eligible preview" }),
    ).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Create batch" })).not.toBeInTheDocument();
    expect(screen.getByText("You can preview audiences but cannot create credentials.")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
    );
  });

  it("prefills the registration batch audience from the handoff query", async () => {
    navigation.sourceRegistrationBatchId =
      "00000000-0000-4000-8000-000000000001";
    render(<CredentialsStartPage />);

    expect(await screen.findByTestId("audience-draft")).toHaveTextContent(
      '"audienceMode":"import_batch"',
    );
    expect(screen.getByTestId("audience-draft")).toHaveTextContent(
      '"sourceRegistrationBatchId":"00000000-0000-4000-8000-000000000001"',
    );
  });

  it("creates from the fresh preview and replaces the locale-aware route", async () => {
    const user = userEvent.setup();
    render(<CredentialsStartPage />);
    await user.click(screen.getByRole("button", { name: "Publish eligible preview" }));
    await user.click(screen.getByRole("button", { name: "Create batch" }));

    await waitFor(() =>
      expect(apiMocks.createCredentialBatch).toHaveBeenCalledWith({
        audience: { audienceMode: "missing_password" },
        credentialMode: "shared_admin_provided",
        sharedPassword: "F2Admin!Pass123",
      }),
    );
    expect(navigation.replace).toHaveBeenCalledWith(
      "/en/students-guardians/credentials/batch-1",
    );
    expect(JSON.stringify(navigation.replace.mock.calls)).not.toContain(
      "F2Admin!Pass123",
    );
  });
});
