import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HeroJourneyBadgeThumb from "../HeroJourneyBadgeThumb";

const mocks = vi.hoisted(() => ({
  downloadFileBlob: vi.fn(),
  hasPermission: vi.fn(),
}));

vi.mock("@/services/filesService", () => ({
  downloadFileBlob: mocks.downloadFileBlob,
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: mocks.hasPermission,
    isPermissionsReady: true,
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

const badge = {
  id: "badge-1",
  slug: "mission-finisher",
  nameEn: "Mission Finisher",
  nameAr: "منجز المهام",
  descriptionEn: "",
  descriptionAr: "",
  assetPath: "https://cdn.example.com/mission-finisher.png",
};

describe("HeroJourneyBadgeThumb", () => {
  beforeEach(() => {
    mocks.downloadFileBlob.mockReset();
    mocks.hasPermission.mockReturnValue(true);
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn((blob: Blob & { marker?: string }) => `blob:${blob.marker}`),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("previews a badge through its authenticated file id", async () => {
    const blob = new Blob(["badge"]) as Blob & { marker: string };
    blob.marker = "badge-file";
    mocks.downloadFileBlob.mockResolvedValue(blob);

    render(<HeroJourneyBadgeThumb badge={{ ...badge, fileId: "badge-file" }} />);

    expect(
      await screen.findByRole("img", { name: "Mission Finisher" }),
    ).toHaveAttribute("src", "blob:badge-file");
    expect(mocks.downloadFileBlob).toHaveBeenCalledWith("badge-file");
  });

  it("uses assetPath when the badge has no file id", () => {
    render(<HeroJourneyBadgeThumb badge={badge} />);

    expect(screen.getByRole("img", { name: "Mission Finisher" })).toHaveAttribute(
      "src",
      badge.assetPath,
    );
    expect(mocks.downloadFileBlob).not.toHaveBeenCalled();
  });
});
