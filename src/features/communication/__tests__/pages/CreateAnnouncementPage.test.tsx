import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CreateAnnouncementPage from "@/features/communication/pages/CreateAnnouncementPage";
import { ApiError } from "@/lib/api-error";

const { attachFileToAnnouncement, createAnnouncement, push, showError } =
  vi.hoisted(() => ({
    attachFileToAnnouncement: vi.fn(),
    createAnnouncement: vi.fn(),
    push: vi.fn(),
    showError: vi.fn(),
  }));

vi.mock("next-intl", () => ({ useLocale: () => "en" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showError, showSuccess: vi.fn() }),
}));
vi.mock("@/features/communication/hooks/useAnnouncements", () => ({
  useAnnouncements: () => ({ create: createAnnouncement, isMutating: false }),
}));
vi.mock("@/features/communication/hooks/useAnnouncementAttachments", () => ({
  attachFileToAnnouncement,
}));
vi.mock("@/features/communication/hooks/useCommunicationPolicy", () => ({
  useCommunicationPolicy: () => ({ policy: { allowAttachments: true } }),
}));
vi.mock("@/features/communication/components/announcements/AnnouncementEditor", () => ({
  default: ({ onSubmit }: { onSubmit: (values: { title: string }, files: File[]) => void }) => (
    <button
      type="button"
      onClick={() =>
        onSubmit(
          { title: "Notice" },
          [new File(["notice"], "notice.pdf", { type: "application/pdf" })],
        )
      }
    >
      Create announcement
    </button>
  ),
}));
vi.mock("@/features/communication/components/layout/CommunicationPageHeader", () => ({ default: () => null }));
vi.mock("@/features/communication/components/layout/CommunicationTabs", () => ({ default: () => null }));

describe("CreateAnnouncementPage", () => {
  it("opens a created announcement when attachment linking fails", async () => {
    createAnnouncement.mockResolvedValue({ id: "announcement-1" });
    attachFileToAnnouncement.mockRejectedValue(
      new ApiError("File too large", 413, "files.upload.size_exceeded"),
    );

    render(<CreateAnnouncementPage />);
    fireEvent.click(screen.getByRole("button", { name: "Create announcement" }));

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith("The file exceeds the allowed size.");
      expect(push).toHaveBeenCalledWith("/en/communication/announcements/announcement-1");
    });
  });
});
