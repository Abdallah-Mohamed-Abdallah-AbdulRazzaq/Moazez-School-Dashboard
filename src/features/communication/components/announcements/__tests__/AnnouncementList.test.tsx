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
  noBody: "No body",
  draft: "Draft",
  published: "Published",
  archived: "Archived",
  priority: "Priority",
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
