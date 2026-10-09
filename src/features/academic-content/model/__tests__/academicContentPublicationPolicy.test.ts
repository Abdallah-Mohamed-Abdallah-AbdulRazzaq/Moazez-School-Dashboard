import { describe, expect, it } from "vitest";
import {
  canCancelPublication,
  canUnschedulePublication,
  hasEligibleMinorUpdatePredecessor,
  isPublicationSurfaceAvailable,
  publicationBlockingReasonKey,
  publicationDraftFingerprint,
  publicationRequestFromDraft,
  validatePublicationDraft,
  type PublicationDraft,
} from "../academicContentPublicationPolicy";

const REQUEST_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const NOW = new Date("2026-10-05T08:00:00.000Z");

function publishNowDraft(): PublicationDraft {
  return {
    mode: "now",
    publishAt: null,
    visibleFrom: null,
    visibleUntil: null,
    notifyMinorUpdate: false,
  };
}

describe("academic content publication policy", () => {
  it.each([
    ["WEEKLY_PLAN", "STUDENTS", true],
    ["GUARDIAN_WEEKLY_NOTE", "GUARDIANS", true],
    ["SUBJECT_RESOURCE", "STUDENTS_AND_GUARDIANS", true],
    ["ONLINE_SESSION", "STUDENTS", true],
    ["GENERAL_RESOURCE", "GUARDIANS", true],
    ["TEACHER_PREPARATION", "INTERNAL_STAFF", false],
    ["GENERAL_RESOURCE", "INTERNAL_STAFF", false],
  ] as const)(
    "classifies %s/%s publication availability",
    (type, audience, expected) => {
      expect(isPublicationSurfaceAvailable(type, audience)).toBe(expected);
    },
  );

  it("omits publish-now and unset visibility instants", () => {
    expect(publicationRequestFromDraft(publishNowDraft(), REQUEST_ID)).toEqual({
      clientRequestId: REQUEST_ID,
      notifyMinorUpdate: false,
    });
  });

  it("serializes a scheduled publication as ISO instants", () => {
    expect(
      publicationRequestFromDraft(
        {
          mode: "schedule",
          publishAt: new Date("2026-10-06T08:00:00.000Z"),
          visibleFrom: new Date("2026-10-06T09:00:00.000Z"),
          visibleUntil: new Date("2026-10-07T09:00:00.000Z"),
          notifyMinorUpdate: false,
        },
        REQUEST_ID,
      ),
    ).toEqual({
      clientRequestId: REQUEST_ID,
      notifyMinorUpdate: false,
      publishAt: "2026-10-06T08:00:00.000Z",
      visibleFrom: "2026-10-06T09:00:00.000Z",
      visibleUntil: "2026-10-07T09:00:00.000Z",
    });
  });

  it("preserves the minor-update notification choice", () => {
    const draft = { ...publishNowDraft(), notifyMinorUpdate: true };

    expect(publicationDraftFingerprint(draft)).toContain(
      '"notifyMinorUpdate":true',
    );
    expect(publicationRequestFromDraft(draft, REQUEST_ID)).toEqual({
      clientRequestId: REQUEST_ID,
      notifyMinorUpdate: true,
    });
  });

  it("fingerprints the logical timing fields without a request id", () => {
    const draft = publishNowDraft();
    expect(publicationDraftFingerprint(draft)).toBe(
      publicationDraftFingerprint({ ...draft }),
    );
    expect(
      publicationDraftFingerprint({
        ...draft,
        visibleUntil: new Date("2026-10-07T09:00:00.000Z"),
      }),
    ).not.toBe(publicationDraftFingerprint(draft));
  });

  it.each([
    ["SCHEDULED", true, false],
    ["PUBLISHED", false, true],
    ["EXPIRED", false, false],
    ["CANCELLED", false, false],
  ] as const)("maps %s lifecycle actions", (status, unschedule, cancel) => {
    expect(canUnschedulePublication(status)).toBe(unschedule);
    expect(canCancelPublication(status)).toBe(cancel);
  });

  it.each([
    ["no history", [], false],
    [
      "unscheduled draft",
      [
        {
          publicationId: "unscheduled",
          status: "CANCELLED" as const,
          publishedAt: null,
          cancellationReason: "UNSCHEDULED" as const,
          supersedesPublicationId: null,
        },
      ],
      false,
    ],
    [
      "revision predecessor without a successor",
      [
        {
          publicationId: "predecessor",
          status: "CANCELLED" as const,
          publishedAt: "2026-10-05T08:00:00.000Z",
          cancellationReason: "REVISION_STARTED" as const,
          supersedesPublicationId: null,
        },
      ],
      true,
    ],
    [
      "revision predecessor with a successor",
      [
        {
          publicationId: "successor",
          status: "CANCELLED" as const,
          publishedAt: null,
          cancellationReason: "UNSCHEDULED" as const,
          supersedesPublicationId: "predecessor",
        },
        {
          publicationId: "predecessor",
          status: "CANCELLED" as const,
          publishedAt: "2026-10-05T08:00:00.000Z",
          cancellationReason: "REVISION_STARTED" as const,
          supersedesPublicationId: null,
        },
      ],
      false,
    ],
  ] as const)("classifies %s minor-update eligibility", (_scenario, history, expected) => {
    expect(hasEligibleMinorUpdatePredecessor(history)).toBe(expected);
  });

  it.each([
    ["publication.type_or_audience_unavailable", "type_or_audience_unavailable"],
    ["publication.source_status_unavailable", "source_status_unavailable"],
    ["publication.revision_strategy_unavailable", "revision_strategy_unavailable"],
    ["publication.authoring_incomplete", "authoring_incomplete"],
    ["publication.term_invalid", "term_invalid"],
    ["publication.term_ended", "term_ended"],
    ["publication.targets_missing", "targets_missing"],
    ["publication.type_detail_incomplete", "type_detail_incomplete"],
    ["publication.assets_invalid", "assets_invalid"],
    ["publication.active_publication_exists", "active_publication_exists"],
    [
      "publication.online_session_finished_or_missing",
      "online_session_finished_or_missing",
    ],
    ["publication.future_backend_reason", "unknown"],
  ] as const)("maps readiness reason %s", (reason, key) => {
    expect(publicationBlockingReasonKey(reason)).toBe(key);
  });

  it.each([
    {
      scenario: "missing schedule time",
      draft: { ...publishNowDraft(), mode: "schedule" as const },
      expected: ["publish_at_required"],
    },
    {
      scenario: "schedule time is not future",
      draft: { ...publishNowDraft(), mode: "schedule" as const, publishAt: NOW },
      expected: ["publish_at_not_future"],
    },
    {
      scenario: "visibility starts before publication",
      draft: {
        ...publishNowDraft(),
        mode: "schedule" as const,
        publishAt: new Date("2026-10-06T08:00:00.000Z"),
        visibleFrom: new Date("2026-10-06T07:59:59.000Z"),
      },
      expected: ["visible_from_before_publish"],
    },
    {
      scenario: "visibility ends at its start",
      draft: {
        ...publishNowDraft(),
        visibleFrom: new Date("2026-10-06T08:00:00.000Z"),
        visibleUntil: new Date("2026-10-06T08:00:00.000Z"),
      },
      expected: ["visible_until_before_visible_from"],
    },
  ])("rejects $scenario", ({ draft, expected }) => {
    expect(validatePublicationDraft(draft, NOW)).toEqual(expected);
  });

  it("accepts omitted visibility so the backend can apply type-specific defaults", () => {
    expect(validatePublicationDraft(publishNowDraft(), NOW)).toEqual([]);
  });
});
