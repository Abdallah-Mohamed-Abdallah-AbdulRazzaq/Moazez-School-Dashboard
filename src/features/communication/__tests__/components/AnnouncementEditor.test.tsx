import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AnnouncementEditor, {
  type AnnouncementEditorLabels,
} from "@/features/communication/components/announcements/AnnouncementEditor";
import type { Announcement } from "@/features/communication/types/announcement.types";
import { apiClient } from "@/lib/api";

const originalAdapter = apiClient.defaults.adapter;
const audienceRequests: string[] = [];
const structureTree = {
  stages: [1, 2].map((id) => ({ id: `stage-${id}`, name: `Stage ${id}` })),
  grades: [1, 2].map((id) => ({ id: `grade-${id}`, stageId: `stage-${id}`, name: `Grade ${id}` })),
  sections: [1, 2].map((id) => ({ id: `section-${id}`, gradeId: `grade-${id}`, name: `Section ${id}` })),
  classrooms: [1, 2].map((id) => ({ id: `classroom-${id}`, sectionId: `section-${id}`, name: `Classroom ${id}` })),
};

beforeEach(() => {
  audienceRequests.length = 0;
  apiClient.defaults.adapter = async (config) => {
    const path = config.url?.split("?")[0];
    audienceRequests.push(config.url ?? "");
    const responses: Record<string, unknown> = {
      "/academics/structure/years": [{ id: "year-1" }],
      "/academics/structure/terms": [{ id: "term-1" }],
      "/academics/structure/tree": structureTree,
    };
    if (!path || !(path in responses)) throw new Error(`Unexpected request: ${config.url}`);
    return { data: responses[path], status: 200, statusText: "OK", headers: {}, config };
  };
});

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});

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
  audienceRequired: "Select an audience.",
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

async function selectOption(label: string, option: string) {
  await waitFor(() => expect(screen.getByLabelText(label)).toBeEnabled());
  fireEvent.click(screen.getByLabelText(label));
  fireEvent.click(await screen.findByRole("button", { name: option, exact: true }));
}

function fillAnnouncement() {
  fireEvent.change(screen.getByLabelText(labels.title), { target: { value: "Notice" } });
  fireEvent.change(screen.getByLabelText(labels.body), { target: { value: "Notice body" } });
}

describe("AnnouncementEditor", () => {
  it.each([
    ["stage", "stageId", ["Stage"]],
    ["grade", "gradeId", ["Stage", "Grade"]],
    ["section", "sectionId", ["Stage", "Grade", "Section"]],
    ["classroom", "classroomId", ["Stage", "Grade", "Section", "Classroom"]],
  ] as const)("preloads and restores the saved %s audience hierarchy on the edit page", async (audienceType, idField, chain) => {
    const onSubmit = vi.fn();
    const announcement: Announcement = {
      id: "announcement-1", title: "Notice", body: "Notice body", status: "draft",
      audiences: [{ audienceType, [idField]: `${audienceType}-1` }],
    };
    render(<AnnouncementEditor announcement={announcement} labels={labels} onSubmit={onSubmit} />);
    await waitFor(() => expect(screen.getByLabelText(labels.stage)).toBeEnabled());
    for (const label of chain) {
      expect(screen.getByLabelText(label)).toHaveTextContent(`${label} 1`);
    }
    expect(audienceRequests).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: labels.saveDraft }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ audienceType, audienceId: `${audienceType}-1` }), [],
    );
    await selectOption(labels.stage, "Stage 2");
    if (audienceType !== "stage") {
      fireEvent.click(screen.getByLabelText(labels.grade));
      expect(screen.getByRole("button", { name: "Grade 2", exact: true })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Grade 1", exact: true })).not.toBeInTheDocument();
    }
    expect(audienceRequests).toHaveLength(3);
  });

  it("uses the classroom audience ID when a saved audience also includes its parents", async () => {
    const onSubmit = vi.fn();
    const announcement: Announcement = {
      id: "announcement-1", title: "Notice", body: "Notice body", status: "draft",
      audiences: [{ audienceType: "classroom", stageId: "stage-1", gradeId: "grade-1", sectionId: "section-1", classroomId: "classroom-1" }],
    };
    render(<AnnouncementEditor announcement={announcement} labels={labels} onSubmit={onSubmit} />);
    await waitFor(() => expect(screen.getByLabelText(labels.classroom)).toHaveTextContent("Classroom 1"));
    fireEvent.click(screen.getByRole("button", { name: labels.saveDraft }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ audienceType: "classroom", audienceId: "classroom-1" }), [],
    );
  });

  it("preloads the hierarchy on page entry and opens dropdowns without further requests", async () => {
    render(<AnnouncementEditor labels={labels} onSubmit={vi.fn()} />);
    await waitFor(() => expect(audienceRequests).toHaveLength(3));
    await selectOption(labels.audienceType, labels.classroom);
    await waitFor(() => expect(screen.getByLabelText(labels.stage)).toBeEnabled());

    for (const label of [labels.stage, labels.grade, labels.section, labels.classroom]) {
      fireEvent.click(screen.getByLabelText(label));
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: `${label} 1`, exact: true }));
    }
    await selectOption(labels.stage, "Stage 2");
    fireEvent.click(screen.getByLabelText(labels.grade));
    expect(screen.getByRole("button", { name: "Grade 2", exact: true })).toBeInTheDocument();
    expect(audienceRequests).toHaveLength(3);
  });

  it("shows a load failure and prevents selecting an unloaded hierarchy", async () => {
    apiClient.defaults.adapter = async () => { throw new Error("Network unavailable"); };
    render(<AnnouncementEditor labels={labels} onSubmit={vi.fn()} />);
    await selectOption(labels.audienceType, labels.grade);
    expect(await screen.findByText("Unable to load audience options.")).toBeInTheDocument();
    expect(screen.getByLabelText(labels.stage)).toBeDisabled();
    expect(screen.getByLabelText(labels.grade)).toBeDisabled();
  });

  it.each([
    ["stage", ["Stage"]],
    ["grade", ["Stage", "Grade"]],
    ["section", ["Stage", "Grade", "Section"]],
    ["classroom", ["Stage", "Grade", "Section", "Classroom"]],
  ])("requires the %s audience chain and saves only the target ID", async (audienceType, chain) => {
    const onSubmit = vi.fn();
    render(<AnnouncementEditor labels={labels} onSubmit={onSubmit} />);
    fillAnnouncement();
    await selectOption(labels.audienceType, chain[chain.length - 1]);
    await waitFor(() => expect(screen.getByLabelText(labels.stage)).toBeEnabled());

    for (const label of chain.slice(1)) {
      expect(screen.getByLabelText(label)).toBeDisabled();
    }
    fireEvent.click(screen.getByRole("button", { name: labels.saveDraft }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(labels.audienceRequired!)).toBeInTheDocument();

    for (const label of chain) {
      fireEvent.click(screen.getByLabelText(label));
      await screen.findByRole("button", { name: `${label} 1`, exact: true });
      if (label !== labels.stage) {
        expect(screen.queryByRole("button", { name: `${label} 2`, exact: true })).not.toBeInTheDocument();
      }
      fireEvent.click(screen.getByRole("button", { name: `${label} 1`, exact: true }));
    }
    fireEvent.click(screen.getByRole("button", { name: labels.saveDraft }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ audienceType, audienceId: `${audienceType}-1` }),
      [],
    );
  });

  it.each([labels.stage, labels.grade, labels.section])(
    "clears downstream audiences when %s is cleared",
    async (parentLabel) => {
      const onSubmit = vi.fn();
      render(<AnnouncementEditor labels={labels} onSubmit={onSubmit} />);
      fillAnnouncement();
      await selectOption(labels.audienceType, labels.classroom);
      for (const label of [labels.stage, labels.grade, labels.section, labels.classroom]) {
        await selectOption(label, `${label} 1`);
      }
      await selectOption(parentLabel, "Select...");
      expect(screen.getByLabelText(labels.classroom)).toBeDisabled();
      expect(screen.getByLabelText(labels.classroom)).not.toHaveTextContent("Classroom 1");
      fireEvent.click(screen.getByRole("button", { name: labels.saveDraft }));
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByText(labels.audienceRequired!)).toBeInTheDocument();
    },
  );

  it("loads new child options after changing the stage", async () => {
    const onSubmit = vi.fn();
    render(<AnnouncementEditor labels={labels} onSubmit={onSubmit} />);
    fillAnnouncement();
    await selectOption(labels.audienceType, labels.grade);
    await selectOption(labels.stage, "Stage 1");
    await selectOption(labels.grade, "Grade 1");
    await selectOption(labels.stage, "Stage 2");
    fireEvent.click(screen.getByRole("button", { name: labels.saveDraft }));
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText(labels.grade));
    await screen.findByRole("button", { name: "Grade 2", exact: true });
    expect(screen.queryByRole("button", { name: "Grade 1", exact: true })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Grade 2", exact: true }));
    fireEvent.click(screen.getByRole("button", { name: labels.saveDraft }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ audienceType: "grade", audienceId: "grade-2" }), [],
    );

    await selectOption(labels.audienceType, labels.classroom);
    expect(screen.getByLabelText(labels.grade)).toBeDisabled();
    expect(screen.getByLabelText(labels.stage)).not.toHaveTextContent("Stage 2");
  });

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
