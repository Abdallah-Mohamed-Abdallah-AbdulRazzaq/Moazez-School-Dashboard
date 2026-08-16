import { describe, expect, it } from "vitest";
import {
  mapBackendHomeworkAssignmentToUi,
  mapBackendHomeworkQuestionToBuilder,
  mapBuilderQuestionToHomeworkCreatePayload,
  mapBuilderQuestionToHomeworkUpdatePayload,
  mapBackendHomeworkAttachmentToBuilder,
  mapBuilderAssignmentToHomeworkUpdate,
  mapHomeworkUiToBuilderAssignment,
} from "@/features/academics/homework/services/homeworkMappers";

describe("homeworkMappers", () => {
  it("maps backend assignment DTOs into homework UI models", () => {
    expect(
      mapBackendHomeworkAssignmentToUi({
        id: "homework-1",
        title: "Fractions practice",
        description: "Solve the attached worksheet",
        status: "PUBLISHED",
        mode: "WORKSHEET",
        targetMode: "CLASSROOM",
        dueAt: "2026-06-30T12:00:00.000Z",
        estimatedMinutes: 30,
        totalMarks: 25,
        isGraded: true,
        questionCount: 4,
        attachmentsCount: 1,
        classroom: {
          name: "Grade 5A",
          section: { name: "Section A" },
          grade: { name: "Grade 5" },
        },
        academicYear: { name: "2026-2027" },
        term: {
          name: "Term 1",
          startDate: "2026-08-01",
          endDate: "2026-12-31",
        },
        subject: { nameEn: "Math", code: "MATH", color: "#2563eb" },
        teacher: { userId: "teacher-1", fullName: "Sara Teacher" },
        timetableEntryId: "timetable-entry-1",
        scheduleDate: "2026-08-04",
        publishedAt: "2026-08-01T08:00:00.000Z",
        closedAt: "2026-08-31T08:00:00.000Z",
        counters: { totalTargets: 30, submitted: 20 },
      }),
    ).toEqual(
      expect.objectContaining({
        id: "homework-1",
        title: "Fractions practice",
        status: "published",
        mode: "worksheet",
        targetMode: "classroom",
        totalMarks: 25,
        classroomName: "Grade 5A",
        subjectName: "Math",
        teacherName: "Sara Teacher",
        teacherUserId: "teacher-1",
        timetableEntryId: "timetable-entry-1",
        scheduleDate: "2026-08-04",
        publishedAt: "2026-08-01T08:00:00.000Z",
        closedAt: "2026-08-31T08:00:00.000Z",
        attachmentCount: 1,
        classroomSectionName: "Section A",
        classroomGradeName: "Grade 5",
        academicYearName: "2026-2027",
        termName: "Term 1",
        termStartDate: "2026-08-01",
        termEndDate: "2026-12-31",
        subjectCode: "MATH",
        subjectColor: "#2563eb",
        counters: { totalTargets: 30, submitted: 20 },
      }),
    );
  });

  it("preserves archived assignments as a terminal frontend status", () => {
    expect(mapBackendHomeworkAssignmentToUi({
      id: "homework-archived",
      title: "Archived homework",
      status: "ARCHIVED",
    }).status).toBe("archived");
  });

  it("maps homework UI models to builder assignment models and back to update payloads", () => {
    const builder = mapHomeworkUiToBuilderAssignment({
      id: "homework-1",
      title: "Reading task",
      description: "Read chapter 2",
      mode: "reading",
      status: "draft",
      targetMode: "classroom",
      dueAt: "2026-07-01T10:00:00.000Z",
      estimatedMinutes: 15,
      totalMarks: 10,
      isGraded: true,
      questionCount: 0,
      attachmentCount: 0,
    });

    expect(builder).toEqual(
      expect.objectContaining({
        id: "homework-1",
        lessonId: "homework",
        titleAr: "Reading task",
        titleEn: "Reading task",
        dueDate: "2026-07-01T10:00:00.000Z",
        maxScore: 10,
        expectedTimeMinutes: 15,
        isPublished: false,
      }),
    );

    expect(mapBuilderAssignmentToHomeworkUpdate(builder)).toEqual({
      title: "Reading task",
      description: "Read chapter 2",
      dueAt: "2026-07-01T10:00:00.000Z",
      totalMarks: 10,
      estimatedMinutes: 15,
    });
  });

  it("preserves nullable marks and classroom hierarchy identifiers", () => {
    const homework = mapBackendHomeworkAssignmentToUi({
      id: "homework-null-marks",
      title: "Ungraded practice",
      totalMarks: null,
      classroom: {
        id: "classroom-1",
        section: { id: "section-1" },
        grade: { id: "grade-1" },
      },
    });

    expect(homework).toEqual(expect.objectContaining({
      totalMarks: null,
      classroomSectionId: "section-1",
      classroomGradeId: "grade-1",
    }));

    const builder = mapHomeworkUiToBuilderAssignment(homework);
    expect(builder.maxScore).toBeNull();
    expect(mapBuilderAssignmentToHomeworkUpdate({
      ...builder,
      titleEn: "Updated title",
    })).toEqual(expect.objectContaining({
      title: "Updated title",
      totalMarks: null,
    }));
  });

  it("maps backend questions and options into the existing builder shape", () => {
    expect(
      mapBackendHomeworkQuestionToBuilder({
        questionId: "question-1",
        homeworkId: "homework-1",
        prompt: "Pick one",
        type: "single_choice",
        points: 5,
        sortOrder: 2,
        options: [
          {
            optionId: "option-1",
            questionId: "question-1",
            text: "Correct",
            isCorrect: true,
            sortOrder: 1,
          },
        ],
      }),
    ).toEqual(
      expect.objectContaining({
        id: "question-1",
        assignmentId: "homework-1",
        questionTextEn: "Pick one",
        questionTextAr: "Pick one",
        questionType: "MCQ_SINGLE",
        points: 5,
        order: 2,
        options: [
          {
            id: "option-1",
            textAr: "Correct",
            textEn: "Correct",
            isCorrect: true,
            order: 1,
          },
        ],
      }),
    );
  });

  it("preserves optional questions in create and update payloads", () => {
    const question = mapBackendHomeworkQuestionToBuilder({
      questionId: "question-optional",
      homeworkId: "homework-1",
      prompt: "Optional explanation",
      type: "short_text",
      points: 2,
      sortOrder: 0,
      isRequired: false,
      options: [],
      createdAt: "",
      updatedAt: "",
    });

    expect(question.isRequired).toBe(false);
    expect(mapBuilderQuestionToHomeworkCreatePayload(question).isRequired).toBe(false);
    expect(mapBuilderQuestionToHomeworkUpdatePayload(question).isRequired).toBe(false);
  });

  it("maps builder questions to backend create and update payloads", () => {
    const question = {
      id: "question-1",
      assignmentId: "homework-1",
      questionTextAr: "Pick one",
      questionTextEn: "Pick one",
      questionType: "MCQ_SINGLE" as const,
      points: 5,
      order: 2,
      options: [{ id: "option-1", textAr: "Correct", textEn: "Correct", isCorrect: true, order: 0 }],
      createdAt: "",
    };

    expect(mapBuilderQuestionToHomeworkCreatePayload(question)).toEqual({
      type: "SINGLE_CHOICE",
      prompt: "Pick one",
      points: 5,
      sortOrder: 2,
      isRequired: true,
      options: [{ text: "Correct", isCorrect: true, sortOrder: 0 }],
    });
    expect(mapBuilderQuestionToHomeworkUpdatePayload(question)).toEqual({
      type: "SINGLE_CHOICE",
      prompt: "Pick one",
      points: 5,
      isRequired: true,
    });
  });

  it("synthesizes true false options from the builder answer", () => {
    const payload = mapBuilderQuestionToHomeworkCreatePayload({
      id: "question-1", assignmentId: "homework-1", questionTextAr: "Valid?",
      questionTextEn: "Valid?", questionType: "TRUE_FALSE", correctAnswer: false,
      points: 1, order: 0, createdAt: "",
    });

    expect(payload.options).toEqual([
      { text: "True", isCorrect: false, sortOrder: 0 },
      { text: "False", isCorrect: true, sortOrder: 1 },
    ]);
  });

  it("restores the true false answer from backend options", () => {
    const mapped = mapBackendHomeworkQuestionToBuilder({
      questionId: "question-1", homeworkId: "homework-1", type: "true_false",
      prompt: "Valid?", points: 1, sortOrder: 0, isRequired: true,
      options: [
        { optionId: "true", questionId: "question-1", text: "True", isCorrect: false, sortOrder: 0 },
        { optionId: "false", questionId: "question-1", text: "False", isCorrect: true, sortOrder: 1 },
      ], createdAt: "", updatedAt: "",
    });

    expect(mapped.correctAnswer).toBe(false);
  });

  it("maps instructions and one expected answer to backend fields", () => {
    const payload = mapBuilderQuestionToHomeworkUpdatePayload({
      id: "question-1", assignmentId: "homework-1", questionTextAr: "Explain",
      questionTextEn: "Explain", questionType: "SHORT_ANSWER", points: 2,
      order: 0, instructions: "Show your work", expectedAnswer: "Because...", createdAt: "",
    });

    expect(payload).toEqual(expect.objectContaining({
      instructions: "Show your work",
      expectedAnswer: "Because...",
    }));
  });

  it("maps backend homework file attachments into downloadable builder items", () => {
    expect(mapBackendHomeworkAttachmentToBuilder({
      attachmentId: "attachment-1", homeworkId: "homework-1", fileId: "file-1",
      title: "Worksheet", description: null, sortOrder: 0,
      file: { filename: "worksheet.pdf", mimeType: "application/pdf", sizeBytes: "1200" },
      createdAt: "", updatedAt: "",
    })).toEqual(expect.objectContaining({
      id: "attachment-1", assignmentId: "homework-1", fileId: "file-1",
      type: "FILE", fileName: "worksheet.pdf", mimeType: "application/pdf",
      size: 1200, url: "/api/files/file-1/download",
    }));
  });
});
