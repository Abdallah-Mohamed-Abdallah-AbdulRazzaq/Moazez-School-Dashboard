import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AnnouncementDetailsPage from "@/features/communication/pages/AnnouncementDetailsPage";

const updateAnnouncement = vi.fn();
const attachFile = vi.fn();
let announcementStatus = "draft";
const selectedFile = new File(["notice"], "notice.pdf", {
  type: "application/pdf",
});

vi.mock("next-intl", () => ({ useLocale: () => "en" }));
vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showError: vi.fn(), showSuccess: vi.fn() }),
}));
vi.mock("@/features/communication/hooks/useAnnouncement", () => ({
  useAnnouncement: () => ({
    announcement: { id: "announcement-1", status: announcementStatus, title: "Notice" },
    archive: vi.fn(),
    cancel: vi.fn(),
    error: null,
    isLoading: false,
    isMutating: false,
    isRefreshing: false,
    publish: vi.fn(),
    readSummary: null,
    refresh: vi.fn(),
    update: updateAnnouncement,
  }),
}));
vi.mock("@/features/communication/hooks/useAnnouncementAttachments", () => ({
  useAnnouncementAttachments: () => ({
    attachments: [],
    attachFile,
    error: null,
    isUploading: false,
    removeAttachment: vi.fn(),
  }),
}));
vi.mock("@/features/communication/hooks/useCommunicationPolicy", () => ({
  useCommunicationPolicy: () => ({ policy: { allowAttachments: true } }),
}));
vi.mock("@/features/communication/components/announcements/AnnouncementEditor", () => ({
  default: ({ onSubmit }: { onSubmit: (values: { title: string }, files: File[]) => void }) => (
    <button type="button" onClick={() => onSubmit({ title: "Updated notice" }, [selectedFile])}>
      Save announcement
    </button>
  ),
}));
vi.mock("@/features/communication/components/announcements/AnnouncementReadSummary", () => ({ default: () => null }));
vi.mock("@/features/communication/components/announcements/ArchiveAnnouncementDialog", () => ({ default: () => null }));
vi.mock("@/features/communication/components/announcements/PublishAnnouncementDialog", () => ({ default: () => null }));
vi.mock("@/features/communication/components/conversations/AttachmentUploader", () => ({
  default: () => <button type="button">Upload attachment</button>,
}));
vi.mock("@/features/communication/components/conversations/MessageAttachments", () => ({ default: () => null }));
vi.mock("@/features/communication/components/layout/CommunicationTabs", () => ({ default: () => null }));

describe("AnnouncementDetailsPage", () => {
  beforeEach(() => {
    announcementStatus = "draft";
    updateAnnouncement.mockReset();
    attachFile.mockReset();
  });

  it("uploads files selected in the editor after saving announcement changes", async () => {
    updateAnnouncement.mockResolvedValue(undefined);
    attachFile.mockResolvedValue(undefined);

    render(<AnnouncementDetailsPage announcementId="announcement-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Save announcement" }));

    await waitFor(() => {
      expect(updateAnnouncement).toHaveBeenCalledWith({ title: "Updated notice" });
      expect(attachFile).toHaveBeenCalledWith(selectedFile);
    });
  });

  it("allows a scheduled announcement to be published", () => {
    announcementStatus = "scheduled";

    render(<AnnouncementDetailsPage announcementId="announcement-1" />);

    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
  });

  it("does not offer invalid archive or attachment actions for a cancelled announcement", () => {
    announcementStatus = "cancelled";

    render(<AnnouncementDetailsPage announcementId="announcement-1" />);

    expect(screen.queryByRole("button", { name: "Archive" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upload attachment" })).not.toBeInTheDocument();
  });
});
