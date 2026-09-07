import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RewardCatalogFormModal from "../RewardCatalogFormModal";

const boundaryMocks = vi.hoisted(() => ({
  fetchTermsByYear: vi.fn(),
  uploadFile: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock(
  "@/features/academics/academic-structure-tree/services/structureService",
  async (importOriginal) => ({
    ...(await importOriginal<object>()),
    fetchTermsByYear: boundaryMocks.fetchTermsByYear,
  }),
);
vi.mock("@/services/filesService", () => ({
  uploadFile: boundaryMocks.uploadFile,
  downloadFileBlob: vi.fn(),
}));

const academicYears = [
  {
    id: "year-1",
    name: "2026/2027",
    startDate: "2026-09-01",
    endDate: "2027-06-30",
  },
];

describe("RewardCatalogFormModal", () => {
  beforeEach(() => {
    boundaryMocks.fetchTermsByYear.mockReset().mockResolvedValue([
      {
        id: "term-1",
        name: "Term 1",
        yearId: "year-1",
        status: "open",
        startDate: "2026-09-01",
        endDate: "2027-01-01",
      },
    ]);
    boundaryMocks.uploadFile.mockReset().mockResolvedValue({
      id: "file-2",
      originalName: "reward.png",
      mimeType: "image/png",
      sizeBytes: "5",
      visibility: "private",
      createdAt: "2026-06-30T00:00:00.000Z",
    });
  });

  it("requires stock remaining for limited rewards", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <RewardCatalogFormModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        academicYears={academicYears}
        defaultAcademicYearId="year-1"
        defaultTermId="term-1"
        canUploadFiles
        canDownloadFiles={false}
      />,
    );

    await user.type(
      screen.getByPlaceholderText("Reward title in English"),
      "Reward",
    );
    await user.type(screen.getAllByRole("spinbutton")[1], "10");
    await user.click(
      screen.getByRole("button", { name: "rewardsModule.actions.create" }),
    );

    expect(
      await screen.findByText(
        "rewardsModule.catalog.form.stockRemainingRequired",
      ),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("requires stock quantity for limited rewards", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <RewardCatalogFormModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        academicYears={academicYears}
        defaultAcademicYearId="year-1"
        defaultTermId="term-1"
        canUploadFiles
        canDownloadFiles={false}
      />,
    );

    await user.type(screen.getByPlaceholderText("Reward title in English"), "Reward");
    await user.type(screen.getAllByRole("spinbutton")[2], "10");
    await user.click(screen.getByRole("button", { name: "rewardsModule.actions.create" }));

    expect(await screen.findByText("rewardsModule.catalog.form.stockQuantityRequired")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("requires a whole-number sort order", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <RewardCatalogFormModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        academicYears={academicYears}
        defaultAcademicYearId="year-1"
        defaultTermId="term-1"
        canUploadFiles
        canDownloadFiles={false}
      />,
    );

    await user.type(screen.getByPlaceholderText("Reward title in English"), "Reward");
    await user.type(screen.getAllByRole("spinbutton")[1], "10");
    await user.type(screen.getAllByRole("spinbutton")[2], "10");
    await user.type(screen.getAllByRole("spinbutton")[3], "1.5");
    await user.click(screen.getByRole("button", { name: "rewardsModule.actions.create" }));

    expect(await screen.findByText("rewardsModule.catalog.form.integer")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("locks protected fields while allowing published reward updates", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <RewardCatalogFormModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        initialData={{
          id: "reward-1",
          titleEn: "Reward",
          type: "digital",
          status: "published",
          academicYearId: "year-1",
          termId: "term-1",
          isUnlimited: true,
        }}
        academicYears={academicYears}
        defaultAcademicYearId="year-1"
        defaultTermId="term-1"
        canUploadFiles
        canDownloadFiles={false}
      />,
    );

    const titleInput = await screen.findByPlaceholderText("Reward title in English");
    await waitFor(() => expect(titleInput).toHaveValue("Reward"));
    await user.clear(titleInput);
    await user.type(titleInput, "Updated reward");
    await user.click(screen.getByRole("button", { name: "save" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ titleEn: "Updated reward" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.not.objectContaining({ academicYearId: expect.anything(), termId: expect.anything(), type: expect.anything() }));
  });

  it("submits the active context and uploaded image for create", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <RewardCatalogFormModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        academicYears={academicYears}
        defaultAcademicYearId="year-1"
        defaultTermId="term-1"
        canUploadFiles
        canDownloadFiles={false}
      />,
    );

    expect(
      screen.queryByLabelText("rewardsModule.catalog.form.academicYear"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("rewardsModule.catalog.form.term"),
    ).not.toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Reward title in English"),
      "Reward",
    );
    await user.type(screen.getAllByRole("spinbutton")[1], "10");
    await user.type(screen.getAllByRole("spinbutton")[2], "10");
    await user.upload(
      screen.getByLabelText("rewardsModule.catalog.form.uploadImage"),
      new File(["image"], "reward.png", { type: "image/png" }),
    );
    await waitFor(() => expect(boundaryMocks.uploadFile).toHaveBeenCalled());
    await user.click(
      screen.getByRole("button", { name: "rewardsModule.actions.create" }),
    );

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          academicYearId: "year-1",
          termId: "term-1",
          imageFileId: "file-2",
          titleEn: "Reward",
        }),
      ),
    );
  });

  it("submits null scope and image when they are cleared", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <RewardCatalogFormModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        initialData={{
          id: "reward-1",
          titleEn: "Reward",
          academicYearId: "year-1",
          termId: "term-1",
          stockQuantity: 10,
          stockRemaining: 10,
          imageFileId: "file-1",
        }}
        academicYears={academicYears}
        defaultAcademicYearId="year-1"
        defaultTermId="term-1"
        canUploadFiles
        canDownloadFiles={false}
      />,
    );

    await user.click(
      await screen.findByText("rewardsModule.catalog.form.globalReward"),
    );
    await user.click(
      screen.getByRole("button", {
        name: "rewardsModule.catalog.form.removeImage",
      }),
    );
    await user.click(screen.getByRole("button", { name: "save" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        academicYearId: null,
        termId: null,
        imageFileId: null,
      }),
    );
  });
});
