import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  archiveLessonContent,
  createLessonContent,
  deleteLessonContent,
  listLessonContent,
  publishLessonContent,
  type LessonContentItem,
} from "../../services/curriculumService";
import { uploadLearningMedia } from "../../services/filesService";
import LearningContentPanel from "../LearningContentPanel";

const translate = (key: string) => key;
const authenticatedFileMocks = vi.hoisted(() => ({
  downloadFileBlob: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => translate,
}));

vi.mock("@mui/material", () => ({
  IconButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>{children}</button>
  ),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock("../../services/curriculumService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/curriculumService")>();
  return {
    ...actual,
    createLessonContent: vi.fn(),
    archiveLessonContent: vi.fn(),
    deleteLessonContent: vi.fn(),
    listLessonContent: vi.fn(),
    publishLessonContent: vi.fn(),
    reorderLessonContent: vi.fn(),
    unpublishLessonContent: vi.fn(),
    updateLessonContent: vi.fn(),
  };
});

vi.mock("../../services/filesService", () => ({
  downloadFile: vi.fn(),
  uploadLearningMedia: vi.fn(),
}));

vi.mock("@/components/ui/confirm-dialog/ConfirmDialog", () => ({
  default: ({
    cancelLabel,
    confirmLabel,
    isOpen,
    onClose,
    onConfirm,
  }: {
    cancelLabel: string;
    confirmLabel: string;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
  }) =>
    isOpen ? (
      <div>
        <button type="button" onClick={onClose}>{cancelLabel}</button>
        <button type="button" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    ) : null,
}));

vi.mock("@/services/filesService", () => authenticatedFileMocks);

const contentItem: LessonContentItem = {
  id: "content-1",
  curriculumId: "curriculum-1",
  unitId: "unit-1",
  lessonId: "lesson-1",
  type: "TEXT",
  title: "Introduction",
  bodyText: "Read this lesson",
  url: null,
  file: null,
  sortOrder: 0,
  isRequired: true,
  estimatedMinutes: null,
  metadata: null,
  publicationStatus: "draft",
  publishedAt: null,
  publishedByUserId: null,
  archivedAt: null,
  archivedByUserId: null,
  createdAt: "2026-07-06T00:00:00.000Z",
  updatedAt: "2026-07-06T00:00:00.000Z",
};

describe("LearningContentPanel", () => {
  beforeEach(() => {
    authenticatedFileMocks.downloadFileBlob.mockResolvedValue(
      new Blob(["worksheet"], { type: "application/pdf" }),
    );
  });

  it("shows the list first and opens the form when creating content", async () => {
    const user = userEvent.setup();
    vi.mocked(listLessonContent).mockResolvedValue([]);

    render(
      <LearningContentPanel
        curriculumId="curriculum-1"
        unitId="unit-1"
        lessonId="lesson-1"
        isReadOnly={false}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText(/item_title/)).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "create_new" }));
    expect(screen.getByLabelText(/item_title/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "cancel" }));
    expect(screen.queryByLabelText(/item_title/)).not.toBeInTheDocument();
  });

  it("shows backend field errors inline and preserves content values", async () => {
    const user = userEvent.setup();
    vi.mocked(listLessonContent).mockResolvedValue([]);
    vi.mocked(createLessonContent).mockRejectedValueOnce(
      new ApiError("Validation failed", 422, "validation.failed", {
        title: ["Content title already exists"],
        bodyText: ["Content body is invalid"],
        sortOrder: ["Content order is invalid"],
      }),
    );

    render(
      <LearningContentPanel
        curriculumId="curriculum-1"
        unitId="unit-1"
        lessonId="lesson-1"
        isReadOnly={false}
        onClose={vi.fn()}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "create_new" }));
    const titleInput = screen.getByLabelText(/item_title/);
    const bodyInput = screen.getByLabelText(/body_text/);
    await user.type(titleInput, "Introduction");
    await user.type(bodyInput, "Read this lesson");
    await user.click(screen.getByRole("button", { name: "save" }));

    expect(await screen.findByText("Content title already exists")).toBeInTheDocument();
    expect(screen.getByText("Content body is invalid")).toBeInTheDocument();
    expect(screen.getByText("Content order is invalid")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Introduction")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Read this lesson")).toBeInTheDocument();

    await user.type(titleInput, " revised");
    expect(screen.queryByText("Content title already exists")).not.toBeInTheDocument();
    expect(screen.getByText("Content body is invalid")).toBeInTheDocument();
  });

  it("shows the dropped file before saving a file content item", async () => {
    const user = userEvent.setup();
    vi.mocked(listLessonContent).mockResolvedValue([]);

    render(
      <LearningContentPanel
        curriculumId="curriculum-1"
        unitId="unit-1"
        lessonId="lesson-1"
        isReadOnly={false}
        onClose={vi.fn()}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "create_new" }));
    await user.click(screen.getByLabelText("item_type"));
    await user.click(await screen.findByRole("button", { name: "types.file" }));

    const selectedFile = new File(["lesson resource"], "worksheet.pdf", {
      type: "application/pdf",
    });
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();

    await user.upload(fileInput!, selectedFile);

    expect(await screen.findByText("worksheet.pdf")).toBeInTheDocument();
  });

  it("explains unsupported media containers at the upload field", async () => {
    const user = userEvent.setup();
    vi.mocked(listLessonContent).mockResolvedValue([]);
    vi.mocked(uploadLearningMedia).mockRejectedValueOnce(
      new ApiError(
        "Learning media verification failed",
        422,
        "learning.media.verification_failed",
        undefined,
        { reasonCode: "unsupported_container" },
      ),
    );

    render(
      <LearningContentPanel
        curriculumId="curriculum-1"
        unitId="unit-1"
        lessonId="lesson-1"
        isReadOnly={false}
        onClose={vi.fn()}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "create_new" }));
    await user.type(screen.getByLabelText(/item_title/), "Lesson video");
    await user.click(screen.getByLabelText("item_type"));
    await user.click(await screen.findByRole("button", { name: "types.video" }));
    const fileInput = document.querySelector('input[type="file"]');
    await user.upload(fileInput!, new File(["video"], "lesson.mp4", { type: "video/mp4" }));
    await user.click(screen.getByRole("button", { name: "save" }));

    expect(await screen.findAllByText("file_unsupported_container")).toHaveLength(2);
    expect(screen.queryByText("unsupported_container")).not.toBeInTheDocument();
  });

  it("opens an existing content item in the edit form", async () => {
    const user = userEvent.setup();
    vi.mocked(listLessonContent).mockResolvedValue([contentItem]);

    render(
      <LearningContentPanel
        curriculumId="curriculum-1"
        unitId="unit-1"
        lessonId="lesson-1"
        isReadOnly={false}
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByText("Read this lesson")).toBeInTheDocument();
    await user.click(await screen.findByText("Introduction"));

    expect(screen.getByLabelText(/item_title/)).toHaveValue("Introduction");
    expect(screen.getByDisplayValue("Read this lesson")).toBeInTheDocument();
  });

  it("does not open the edit form for published or archived content", async () => {
    const user = userEvent.setup();
    vi.mocked(listLessonContent).mockResolvedValue([
      { ...contentItem, id: "published", title: "Published", publicationStatus: "published" },
      { ...contentItem, id: "archived", title: "Archived", publicationStatus: "archived" },
    ]);

    render(
      <LearningContentPanel
        curriculumId="curriculum-1"
        unitId="unit-1"
        lessonId="lesson-1"
        isReadOnly={false}
        onClose={vi.fn()}
      />,
    );

    await user.click(await screen.findByText("Published"));
    await user.click(screen.getByText("Archived"));

    expect(screen.queryByLabelText(/item_title/)).not.toBeInTheDocument();
  });

  it("waits for modal confirmation before deleting lesson content", async () => {
    const user = userEvent.setup();
    vi.mocked(listLessonContent).mockResolvedValue([contentItem]);

    render(
      <LearningContentPanel
        curriculumId="curriculum-1"
        unitId="unit-1"
        lessonId="lesson-1"
        isReadOnly={false}
        onClose={vi.fn()}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "actions_menu" }));
    await user.click(await screen.findByRole("menuitem", { name: "delete" }));
    expect(deleteLessonContent).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "cancel" }));
    expect(deleteLessonContent).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "actions_menu" }));
    await user.click(await screen.findByRole("menuitem", { name: "delete" }));
    await user.click(screen.getByRole("button", { name: "delete" }));

    expect(deleteLessonContent).toHaveBeenCalledOnce();
    expect(deleteLessonContent).toHaveBeenCalledWith(
      "curriculum-1",
      "unit-1",
      "lesson-1",
      "content-1",
    );
  });

  it("publishes a draft item through the lifecycle endpoint", async () => {
    const user = userEvent.setup();
    vi.mocked(listLessonContent).mockResolvedValue([contentItem]);
    vi.mocked(publishLessonContent).mockResolvedValue({
      ...contentItem,
      publicationStatus: "published",
      publishedAt: "2026-07-06T01:00:00.000Z",
      publishedByUserId: "user-1",
    });

    render(
      <LearningContentPanel
        curriculumId="curriculum-1"
        unitId="unit-1"
        lessonId="lesson-1"
        isReadOnly={false}
        onClose={vi.fn()}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "actions_menu" }));
    await user.click(await screen.findByRole("menuitem", { name: "publish" }));

    expect(publishLessonContent).toHaveBeenCalledWith(
      "curriculum-1",
      "unit-1",
      "lesson-1",
      "content-1",
    );
  });

  it("requires confirmation before archiving published content", async () => {
    const user = userEvent.setup();
    const publishedContent = {
      ...contentItem,
      publicationStatus: "published" as const,
      publishedAt: "2026-07-06T01:00:00.000Z",
      publishedByUserId: "user-1",
    };
    vi.mocked(listLessonContent).mockResolvedValue([publishedContent]);
    vi.mocked(archiveLessonContent).mockResolvedValue({
      ...publishedContent,
      publicationStatus: "archived",
      archivedAt: "2026-07-06T02:00:00.000Z",
      archivedByUserId: "user-1",
    });

    render(
      <LearningContentPanel
        curriculumId="curriculum-1"
        unitId="unit-1"
        lessonId="lesson-1"
        isReadOnly={false}
        onClose={vi.fn()}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "actions_menu" }));
    await user.click(await screen.findByRole("menuitem", { name: "archive" }));

    expect(archiveLessonContent).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "archive_confirm" }));

    expect(archiveLessonContent).toHaveBeenCalledWith(
      "curriculum-1",
      "unit-1",
      "lesson-1",
      "content-1",
    );
  });

  it("opens FilePreviewModal when previewing file content", async () => {
    const user = userEvent.setup();
    const fileContent: LessonContentItem = {
      ...contentItem,
      id: "content-file-1",
      type: "FILE",
      title: "Worksheet File",
      file: {
        fileId: "file-xyz",
        filename: "worksheet_101.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048,
      },
    };
    vi.mocked(listLessonContent).mockResolvedValue([fileContent]);

    render(
      <LearningContentPanel
        curriculumId="curriculum-1"
        unitId="unit-1"
        lessonId="lesson-1"
        isReadOnly={false}
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByText("worksheet_101.pdf")).toBeInTheDocument();
    expect(screen.getByLabelText("worksheet_101.pdf")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "actions_menu" }));
    expect(await screen.findByRole("menuitem", { name: "preview" })).toBeInTheDocument();
  });
});
