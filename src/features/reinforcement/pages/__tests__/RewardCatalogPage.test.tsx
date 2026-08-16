import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import RewardCatalogPage from "../RewardCatalogPage";

const permissionState = vi.hoisted(() => ({
  permissions: [
    "reinforcement.rewards.view",
    "reinforcement.rewards.manage",
    "files.uploads.manage",
    "files.downloads.view",
  ] as string[],
}));

const academicContextState = vi.hoisted(() => ({
  academicYearId: "year-1",
  termId: "term-1",
  academicYears: [
    {
      id: "year-1",
      name: "2026/2027",
      nameEn: "2026/2027",
      startDate: "2026-09-01",
      endDate: "2027-06-30",
    },
    {
      id: "year-2",
      name: "2027/2028",
      nameEn: "2027/2028",
      startDate: "2027-09-01",
      endDate: "2028-06-30",
    },
  ],
  terms: [
    {
      id: "term-1",
      name: "Term 1",
      nameEn: "Term 1",
      yearId: "year-1",
      status: "open",
      startDate: "2026-09-01",
      endDate: "2027-01-01",
    },
  ],
  isInitializing: false,
  requestAcademicYearChange: vi.fn(),
  requestTermChange: vi.fn(),
}));

const catalogMocks = vi.hoisted(() => ({
  listRewardCatalog: vi.fn(),
  createRewardCatalogItem: vi.fn(),
  updateRewardCatalogItem: vi.fn(),
  publishRewardCatalogItem: vi.fn(),
  archiveRewardCatalogItem: vi.fn(),
}));

const dashboardMocks = vi.hoisted(() => ({
  getRewardCatalogSummary: vi.fn(),
}));

const structureMocks = vi.hoisted(() => ({
  fetchTermsByYear: vi.fn(),
}));

const sharedFileMocks = vi.hoisted(() => ({
  downloadFileBlob: vi.fn(),
  uploadFile: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ isLoading: false }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) =>
      permissionState.permissions.includes(permission),
  }),
}));

vi.mock("@/features/reinforcement/services/rewardCatalogService", () => catalogMocks);

vi.mock(
  "@/features/academics/academic-structure-tree/services/structureService",
  async (importOriginal) => ({
    ...(await importOriginal<object>()),
    fetchTermsByYear: structureMocks.fetchTermsByYear,
  }),
);

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => academicContextState,
}));

vi.mock("@/services/filesService", () => sharedFileMocks);

vi.mock(
  "@/features/reinforcement/services/rewardDashboardService",
  () => dashboardMocks,
);

function renderPage() {
  return render(
    <ToastProvider>
      <RewardCatalogPage />
    </ToastProvider>,
  );
}

describe("RewardCatalogPage", () => {
  beforeEach(() => {
    permissionState.permissions = [
      "reinforcement.rewards.view",
      "reinforcement.rewards.manage",
      "files.uploads.manage",
      "files.downloads.view",
    ];
    academicContextState.requestAcademicYearChange.mockReset();
    academicContextState.requestTermChange.mockReset();
    structureMocks.fetchTermsByYear
      .mockReset()
      .mockResolvedValue(academicContextState.terms);
    const imageBlob = new Blob(["image"], { type: "image/png" });
    sharedFileMocks.downloadFileBlob.mockReset().mockResolvedValue(imageBlob);
    sharedFileMocks.uploadFile.mockReset();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:reward-image"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    catalogMocks.listRewardCatalog.mockReset().mockResolvedValue({
      items: [
        {
          id: "catalog-item-1",
          titleEn: "Backend Catalog Item",
          type: "physical",
          status: "published",
          minTotalXp: 25,
          stockQuantity: 10,
          stockRemaining: 8,
          isUnlimited: false,
          isAvailable: true,
          imageFileId: "file-1",
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });
    catalogMocks.createRewardCatalogItem.mockReset();
    catalogMocks.updateRewardCatalogItem.mockReset();
    catalogMocks.publishRewardCatalogItem.mockReset();
    catalogMocks.archiveRewardCatalogItem.mockReset();
    dashboardMocks.getRewardCatalogSummary.mockReset().mockResolvedValue({
      summary: {
        total: 9,
        published: 5,
        available: 4,
        lowStock: 1,
        outOfStock: 2,
        limited: 3,
      },
      items: [
        {
          id: "summary-only-item",
          titleEn: "Summary Item",
          status: "published",
        },
      ],
    });
  });

  it("loads catalog rows from the catalog endpoint and summary cards from catalog-summary", async () => {
    renderPage();

    expect(await screen.findByText("Backend Catalog Item")).toBeInTheDocument();
    expect(screen.queryByText("Summary Item")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(catalogMocks.listRewardCatalog).toHaveBeenCalledWith({
        academicYearId: "year-1",
        termId: "term-1",
        status: undefined,
        type: undefined,
        search: undefined,
        limit: 50,
        offset: 0,
      });
      expect(dashboardMocks.getRewardCatalogSummary).toHaveBeenCalledWith({
        academicYearId: "year-1",
        termId: "term-1",
        status: undefined,
        type: undefined,
      });
    });

    expect(screen.getByText("9")).toBeInTheDocument();
    expect(
      await screen.findByRole("img", { name: "Backend Catalog Item" }),
    ).toHaveAttribute("src", "blob:reward-image");
  });

  it("does not render academic year or term filters", async () => {
    renderPage();

    expect(await screen.findByText("Backend Catalog Item")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "rewardsModule.catalog.form.academicYear",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "rewardsModule.catalog.form.term",
      }),
    ).not.toBeInTheDocument();
  });

  it("uses backend pagination for catalog rows", async () => {
    const user = userEvent.setup();
    catalogMocks.listRewardCatalog.mockResolvedValue({
      items: [
        {
          id: "catalog-item-1",
          titleEn: "Backend Catalog Item",
          type: "physical",
          status: "published",
        },
      ],
      total: 75,
      limit: 50,
      offset: 0,
    });

    renderPage();

    expect(await screen.findByText("Backend Catalog Item")).toBeInTheDocument();

    await user.click(screen.getByTitle("next_page"));

    await waitFor(() => {
      expect(catalogMocks.listRewardCatalog).toHaveBeenLastCalledWith(
        expect.objectContaining({
          limit: 50,
          offset: 50,
        }),
      );
    });
  });

  it("sends an archive reason through the catalog archive endpoint", async () => {
    const user = userEvent.setup();
    catalogMocks.archiveRewardCatalogItem.mockResolvedValue({
      id: "catalog-item-1",
      titleEn: "Backend Catalog Item",
      status: "archived",
    });

    renderPage();

    expect(await screen.findByText("Backend Catalog Item")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "rewardsModule.actions.archive" }),
    );
    await user.type(
      screen.getByLabelText("rewardsModule.catalog.archive.reason"),
      "No longer offered",
    );
    const archiveDialog = screen
      .getByText("rewardsModule.catalog.archive.title")
      .closest("[role='dialog']");
    expect(archiveDialog).not.toBeNull();
    await user.click(
      within(archiveDialog as HTMLElement).getByRole("button", {
        name: "rewardsModule.actions.archive",
      }),
    );

    await waitFor(() => {
      expect(catalogMocks.archiveRewardCatalogItem).toHaveBeenCalledWith(
        "catalog-item-1",
        { reason: "No longer offered" },
      );
    });
  });

  it("does not send an empty titleEn when creating an Arabic-only reward", async () => {
    const user = userEvent.setup();
    catalogMocks.createRewardCatalogItem.mockResolvedValue({
      id: "catalog-item-2",
      titleAr: "جائزة عربية",
      status: "draft",
    });

    renderPage();

    await user.click(
      await screen.findByRole("button", {
        name: "rewardsModule.catalog.addReward",
      }),
    );
    await user.type(
      screen.getByPlaceholderText(
        "rewardsModule.catalog.form.titlePlaceholderAr",
      ),
      "جائزة عربية",
    );
    await user.type(screen.getAllByRole("spinbutton")[2], "10");
    await user.click(
      screen.getByRole("button", { name: "rewardsModule.actions.create" }),
    );

    await waitFor(() => {
      expect(catalogMocks.createRewardCatalogItem).toHaveBeenCalledWith(
        expect.objectContaining({
          titleAr: "جائزة عربية",
        }),
      );
      expect(catalogMocks.createRewardCatalogItem).toHaveBeenCalledWith(
        expect.not.objectContaining({
          titleEn: "",
        }),
      );
    });
  });
});
