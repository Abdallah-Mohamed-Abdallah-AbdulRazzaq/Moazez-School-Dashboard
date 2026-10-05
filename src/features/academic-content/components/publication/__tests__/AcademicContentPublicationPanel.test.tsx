import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AcademicContentDetail,
  AcademicContentPublication,
} from "../../../types/contracts";
import AcademicContentPublicationPanel from "../AcademicContentPublicationPanel";

const NOW = "2026-10-05T08:00:00.000Z";
const publication: AcademicContentPublication = {
  publicationId: "publication-1",
  revisionId: "revision-1",
  status: "SCHEDULED",
  sourceContentStatus: "DRAFT",
  publishAt: NOW,
  visibleFrom: NOW,
  visibleUntil: null,
  publishedAt: null,
  expiredAt: null,
  cancelledAt: null,
  cancellationReason: null,
  supersedesPublicationId: null,
  changeSignificance: null,
  notifyMinorUpdate: false,
  studentRecipientCount: 0,
  guardianRecipientContextCount: 0,
  createdByUserId: "user-1",
  createdAt: NOW,
};

const content: AcademicContentDetail = {
  id: "content-1",
  academicYearId: "year-1",
  termId: "term-1",
  type: "GENERAL_RESOURCE",
  audience: "STUDENTS",
  title: "Reference pack",
  description: null,
  status: "DRAFT",
  archivedAt: null,
  createdAt: NOW,
  updatedAt: NOW,
  latestPublicationId: null,
  publicationStatus: null,
  publishAt: null,
  visibleFrom: null,
  visibleUntil: null,
  targets: [],
  assets: [],
  links: [],
  tags: [],
  details: null,
};

const hook = vi.hoisted(() => ({
  state: {} as Record<string, unknown>,
  useAcademicContentPublication: vi.fn(),
}));

vi.mock("../../../hooks/useAcademicContentPublication", () => ({
  useAcademicContentPublication: hook.useAcademicContentPublication,
}));

function publicationState(overrides: Record<string, unknown> = {}) {
  return {
    readiness: { canPublish: true, canSchedule: true, blockingReasons: [] },
    audiencePreview: {
      asOf: NOW,
      students: 0,
      guardianContexts: 0,
      guardianUsersWithAccounts: 0,
      guardianNotificationOptOutContexts: 0,
    },
    history: { items: [], page: 1, limit: 20, total: 0 },
    trackedPublication: null,
    detail: null,
    errors: {
      readiness: null,
      audiencePreview: null,
      history: null,
      mutation: null,
      detail: null,
    },
    isLoading: false,
    isMutating: false,
    isDetailLoading: false,
    pollTimedOut: false,
    historyPage: 1,
    reload: vi.fn().mockResolvedValue(undefined),
    setHistoryPage: vi.fn(),
    create: vi.fn().mockResolvedValue(publication),
    loadDetail: vi.fn().mockResolvedValue(publication),
    clearDetail: vi.fn(),
    unschedule: vi.fn().mockResolvedValue(publication),
    cancel: vi.fn().mockResolvedValue(publication),
    startRevision: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

describe("AcademicContentPublicationPanel", () => {
  beforeEach(() => {
    hook.state = publicationState();
    hook.useAcademicContentPublication.mockReset().mockImplementation(() => hook.state);
  });

  it("opens publish-now and schedule dialogs and delegates validated drafts", async () => {
    render(
      <AcademicContentPublicationPanel
        content={content}
        canMutate
        onContentChanged={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Publish now" }));
    fireEvent.click(screen.getByRole("button", { name: "Start publishing" }));
    await waitFor(() =>
      expect(hook.state.create).toHaveBeenCalledWith({
        mode: "now",
        publishAt: null,
        visibleFrom: null,
        visibleUntil: null,
        notifyMinorUpdate: false,
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Schedule" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Schedule");
  });

  it("routes history detail and lifecycle actions through the hook", async () => {
    const scheduled = { ...publication, publishAt: "2100-10-05T08:00:00.000Z" };
    hook.state = publicationState({
      history: { items: [scheduled], page: 1, limit: 20, total: 1 },
      detail: scheduled,
    });
    render(
      <AcademicContentPublicationPanel
        content={content}
        canMutate
        onContentChanged={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "View publication details" }));
    await waitFor(() =>
      expect(hook.state.loadDetail).toHaveBeenCalledWith("publication-1"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Close modal" }));
    expect(hook.state.clearDetail).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Unschedule" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm unschedule" }));
    await waitFor(() =>
      expect(hook.state.unschedule).toHaveBeenCalledWith("publication-1"),
    );
  });

  it("shows processing and polling timeout states without claiming success", () => {
    hook.state = publicationState({
      trackedPublication: publication,
      pollTimedOut: true,
    });
    render(
      <AcademicContentPublicationPanel
        content={content}
        canMutate
        onContentChanged={vi.fn()}
      />,
    );

    expect(screen.getByText(/Publication is being processed/i)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/Automatic status checks stopped/i);
    expect(screen.queryByText(/^Published$/)).toBeNull();
  });

  it("passes the content refresh callback into publication orchestration", () => {
    const onContentChanged = vi.fn();
    render(
      <AcademicContentPublicationPanel
        content={content}
        canMutate={false}
        onContentChanged={onContentChanged}
      />,
    );

    expect(hook.useAcademicContentPublication).toHaveBeenCalledWith(
      "content-1",
      onContentChanged,
    );
    expect(screen.queryByRole("button", { name: "Publish now" })).toBeNull();
  });
});
