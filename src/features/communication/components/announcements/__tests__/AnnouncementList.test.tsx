import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AnnouncementList, {
  type AnnouncementListLabels,
} from "../AnnouncementList";
import type { Announcement } from "@/features/communication/types/announcement.types";

vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

const labels: AnnouncementListLabels = {
  emptyTitle: "No announcements",
  emptyDescription: "Create one",
  untitled: "Untitled",
  draft: "Draft",
  published: "Published",
  archived: "Archived",
  priority: "Priority",
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
  view: "View",
  edit: "Edit",
  publish: "Publish",
  archive: "Archive",
};

const draftAnnouncement = {
  id: "announcement-1",
  status: "draft",
  title: "School update",
} as Announcement;

describe("AnnouncementList", () => {
  it.each([
    ["low", "bg-slate-100"],
    ["normal", "bg-primary-100"],
    ["high", "bg-amber-100"],
    ["urgent", "bg-rose-100"],
  ] as const)("shows localized labels and a distinct color for %s priority", (priority, color) => {
    const arabicLabels = { ...labels, priority: "الأولوية", low: "منخفضة", normal: "عادية", high: "مرتفعة", urgent: "عاجلة" };
    const { rerender } = render(<AnnouncementList announcements={[{ ...draftAnnouncement, priority }]}
      canManageActions={false} labels={labels} locale="en" onArchive={vi.fn()} onPublish={vi.fn()} />);
    expect(screen.getByText(`Priority: ${labels[priority]}`)).toHaveClass(color);
    rerender(<AnnouncementList announcements={[{ ...draftAnnouncement, priority }]}
      canManageActions={false} labels={arabicLabels} locale="ar" onArchive={vi.fn()} onPublish={vi.fn()} />);
    expect(screen.getByText(`الأولوية: ${arabicLabels[priority]}`)).toHaveClass(color);
  });

  it("keeps announcement viewing available while hiding manage actions", () => {
    render(
      <AnnouncementList
        announcements={[draftAnnouncement]}
        canManageActions={false}
        labels={labels}
        locale="en"
        onArchive={vi.fn()}
        onPublish={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "View" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publish" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Archive" })).not.toBeInTheDocument();
  });
});
