import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RewardCatalogImageField from "../RewardCatalogImageField";

const fileMocks = vi.hoisted(() => ({ uploadFile: vi.fn() }));

vi.mock("@/services/filesService", () => fileMocks);
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

describe("RewardCatalogImageField", () => {
  beforeEach(() => {
    fileMocks.uploadFile.mockReset().mockResolvedValue({
      id: "file-2",
      originalName: "reward.png",
      mimeType: "image/png",
      sizeBytes: "5",
      visibility: "private",
      createdAt: "2026-06-30T00:00:00.000Z",
    });
  });

  it("uploads an accepted image and reports the returned file ID", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RewardCatalogImageField
        canUpload
        canDownload={false}
        onChange={onChange}
        onUploadingChange={vi.fn()}
      />,
    );

    const image = new File(["image"], "reward.png", { type: "image/png" });
    await user.upload(
      screen.getByLabelText("rewardsModule.catalog.form.uploadImage"),
      image,
    );

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("file-2"));
    expect(fileMocks.uploadFile).toHaveBeenCalledWith(image);
  });

  it("removes an existing image by reporting null", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RewardCatalogImageField
        value="file-1"
        canUpload={false}
        canDownload={false}
        onChange={onChange}
        onUploadingChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByLabelText("rewardsModule.catalog.form.replaceImage"),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: "rewardsModule.catalog.form.removeImage",
      }),
    );
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("keeps the field usable after an upload failure", async () => {
    const user = userEvent.setup();
    fileMocks.uploadFile.mockRejectedValue(new Error("failed"));
    render(
      <RewardCatalogImageField
        canUpload
        canDownload={false}
        onChange={vi.fn()}
        onUploadingChange={vi.fn()}
      />,
    );

    await user.upload(
      screen.getByLabelText("rewardsModule.catalog.form.uploadImage"),
      new File(["image"], "reward.png", { type: "image/png" }),
    );

    expect(
      await screen.findByText("rewardsModule.catalog.form.imageUploadFailed"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("rewardsModule.catalog.form.uploadImage"),
    ).toBeEnabled();
  });
});
