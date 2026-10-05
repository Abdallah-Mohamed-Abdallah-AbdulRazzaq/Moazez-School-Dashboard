import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

import * as academicContentApi from "../academicContentApi";

const CONTENT_ID = "content/id";
const ENCODED_CONTENT_ID = "content%2Fid";
const REVISION_ID = "revision/id";
const TEMPLATE_ID = "template/id";
const PUBLICATION_ID = "publication/id";
const UPLOAD_ID = "upload/id";
const ASSET_ID = "asset/id";

describe("academic content endpoint contracts", () => {
  beforeEach(() => {
    Object.values(apiMocks).forEach((mock) => mock.mockReset().mockResolvedValue({}));
  });

  it("lists content with supported non-empty filters and reads management state", async () => {
    await academicContentApi.listAcademicContent({
      academicYearId: "year-1",
      termId: "term-1",
      status: "DRAFT",
      search: "fractions",
      tag: "",
      page: 2,
      limit: 25,
    });
    await academicContentApi.getAcademicContent(CONTENT_ID);
    await academicContentApi.getAcademicContentReadiness(CONTENT_ID);

    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(1, "/academics/academic-content", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        status: "DRAFT",
        search: "fractions",
        page: 2,
        limit: 25,
      },
    });
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      2,
      `/academics/academic-content/${ENCODED_CONTENT_ID}`,
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      3,
      `/academics/academic-content/${ENCODED_CONTENT_ID}/readiness`,
    );
  });

  it("creates content and limits metadata updates to mutable fields", async () => {
    await academicContentApi.createAcademicContent({
      academicYearId: "year-1",
      termId: "term-1",
      type: "WEEKLY_PLAN",
      audience: "STUDENTS",
      title: "Fractions",
      description: null,
    });
    await academicContentApi.updateAcademicContent(CONTENT_ID, {
      title: "Fractions week",
      description: "Practice plan",
      audience: "STUDENTS_AND_GUARDIANS",
    });

    expect(apiMocks.apiPost).toHaveBeenCalledWith("/academics/academic-content", {
      academicYearId: "year-1",
      termId: "term-1",
      type: "WEEKLY_PLAN",
      audience: "STUDENTS",
      title: "Fractions",
      description: null,
    });
    expect(apiMocks.apiPatch).toHaveBeenCalledWith(
      `/academics/academic-content/${ENCODED_CONTENT_ID}`,
      {
        title: "Fractions week",
        description: "Practice plan",
        audience: "STUDENTS_AND_GUARDIANS",
      },
    );
  });

  it("replaces the complete target set", async () => {
    await academicContentApi.replaceAcademicContentTargets(CONTENT_ID, [
      { scopeType: "GRADE", gradeId: "grade-1", subjectId: "subject-1" },
    ]);

    const contentPath = `/academics/academic-content/${ENCODED_CONTENT_ID}`;
    expect(apiMocks.apiPut).toHaveBeenCalledWith(`${contentPath}/targets`, {
      targets: [{ scopeType: "GRADE", gradeId: "grade-1", subjectId: "subject-1" }],
    });
  });

  it.each([
    {
      scenario: "teacher preparation",
      suffix: "preparation",
      request: {
        objectives: [],
        learningOutcomes: [],
        teachingStrategies: [],
        activities: [],
      },
      invoke: () =>
        academicContentApi.replacePreparationDetail(CONTENT_ID, {
          objectives: [],
          learningOutcomes: [],
          teachingStrategies: [],
          activities: [],
        }),
    },
    {
      scenario: "weekly plan",
      suffix: "weekly-plan",
      request: {
        weekStartDate: "2026-09-27",
        weekEndDate: "2026-10-01",
        objectives: [],
        topics: [],
        homeworkAssignmentIds: [],
        gradeAssessmentIds: [],
      },
      invoke: () =>
        academicContentApi.replaceWeeklyPlanDetail(CONTENT_ID, {
          weekStartDate: "2026-09-27",
          weekEndDate: "2026-10-01",
          objectives: [],
          topics: [],
          homeworkAssignmentIds: [],
          gradeAssessmentIds: [],
        }),
    },
    {
      scenario: "guardian note",
      suffix: "guardian-note",
      request: {
        body: "Bring the workbook",
        priority: "NORMAL" as const,
        requiresAcknowledgement: false,
      },
      invoke: () =>
        academicContentApi.replaceGuardianNoteDetail(CONTENT_ID, {
          body: "Bring the workbook",
          priority: "NORMAL",
          requiresAcknowledgement: false,
        }),
    },
    {
      scenario: "subject resource",
      suffix: "subject-resource",
      request: { resourceCategory: "WORKSHEET" as const },
      invoke: () =>
        academicContentApi.replaceSubjectResourceDetail(CONTENT_ID, {
          resourceCategory: "WORKSHEET",
        }),
    },
    {
      scenario: "online session",
      suffix: "online-session",
      request: {
        platform: "GOOGLE_MEET" as const,
        joinUrl: "https://meet.google.com/example",
        startAt: "2026-09-30T08:00:00.000Z",
        endAt: "2026-09-30T09:00:00.000Z",
        timezone: "Africa/Cairo",
      },
      invoke: () =>
        academicContentApi.replaceOnlineSessionDetail(CONTENT_ID, {
          platform: "GOOGLE_MEET",
          joinUrl: "https://meet.google.com/example",
          startAt: "2026-09-30T08:00:00.000Z",
          endAt: "2026-09-30T09:00:00.000Z",
          timezone: "Africa/Cairo",
        }),
    },
  ])("writes $scenario detail to its exact endpoint", async ({ suffix, request, invoke }) => {
    await invoke();

    expect(apiMocks.apiPut).toHaveBeenCalledWith(
      `/academics/academic-content/${ENCODED_CONTENT_ID}/details/${suffix}`,
      request,
    );
  });

  it("replaces ordered links and tags", async () => {
    await academicContentApi.replaceAcademicContentLinks(CONTENT_ID, [
      { label: "Class notes", url: "https://example.com/notes" },
    ]);
    await academicContentApi.replaceAcademicContentTags(CONTENT_ID, [
      { value: "fractions" },
    ]);

    const contentPath = `/academics/academic-content/${ENCODED_CONTENT_ID}`;
    expect(apiMocks.apiPut).toHaveBeenNthCalledWith(1, `${contentPath}/links`, {
      links: [{ label: "Class notes", url: "https://example.com/notes" }],
    });
    expect(apiMocks.apiPut).toHaveBeenNthCalledWith(2, `${contentPath}/tags`, {
      tags: [{ value: "fractions" }],
    });
  });

  it("creates, completes, cancels uploads and unlinks assets", async () => {
    await academicContentApi.createAcademicContentUpload(CONTENT_ID, {
      clientRequestId: "request-1",
      originalName: "lesson.pdf",
      expectedMimeType: "application/pdf",
      expectedSizeBytes: "1024",
    });
    await academicContentApi.completeAcademicContentUpload(CONTENT_ID, UPLOAD_ID);
    await academicContentApi.cancelAcademicContentUpload(CONTENT_ID, UPLOAD_ID);
    await academicContentApi.unlinkAcademicContentAsset(CONTENT_ID, ASSET_ID);

    const contentPath = `/academics/academic-content/${ENCODED_CONTENT_ID}`;
    const uploadPath = `${contentPath}/uploads/${encodeURIComponent(UPLOAD_ID)}`;
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(1, `${contentPath}/uploads`, {
      clientRequestId: "request-1",
      originalName: "lesson.pdf",
      expectedMimeType: "application/pdf",
      expectedSizeBytes: "1024",
    });
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(2, `${uploadPath}/complete`);
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(3, `${uploadPath}/cancel`);
    expect(apiMocks.apiDelete).toHaveBeenCalledWith(
      `${contentPath}/assets/${encodeURIComponent(ASSET_ID)}`,
    );
  });

  it("reads revision history with pagination and immutable detail", async () => {
    await academicContentApi.listAcademicContentRevisions(CONTENT_ID, {
      page: 2,
      limit: 10,
    });
    await academicContentApi.getAcademicContentRevision(CONTENT_ID, REVISION_ID);

    const revisionsPath =
      `/academics/academic-content/${ENCODED_CONTENT_ID}/revisions`;
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(1, revisionsPath, {
      params: { page: 2, limit: 10 },
    });
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      2,
      `${revisionsPath}/${encodeURIComponent(REVISION_ID)}`,
    );
  });

  it("archives, restores, and deletes only the supported lifecycle states", async () => {
    await academicContentApi.archiveAcademicContent(CONTENT_ID);
    await academicContentApi.restoreAcademicContent(CONTENT_ID);
    await academicContentApi.deleteAcademicContent(CONTENT_ID);

    const contentPath = `/academics/academic-content/${ENCODED_CONTENT_ID}`;
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(1, `${contentPath}/archive`);
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(2, `${contentPath}/restore`);
    expect(apiMocks.apiDelete).toHaveBeenCalledWith(contentPath);
  });

  it("uses the exact publication management endpoints", async () => {
    const request = {
      clientRequestId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      publishAt: "2026-10-06T08:00:00.000Z",
      visibleFrom: "2026-10-06T09:00:00.000Z",
      visibleUntil: "2026-10-07T09:00:00.000Z",
    };

    await academicContentApi.getAcademicContentPublicationReadiness(CONTENT_ID);
    await academicContentApi.getAcademicContentAudiencePreview(CONTENT_ID);
    await academicContentApi.createAcademicContentPublication(CONTENT_ID, request);
    await academicContentApi.listAcademicContentPublications(CONTENT_ID, {
      page: 2,
      limit: 20,
    });
    await academicContentApi.getAcademicContentPublication(
      CONTENT_ID,
      PUBLICATION_ID,
    );
    await academicContentApi.unscheduleAcademicContentPublication(
      CONTENT_ID,
      PUBLICATION_ID,
    );
    await academicContentApi.cancelAcademicContentPublication(
      CONTENT_ID,
      PUBLICATION_ID,
    );
    await academicContentApi.startAcademicContentPublicationRevision(
      CONTENT_ID,
      PUBLICATION_ID,
    );

    const base = `/academics/academic-content/${ENCODED_CONTENT_ID}`;
    const publicationPath = `${base}/publications/${encodeURIComponent(PUBLICATION_ID)}`;
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      1,
      `${base}/publication-readiness`,
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(2, `${base}/audience-preview`);
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      1,
      `${base}/publications`,
      request,
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(3, `${base}/publications`, {
      params: { page: 2, limit: 20 },
    });
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(4, publicationPath);
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      2,
      `${publicationPath}/unschedule`,
      {},
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      3,
      `${publicationPath}/cancel`,
      {},
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      4,
      `${publicationPath}/revise`,
      {},
    );
  });

  it("gets and updates the file policy through the settings endpoint", async () => {
    await academicContentApi.getAcademicContentFilePolicy();
    await academicContentApi.updateAcademicContentFilePolicy({
      maximumFileSizeBytes: "536870912",
      archivesEnabled: true,
    });

    const policyPath = "/academics/academic-content/settings/file-policy";
    expect(apiMocks.apiGet).toHaveBeenCalledWith(policyPath);
    expect(apiMocks.apiPatch).toHaveBeenCalledWith(policyPath, {
      maximumFileSizeBytes: "536870912",
      archivesEnabled: true,
    });
  });

  it("gets and updates the preparation approval policy", async () => {
    await academicContentApi.getAcademicContentWorkflowPolicy();
    await academicContentApi.updateAcademicContentWorkflowPolicy({
      preparationApprovalRequired: true,
    });

    const policyPath = "/academics/academic-content/settings/workflow-policy";
    expect(apiMocks.apiGet).toHaveBeenCalledWith(policyPath);
    expect(apiMocks.apiPatch).toHaveBeenCalledWith(policyPath, {
      preparationApprovalRequired: true,
    });
  });

  it.each([
    {
      action: "submits",
      suffix: "submit",
      invoke: () => academicContentApi.submitAcademicContent(CONTENT_ID),
    },
    {
      action: "approves",
      suffix: "approve",
      invoke: () => academicContentApi.approveAcademicContent(CONTENT_ID),
    },
  ])("$action the current preparation round with an empty body", async ({
    suffix,
    invoke,
  }) => {
    await invoke();

    const contentPath = `/academics/academic-content/${ENCODED_CONTENT_ID}`;
    expect(apiMocks.apiPost).toHaveBeenCalledWith(`${contentPath}/${suffix}`, {});
  });

  it("trims the request-changes decision note", async () => {
    await academicContentApi.requestAcademicContentChanges(
      CONTENT_ID,
      "  Clarify assessment criteria  ",
    );

    const contentPath = `/academics/academic-content/${ENCODED_CONTENT_ID}`;
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      `${contentPath}/request-changes`,
      { note: "Clarify assessment criteria" },
    );
  });

  it("lists the review queue and approval history with non-empty filters", async () => {
    await academicContentApi.listAcademicContentReviewQueue({
      academicYearId: "year-1",
      termId: "term-1",
      stageId: "stage-1",
      gradeId: "grade-1",
      sectionId: "section-1",
      classroomId: "classroom-1",
      subjectId: "subject-1",
      teacherUserId: "teacher-1",
      search: "fractions",
      page: 2,
      limit: 25,
    });
    await academicContentApi.listAcademicContentApprovalHistory(CONTENT_ID, {
      page: 2,
      limit: 10,
    });

    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      1,
      "/academics/academic-content/review-queue",
      {
        params: {
          academicYearId: "year-1",
          termId: "term-1",
          stageId: "stage-1",
          gradeId: "grade-1",
          sectionId: "section-1",
          classroomId: "classroom-1",
          subjectId: "subject-1",
          teacherUserId: "teacher-1",
          search: "fractions",
          page: 2,
          limit: 25,
        },
      },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      2,
      `/academics/academic-content/${ENCODED_CONTENT_ID}/approvals`,
      { params: { page: 2, limit: 10 } },
    );
  });

  it("uses the preparation template CRUD endpoints", async () => {
    const templateRequest = {
      name: "Daily preparation",
      description: null,
      stageId: "stage-1",
      subjectId: "subject-1",
      topic: "Fractions",
      objectives: ["Compare fractions"],
      learningOutcomes: [],
      teachingStrategies: [],
      activities: [],
      resourceNotes: null,
      assessmentNotes: null,
      teacherNotes: null,
    };

    await academicContentApi.listAcademicContentPreparationTemplates({
      stageId: "stage-1",
      subjectId: "",
      search: "daily",
      page: 1,
      limit: 50,
    });
    await academicContentApi.getAcademicContentPreparationTemplate(TEMPLATE_ID);
    await academicContentApi.createAcademicContentPreparationTemplate(templateRequest);
    await academicContentApi.updateAcademicContentPreparationTemplate(TEMPLATE_ID, {
      name: "Updated preparation",
    });
    await academicContentApi.deleteAcademicContentPreparationTemplate(TEMPLATE_ID);

    const templatesPath = "/academics/academic-content/templates/preparation";
    const templatePath = `${templatesPath}/${encodeURIComponent(TEMPLATE_ID)}`;
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(1, templatesPath, {
      params: { stageId: "stage-1", search: "daily", page: 1, limit: 50 },
    });
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(2, templatePath);
    expect(apiMocks.apiPost).toHaveBeenCalledWith(templatesPath, templateRequest);
    expect(apiMocks.apiPatch).toHaveBeenCalledWith(templatePath, {
      name: "Updated preparation",
    });
    expect(apiMocks.apiDelete).toHaveBeenCalledWith(templatePath);
  });
});
