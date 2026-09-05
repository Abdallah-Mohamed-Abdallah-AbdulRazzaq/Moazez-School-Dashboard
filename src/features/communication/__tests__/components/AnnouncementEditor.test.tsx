import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import AnnouncementEditor, {
  type AnnouncementEditorLabels,
} from "@/features/communication/components/announcements/AnnouncementEditor";
import type { Announcement } from "@/features/communication/types/announcement.types";

const labels: AnnouncementEditorLabels = {
  title: "Title",
  body: "Body",
  status: "Status",
  draft: "Draft",
  scheduled: "Scheduled",
  priority: "Priority",
  normal: "Normal",
  low: "Low",
  high: "High",
  urgent: "Urgent",
  audienceType: "Audience type",
  audienceId: "Audience",
  school: "School",
  stage: "Stage",
  grade: "Grade",
  section: "Section",
  classroom: "Classroom",
  custom: "Custom",
  scheduledAt: "Scheduled at",
  expiresAt: "Expires at",
  saveDraft: "Save draft",
  saveChanges: "Save changes",
  attachments: "Attachments",
  addAttachments: "Add attachments",
  removeAttachment: "Remove attachment",
  titleRequired: "Enter a title.",
  bodyRequired: "Enter a body.",
};

describe("AnnouncementEditor", () => {
  it("submits files selected while creating an announcement", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const attachment = new File(["notice"], "notice.pdf", {
      type: "application/pdf",
    });

    render(<AnnouncementEditor labels={labels} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(labels.title), {
      target: { value: "School notice" },
    });
    fireEvent.change(screen.getByLabelText(labels.body), {
      target: { value: "Please read this notice." },
    });
    expect(
      screen.getByRole("button", { name: labels.attachments }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Maximum file size: 10\.0 MB\. Allowed types: application\/pdf, audio\/mp4/,
      ),
    ).toBeInTheDocument();
    const attachmentInput = document.querySelector<HTMLInputElement>(
      'input[type="file"]',
    );
    fireEvent.change(attachmentInput!, {
      target: { files: [attachment] },
    });

    expect(screen.getByText("notice.pdf")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: labels.saveDraft }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "School notice",
          body: "Please read this notice.",
        }),
        [attachment],
      );
    });
  });

  it("does not offer a status change while editing a scheduled announcement", () => {
    const scheduledAnnouncement: Announcement = {
      id: "announcement-1",
      title: "School notice",
      body: "Please read this notice.",
      status: "scheduled",
    };

    render(
      <AnnouncementEditor
        announcement={scheduledAnnouncement}
        labels={labels}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.queryByText(labels.status)).not.toBeInTheDocument();
  });

  it("clears and hides the scheduled time when a scheduled draft becomes a draft", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AnnouncementEditor labels={labels} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByLabelText(labels.status));
    fireEvent.click(screen.getByRole("button", { name: labels.scheduled }));
    fireEvent.change(screen.getByLabelText(labels.scheduledAt), {
      target: { value: "2026-09-05T10:30" },
    });

    fireEvent.click(screen.getByLabelText(labels.status));
    fireEvent.click(screen.getByRole("button", { name: labels.draft }));

    expect(screen.queryByLabelText(labels.scheduledAt)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(labels.title), {
      target: { value: "School notice" },
    });
    fireEvent.change(screen.getByLabelText(labels.body), {
      target: { value: "Please read this notice." },
    });
    fireEvent.click(screen.getByRole("button", { name: labels.saveDraft }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "draft",
          scheduledAt: "",
        }),
        [],
      );
    });
  });
});
