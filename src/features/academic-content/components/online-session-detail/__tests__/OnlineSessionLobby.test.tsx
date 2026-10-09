import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AcademicContentDetail } from "../../../types/contracts";
import OnlineSessionContextRail from "../OnlineSessionContextRail";
import OnlineSessionInformation from "../OnlineSessionInformation";
import OnlineSessionLobbyHero from "../OnlineSessionLobbyHero";
import OnlineSessionManagementHistory from "../OnlineSessionManagementHistory";
import OnlineSessionResources from "../OnlineSessionResources";

const content = {
  id: "session-1",
  academicYearId: "year-1",
  termId: "term-1",
  type: "ONLINE_SESSION",
  audience: "STUDENTS",
  title: "Fractions review",
  description: "Interactive practice before the assessment.",
  status: "SCHEDULED",
  archivedAt: null,
  createdAt: "2026-10-01T08:00:00.000Z",
  updatedAt: "2026-10-05T08:00:00.000Z",
  latestPublicationId: "publication-1",
  publicationStatus: "PUBLISHED",
  publishAt: "2026-10-02T08:00:00.000Z",
  visibleFrom: "2026-10-02T08:00:00.000Z",
  visibleUntil: null,
  targets: [],
  assets: [
    {
      assetId: "asset-1",
      fileId: "file-1",
      originalName: "Fractions worksheet.pdf",
      mimeType: "application/pdf",
      sizeBytes: "2048",
      sortOrder: 0,
      createdAt: "2026-10-01T08:00:00.000Z",
    },
  ],
  links: [
    {
      id: "link-1",
      label: "Preparation notes",
      url: "https://example.com/notes",
      sortOrder: 0,
    },
  ],
  tags: [{ id: "tag-1", value: "Revision", sortOrder: 0 }],
  details: {
    platform: "ZOOM",
    providerName: null,
    joinUrl: "https://example.com/join",
    accessCode: "2468",
    instructions: "Bring your workbook.",
    startAt: "2026-10-06T10:00:00.000Z",
    endAt: "2026-10-06T10:45:00.000Z",
    timezone: "Africa/Cairo",
    timetableEntryId: "entry-1",
  },
} satisfies Extract<AcademicContentDetail, { type: "ONLINE_SESSION" }>;

describe("online session meeting lobby", () => {
  it("keeps a valid join action available after the scheduled session ends", () => {
    render(
      <OnlineSessionLobbyHero
        content={content}
        now={new Date("2026-10-06T11:00:00.000Z")}
      />,
    );

    expect(screen.getByText("Ended")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Join Fractions review" }),
    ).toHaveAttribute("href", "https://example.com/join");
  });

  it("disables joining when the backend meeting link is not secure", () => {
    const insecureContent = {
      ...content,
      details: { ...content.details, joinUrl: "http://example.com/join" },
    };

    render(<OnlineSessionLobbyHero content={insecureContent} />);

    expect(
      screen.getByRole("button", { name: "Meeting link unavailable" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("link", { name: /Join Fractions review/ }),
    ).not.toBeInTheDocument();
  });

  it("presents the aggregate resources, schedule, context, and management surfaces", () => {
    const onDownload = vi.fn();
    render(
      <>
        <OnlineSessionInformation
          content={content}
          targets={[
            {
              targetId: "target-1",
              subject: "Mathematics",
              scope: "Grade 4 - A",
              assignedTeacher: "Sarah Ali",
            },
          ]}
          targetError={null}
          timetableLabel="Grade 4 - A · Mathematics · Period 2"
        />
        <OnlineSessionResources
          content={content}
          downloadError={null}
          onDownload={onDownload}
        />
        <OnlineSessionContextRail
          content={content}
          readiness={{ canAdvance: true, blockingReasons: [] }}
        />
        <OnlineSessionManagementHistory
          showPublication
          readinessPanel={<p>Readiness contract panel</p>}
          publicationPanel={<p>Publication contract panel</p>}
          revisionPanel={<p>Revision contract panel</p>}
        />
      </>,
    );

    expect(screen.getByText("Bring your workbook.")).toBeVisible();
    expect(
      screen.getByText("Interactive practice before the assessment."),
    ).toBeVisible();
    expect(
      screen.getByText("Mathematics · Grade 4 - A · Sarah Ali"),
    ).toBeVisible();
    expect(
      screen.getByText("Grade 4 - A · Mathematics · Period 2"),
    ).toBeVisible();
    expect(screen.getByText("Fractions worksheet.pdf")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Preparation notes" }),
    ).toHaveAttribute("href", "https://example.com/notes");
    expect(screen.getByText("Revision")).toBeVisible();
    expect(screen.getByText("Ready to advance")).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: "Download Fractions worksheet.pdf" }),
    );
    expect(onDownload).toHaveBeenCalledWith(content.assets[0]);
    fireEvent.click(screen.getByRole("button", { name: "Publication" }));
    expect(screen.getByText("Publication contract panel")).toBeVisible();
  });
});
