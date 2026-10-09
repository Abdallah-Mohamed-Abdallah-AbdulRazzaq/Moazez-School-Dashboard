import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import type { AcademicContentDetail } from "../../../types/contracts";
import LifecycleActions from "../LifecycleActions";

const api = vi.hoisted(() => ({
  archiveAcademicContent: vi.fn(),
  deleteAcademicContent: vi.fn(),
  restoreAcademicContent: vi.fn(),
}));
vi.mock("../../../services/academicContentApi", () => api);

function content(status: AcademicContentDetail["status"]): AcademicContentDetail {
  return {
    id: "content-1",
    academicYearId: "year-1",
    termId: "term-1",
    type: "GENERAL_RESOURCE",
    audience: "INTERNAL_STAFF",
    title: "Reference pack",
    description: null,
    status,
    archivedAt: status === "ARCHIVED" ? "2026-09-30T00:00:00.000Z" : null,
    createdAt: "2026-09-30T00:00:00.000Z",
    updatedAt: "2026-09-30T00:00:00.000Z",
    targets: [],
    assets: [],
    links: [],
    tags: [],
    details: null,
  };
}

describe("LifecycleActions", () => {
  beforeEach(() => {
    api.archiveAcademicContent.mockReset().mockResolvedValue({
      ...content("ARCHIVED"),
    });
    api.restoreAcademicContent.mockReset().mockResolvedValue({ ...content("DRAFT") });
    api.deleteAcademicContent.mockReset().mockResolvedValue({ ok: true });
  });

  it("confirms archive and refreshes the aggregate", async () => {
    const onChanged = vi.fn(async () => undefined);
    render(
      <LifecycleActions
        content={content("DRAFT")}
        canManage
        onChanged={onChanged}
        onDeleted={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm archive" }));

    await waitFor(() =>
      expect(api.archiveAcademicContent).toHaveBeenCalledWith("content-1"),
    );
    expect(onChanged).toHaveBeenCalledWith(
      expect.objectContaining({ id: "content-1", status: "ARCHIVED" }),
    );
  });

  it("shows restore only for archived content", async () => {
    const onChanged = vi.fn(async () => undefined);
    render(
      <LifecycleActions
        content={content("ARCHIVED")}
        canManage
        onChanged={onChanged}
        onDeleted={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Archive" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete draft" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Restore" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm restore" }));

    await waitFor(() =>
      expect(api.restoreAcademicContent).toHaveBeenCalledWith("content-1"),
    );
  });

  it("archives changes-requested content without offering deletion", () => {
    render(
      <LifecycleActions
        content={content("CHANGES_REQUESTED")}
        canManage
        onChanged={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete draft" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Restore" })).not.toBeInTheDocument();
  });

  it.each(["SUBMITTED", "APPROVED", "SCHEDULED", "PUBLISHED", "EXPIRED", "CANCELLED"] as const)(
    "hides lifecycle actions for %s content",
    (status) => {
      const { container } = render(
        <LifecycleActions
          content={content(status)}
          canManage
          onChanged={vi.fn()}
          onDeleted={vi.fn()}
        />,
      );

      expect(container).toBeEmptyDOMElement();
    },
  );

  it("deletes a draft only after confirmation", async () => {
    const onDeleted = vi.fn();
    render(
      <LifecycleActions
        content={content("DRAFT")}
        canManage
        onChanged={vi.fn()}
        onDeleted={onDeleted}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete draft" }));
    expect(api.deleteAcademicContent).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledOnce());
    expect(api.deleteAcademicContent).toHaveBeenCalledWith("content-1");
  });

  it("preserves backend lifecycle restrictions", async () => {
    api.archiveAcademicContent.mockRejectedValue(
      new ApiError(
        "Draft cannot be archived while an upload is active",
        409,
        "academic_content.upload.active",
      ),
    );
    render(
      <LifecycleActions
        content={content("DRAFT")}
        canManage
        onChanged={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm archive" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The content status has changed. Refresh the page before trying again.",
    );
  });

  it("hides lifecycle mutations without manage permission", () => {
    render(
      <LifecycleActions
        content={content("DRAFT")}
        canManage={false}
        onChanged={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Archive" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete draft" })).not.toBeInTheDocument();
  });
});
