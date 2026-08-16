import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { homeworkApiAdapter } from "@/features/academics/homework/services/homeworkApiAdapter";

vi.mock("@/lib/api", () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

const mockedApiDelete = vi.mocked(apiDelete);
const mockedApiGet = vi.mocked(apiGet);
const mockedApiPatch = vi.mocked(apiPatch);
const mockedApiPost = vi.mocked(apiPost);
const mockedApiPut = vi.mocked(apiPut);

describe("homeworkApiAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists assignments from the core homework endpoint with filters", async () => {
    mockedApiGet.mockResolvedValueOnce({
      items: [{ id: "homework-1", title: "HW", status: "draft" }],
      meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
    });

    await expect(
      homeworkApiAdapter.listAssignments({
        academicYearId: "year-1",
        termId: "term-1",
        status: "draft",
      }),
    ).resolves.toEqual({
      items: [expect.objectContaining({ id: "homework-1", title: "HW" })],
      meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
    });

    expect(mockedApiGet).toHaveBeenCalledWith("/homework/assignments", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        status: "draft",
      },
    });
  });

  it("uses backend homework id aliases for list row navigation", async () => {
    mockedApiGet.mockResolvedValueOnce({
      items: [
        {
          homeworkId: "homework-from-route",
          assignmentId: "legacy-assignment",
          title: "HW",
          status: "draft",
          classroomId: "classroom-1",
          subjectId: "subject-1",
        },
      ],
      meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
    });

    await expect(homeworkApiAdapter.listAssignments({})).resolves.toEqual({
      items: [
        expect.objectContaining({
          id: "homework-from-route",
          classroomId: "classroom-1",
          subjectId: "subject-1",
        }),
      ],
      meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
    });
  });

  it("creates assignments with the required homework payload", async () => {
    mockedApiPost.mockResolvedValueOnce({
      id: "homework-2",
      title: "New homework",
      status: "draft",
    });

    await homeworkApiAdapter.createAssignment({
      academicYearId: "year-1",
      termId: "term-1",
      teacherSubjectAllocationId: "allocation-1",
      title: "New homework",
      targetMode: "classroom",
      dueAt: "2026-06-30T12:00:00.000Z",
    });

    expect(mockedApiPost).toHaveBeenCalledWith("/homework/assignments", {
      academicYearId: "year-1",
      termId: "term-1",
      teacherSubjectAllocationId: "allocation-1",
      title: "New homework",
      targetMode: "classroom",
      dueAt: "2026-06-30T12:00:00.000Z",
      mode: "homework",
      isGraded: true,
    });
  });

  it("uses dedicated lifecycle endpoints", async () => {
    mockedApiPost.mockResolvedValue({ id: "homework-1", status: "published" });

    await homeworkApiAdapter.publishAssignment("homework-1");
    await homeworkApiAdapter.closeAssignment("homework-1");
    await homeworkApiAdapter.cancelAssignment("homework-1");

    expect(mockedApiPost).toHaveBeenNthCalledWith(
      1,
      "/homework/assignments/homework-1/publish",
    );
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      2,
      "/homework/assignments/homework-1/close",
    );
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      3,
      "/homework/assignments/homework-1/cancel",
    );
  });

  it("maps the assignment returned after resolving targets", async () => {
    mockedApiPost.mockResolvedValueOnce({
      id: "homework-1",
      title: "Resolved homework",
      status: "draft",
      attachmentsCount: 2,
    });

    await expect(
      homeworkApiAdapter.resolveTargets("homework-1"),
    ).resolves.toEqual(
      expect.objectContaining({
        id: "homework-1",
        title: "Resolved homework",
        attachmentCount: 2,
      }),
    );
  });

  it("wires question and attachment endpoints under the homework assignment", async () => {
    mockedApiGet.mockResolvedValueOnce({ items: [] });
    mockedApiPatch.mockResolvedValueOnce({ question: { questionId: "question-1", homeworkId: "homework-1", type: "short_text", prompt: "Q", points: 0, sortOrder: 2, isRequired: true, options: [], createdAt: "", updatedAt: "" } });
    mockedApiDelete.mockResolvedValueOnce(undefined);
    mockedApiPost.mockResolvedValueOnce({ attachment: {
      attachmentId: "attachment-1", homeworkId: "homework-1", fileId: "file-1",
      title: "Worksheet", description: null, sortOrder: 0,
      file: { filename: "worksheet.pdf", mimeType: "application/pdf", sizeBytes: "1200" },
      createdAt: "", updatedAt: "",
    } });

    await homeworkApiAdapter.listQuestions("homework-1");
    await homeworkApiAdapter.reorderQuestion("homework-1", "question-1", 2);
    await homeworkApiAdapter.deleteQuestion("homework-1", "question-1");
    await homeworkApiAdapter.createAttachment("homework-1", {
      fileId: "file-1",
      title: "Worksheet",
    });

    expect(mockedApiGet).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/questions",
    );
    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/questions/question-1/reorder",
      { sortOrder: 2 },
    );
    expect(mockedApiDelete).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/questions/question-1",
    );
    expect(mockedApiPost).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/attachments",
      { fileId: "file-1", title: "Worksheet" },
    );
  });

  it("preserves question and attachment 404 errors", async () => {
    mockedApiGet
      .mockRejectedValueOnce(new ApiError("Questions not found", 404, "not_found"))
      .mockRejectedValueOnce(new ApiError("Attachments not found", 404, "not_found"));

    await expect(homeworkApiAdapter.listQuestions("homework-1")).rejects.toThrow(
      "Questions not found",
    );
    await expect(homeworkApiAdapter.listAttachments("homework-1")).rejects.toThrow(
      "Attachments not found",
    );

    expect(mockedApiGet).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/questions",
    );
    expect(mockedApiGet).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/attachments",
    );
  });

  it("updates and reorders assignment attachments under the homework assignment", async () => {
    mockedApiPatch
      .mockResolvedValueOnce({
        attachment: {
          attachmentId: "attachment-1",
          homeworkId: "homework-1",
          fileId: "file-1",
          title: "Updated worksheet",
          description: "Read first",
          sortOrder: 0,
          file: {
            filename: "worksheet.pdf",
            mimeType: "application/pdf",
            sizeBytes: "1200",
          },
          createdAt: "",
          updatedAt: "",
        },
      })
      .mockResolvedValueOnce({
        attachment: {
          attachmentId: "attachment-1",
          homeworkId: "homework-1",
          fileId: "file-1",
          title: "Updated worksheet",
          description: "Read first",
          sortOrder: 2,
          file: {
            filename: "worksheet.pdf",
            mimeType: "application/pdf",
            sizeBytes: "1200",
          },
          createdAt: "",
          updatedAt: "",
        },
      });

    await expect(
      homeworkApiAdapter.updateAttachment("homework-1", "attachment-1", {
        title: "Updated worksheet",
        description: "Read first",
      }),
    ).resolves.toEqual(expect.objectContaining({ id: "attachment-1" }));
    await expect(
      homeworkApiAdapter.reorderAttachment("homework-1", "attachment-1", 2),
    ).resolves.toEqual(expect.objectContaining({ id: "attachment-1" }));

    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/attachments/attachment-1",
      { title: "Updated worksheet", description: "Read first" },
    );
    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/attachments/attachment-1/reorder",
      { sortOrder: 2 },
    );
  });

  it("unwraps question detail responses", async () => {
    mockedApiPost.mockResolvedValueOnce({
      question: { questionId: "question-1", homeworkId: "homework-1", type: "short_text", prompt: "Explain", points: 2, sortOrder: 0, isRequired: true, options: [], createdAt: "", updatedAt: "" },
    });

    await expect(homeworkApiAdapter.createQuestion("homework-1", {
      id: "temp-1", assignmentId: "homework-1", questionTextAr: "Explain",
      questionTextEn: "Explain", questionType: "SHORT_ANSWER", points: 2,
      order: 0, createdAt: "",
    })).resolves.toEqual(expect.objectContaining({ id: "question-1", questionType: "SHORT_ANSWER" }));
  });

  it("reconciles options through dedicated endpoints when updating a question", async () => {
    const backendQuestion = {
      questionId: "question-1", homeworkId: "homework-1", type: "single_choice",
      prompt: "Pick", points: 2, sortOrder: 0, isRequired: true, createdAt: "", updatedAt: "",
    };
    mockedApiGet.mockResolvedValueOnce({ question: { ...backendQuestion, options: [
      { optionId: "option-1", questionId: "question-1", text: "Old", isCorrect: true, sortOrder: 0 },
      { optionId: "option-removed", questionId: "question-1", text: "Remove", isCorrect: false, sortOrder: 1 },
    ] } }).mockResolvedValueOnce({ question: { ...backendQuestion, options: [] } });
    mockedApiPatch.mockResolvedValue({ question: { ...backendQuestion, options: [] } });
    mockedApiPost.mockResolvedValue({ question: { ...backendQuestion, options: [] } });

    await homeworkApiAdapter.updateQuestion("homework-1", "question-1", {
      id: "question-1", assignmentId: "homework-1", questionTextAr: "Pick",
      questionTextEn: "Pick", questionType: "MCQ_SINGLE", points: 2, order: 0,
      options: [
        { id: "option-1", textAr: "Updated", textEn: "Updated", isCorrect: true, order: 0 },
        { id: "temp-option-2", textAr: "New", textEn: "New", isCorrect: false, order: 1 },
      ], createdAt: "",
    });

    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/questions/question-1/options/option-1",
      { text: "Updated", isCorrect: true },
    );
    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/questions/question-1/options/option-1/reorder",
      { sortOrder: 0 },
    );
    expect(mockedApiPost).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/questions/question-1/options",
      { text: "New", isCorrect: false, sortOrder: 1 },
    );
    expect(mockedApiDelete).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/questions/question-1/options/option-removed",
    );
  });

  it("keeps option ordering on the dedicated reorder endpoint", async () => {
    mockedApiPatch.mockResolvedValueOnce({
      question: {
        questionId: "question-1",
        homeworkId: "homework-1",
        type: "single_choice",
        prompt: "Pick one",
        points: 1,
        sortOrder: 0,
        isRequired: true,
        options: [],
        createdAt: "",
        updatedAt: "",
      },
    });

    await homeworkApiAdapter.updateOption("homework-1", "question-1", {
      id: "option-1",
      textAr: "Updated",
      textEn: "Updated",
      isCorrect: true,
      order: 3,
    });

    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/questions/question-1/options/option-1",
      { text: "Updated", isCorrect: true },
    );
  });

  it("deletes stale hidden options when updating a true false question", async () => {
    const backendQuestion = {
      questionId: "question-1", homeworkId: "homework-1", type: "true_false",
      prompt: "Valid?", points: 1, sortOrder: 0, isRequired: true, createdAt: "", updatedAt: "",
      options: [
        { optionId: "true", questionId: "question-1", text: "True", isCorrect: true, sortOrder: 0 },
        { optionId: "false", questionId: "question-1", text: "False", isCorrect: false, sortOrder: 1 },
        { optionId: "stale", questionId: "question-1", text: "Maybe", isCorrect: false, sortOrder: 2 },
      ],
    };
    mockedApiGet.mockResolvedValueOnce({ question: backendQuestion })
      .mockResolvedValueOnce({ question: backendQuestion });
    mockedApiPatch.mockResolvedValue({ question: backendQuestion });

    await homeworkApiAdapter.updateQuestion("homework-1", "question-1", {
      id: "question-1", assignmentId: "homework-1", questionTextAr: "Valid?",
      questionTextEn: "Valid?", questionType: "TRUE_FALSE", correctAnswer: false,
      points: 1, order: 0, createdAt: "",
    });

    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/questions/question-1/options/true",
      { text: "True", isCorrect: false },
    );
    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/questions/question-1/options/false",
      { text: "False", isCorrect: true },
    );
    expect(mockedApiDelete).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/questions/question-1/options/stale",
    );
  });

  it("lists dashboard submissions from the core homework review surface", async () => {
    mockedApiGet.mockResolvedValueOnce({
      submissions: [
        {
          id: "submission-1",
          homeworkId: "homework-1",
          targetId: "target-1",
          student: {
            id: "student-1",
            displayName: "Student Name",
            studentNumber: "S-001",
          },
          status: "submitted",
          bodyText: "Submitted body",
          submittedAt: "2026-06-24T10:00:00.000Z",
          reviewedAt: null,
          reviewNote: null,
          awardedMarks: null,
          totalMarks: 20,
          isLate: false,
        },
      ],
      pagination: { page: 1, limit: 25, total: 1 },
    });

    await expect(
      homeworkApiAdapter.listSubmissions("homework-1", {
        status: "pending_review",
        search: " Student ",
        page: 1,
        limit: 25,
      }),
    ).resolves.toEqual({
      items: [
        expect.objectContaining({
          id: "submission-1",
          homeworkId: "homework-1",
          targetId: "target-1",
          studentId: "student-1",
          studentName: "Student Name",
          studentNumber: "S-001",
          status: "submitted",
          bodyText: "Submitted body",
          totalMarks: 20,
          isLate: false,
        }),
      ],
      pagination: { page: 1, limit: 25, total: 1 },
    });

    expect(mockedApiGet).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/submissions",
      {
        params: {
          status: "pending_review",
          search: "Student",
          page: 1,
          limit: 25,
        },
      },
    );
  });

  it("wires submission content review and grade sync endpoints under core homework", async () => {
    mockedApiGet
      .mockResolvedValueOnce({
        submission: {
          id: "submission-1",
          homeworkId: "homework-1",
          student: { id: "student-1", displayName: "Student Name" },
          status: "submitted",
          awardedMarks: 4,
          totalMarks: 5,
          reviewNote: "Good",
        },
      })
      .mockResolvedValueOnce({
        items: [{
          answerId: "answer-1",
          questionId: "question-1",
          type: "short_text",
          prompt: {
            questionId: "question-1",
            type: "short_text",
            prompt: "Explain",
            points: 5,
          },
          textAnswer: "Answer",
          selectedOptionIds: ["opt-1", "opt-2"],
          awardedPoints: 4,
          teacherComment: "Draft feedback",
        }, {
          answerId: "answer-2",
          questionId: "question-2",
          prompt: "Unreviewed",
          textAnswer: "Pending answer",
          awardedPoints: null,
        }],
      })
      .mockResolvedValueOnce({
        items: [{
          attachmentId: "submission-attachment-1",
          fileId: "submission/file-1",
          title: "Student work",
          file: {
            filename: "work.pdf",
            mimeType: "application/pdf",
            sizeBytes: "1024",
          },
        }],
      })
      .mockResolvedValueOnce({
        homeworkId: "homework-1",
        linked: true,
        gradeAssessment: { id: "assessment-1", title: "Assessment" },
        warnings: [],
      });
    mockedApiPatch.mockResolvedValueOnce({
      answer: {
        answerId: "answer-1",
        prompt: "Explain",
        answerText: "Answer",
        score: 5,
      },
    }).mockResolvedValueOnce({
      submission: {
        id: "submission-1",
        homeworkId: "homework-1",
        student: { id: "student-1", displayName: "Student Name" },
        status: "reviewed",
        awardedMarks: 5,
        totalMarks: 5,
        reviewNote: "Final note",
      },
    });
    mockedApiPut.mockResolvedValueOnce({
      items: [{
        answerId: "answer-1",
        prompt: "Explain",
        answerText: "Answer",
        score: 5,
      }],
    });
    mockedApiPost
      .mockResolvedValueOnce({ homeworkId: "homework-1", linked: true, warnings: [] })
      .mockResolvedValueOnce({ homeworkId: "homework-1", linked: true, warnings: [] })
      .mockResolvedValueOnce({ homeworkId: "homework-1", linked: true, warnings: [] });

    await expect(
      homeworkApiAdapter.getSubmission("homework-1", "submission-1"),
    ).resolves.toEqual(expect.objectContaining({
      id: "submission-1",
      studentName: "Student Name",
      awardedMarks: 4,
      totalMarks: 5,
      reviewNote: "Good",
    }));
    await expect(
      homeworkApiAdapter.listSubmissionAnswers("homework-1", "submission-1"),
    ).resolves.toEqual([
      expect.objectContaining({
        id: "answer-1",
        questionId: "question-1",
        prompt: "Explain",
        answerText: "Answer",
        score: 4,
        maxScore: 5,
        feedback: "Draft feedback",
        selectedOptionIds: ["opt-1", "opt-2"],
      }),
      expect.objectContaining({
        id: "answer-2",
        score: null,
      }),
    ]);
    await expect(
      homeworkApiAdapter.listSubmissionAttachments("homework-1", "submission-1"),
    ).resolves.toEqual([
      expect.objectContaining({
        id: "submission-attachment-1",
        fileId: "submission/file-1",
        url: "/api/files/submission%2Ffile-1/download",
      }),
    ]);
    await homeworkApiAdapter.reviewSubmissionAnswer(
      "homework-1",
      "submission-1",
      "answer-1",
      { score: 5, feedback: "Good answer" },
    );
    await expect(
      homeworkApiAdapter.reviewSubmission("homework-1", "submission-1", {
        awardedMarks: 5,
        reviewNote: " Final note ",
      }),
    ).resolves.toEqual(expect.objectContaining({
      id: "submission-1",
      status: "reviewed",
      awardedMarks: 5,
      reviewNote: "Final note",
    }));
    await homeworkApiAdapter.bulkReviewSubmissionAnswers(
      "homework-1",
      "submission-1",
      { answers: [{ answerId: "answer-1", score: 5 }] },
    );
    await homeworkApiAdapter.getGradeSyncStatus("homework-1");
    await homeworkApiAdapter.linkGradeSync("homework-1", "assessment-1");
    await homeworkApiAdapter.syncHomeworkGrades("homework-1");
    await homeworkApiAdapter.syncSubmissionGrade("homework-1", "submission-1");

    expect(mockedApiGet).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/submissions/submission-1",
    );
    expect(mockedApiGet).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/submissions/submission-1/answers",
    );
    expect(mockedApiGet).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/submissions/submission-1/attachments",
    );
    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/submissions/submission-1/answers/answer-1/review",
      { awardedPoints: 5, teacherComment: "Good answer" },
    );
    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/submissions/submission-1/review",
      { awardedMarks: 5, reviewNote: "Final note" },
    );
    expect(mockedApiPut).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/submissions/submission-1/answers/review",
      { answers: [{ answerId: "answer-1", awardedPoints: 5, teacherComment: undefined }] },
    );
    expect(mockedApiGet).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/grade-sync",
    );
    expect(mockedApiPost).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/grade-sync/link",
      { gradeAssessmentId: "assessment-1" },
    );
    expect(mockedApiPost).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/grade-sync",
    );
    expect(mockedApiPost).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/submissions/submission-1/grade-sync",
    );
  });

  it("maps pending grade sync submissions without relabeling them as skipped", async () => {
    mockedApiGet.mockResolvedValueOnce({
      homeworkId: "homework-1",
      linked: true,
      syncSummary: {
        totalReviewedSubmissions: 5,
        syncedSubmissions: 2,
        pendingSyncSubmissions: 3,
        failedSyncSubmissions: 0,
        lastSyncedAt: null,
      },
      warnings: [],
    });

    const status = await homeworkApiAdapter.getGradeSyncStatus("homework-1");

    expect(status.syncSummary).toEqual({
      total: 5,
      synced: 2,
      pending: 3,
      failed: 0,
      lastSyncedAt: null,
    });
    expect(status.syncSummary).not.toHaveProperty("skipped");
  });

  it("gets one submission answer from the backend detail endpoint", async () => {
    mockedApiGet.mockResolvedValueOnce({
      answer: {
        answerId: "answer-1",
        questionId: "question-1",
        prompt: {
          questionId: "question-1",
          type: "short_text",
          prompt: "Explain",
          points: 5,
        },
        textAnswer: "Answer",
      },
    });

    await expect(
      homeworkApiAdapter.getSubmissionAnswer(
        "homework-1",
        "submission-1",
        "answer-1",
      ),
    ).resolves.toEqual(expect.objectContaining({ id: "answer-1", prompt: "Explain" }));

    expect(mockedApiGet).toHaveBeenCalledWith(
      "/homework/assignments/homework-1/submissions/submission-1/answers/answer-1",
    );
  });
});
