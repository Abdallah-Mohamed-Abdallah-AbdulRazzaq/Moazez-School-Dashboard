import type { Page } from "@playwright/test";
import type { BackendAssessmentResponse, BackendAssessmentQuestionResponse, BackendAssessmentQuestionsListResponse } from "../../src/features/grades/gradebook/types/api.types";
import { academicTree, expect, fulfillJson } from "./mock-session";

export async function mockGradesApi(page: Page) {
  let assessment: BackendAssessmentResponse = {
    id: "assessment-1", academicYearId: "year-2", termId: "term-2-1", subjectId: "subj-5",
    title: "Existing assessment", titleEn: "Existing assessment", titleAr: "اختبار", type: "QUIZ",
    deliveryMode: "QUESTION_BASED", scopeType: "school", maxScore: 20,
    date: "2026-10-01", weight: 15, approvalStatus: "draft", isLocked: false,
  };
  let questions: BackendAssessmentQuestionResponse[] = [{ id: "question-1", assessmentId: "assessment-1", prompt: "Existing question", promptAr: "سؤال", type: "MCQ_SINGLE", points: 20, sortOrder: 1, options: [
    { id: "option-1", label: "First answer", labelAr: "الأول", isCorrect: true, sortOrder: 0 },
    { id: "option-2", label: "Second answer", labelAr: "الثاني", isCorrect: false, sortOrder: 1 },
  ] }];
  let nextQuestionId = 2;
  await page.route("**/api/session/grades/**", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/api/session/grades", "");
    const method = request.method();
    if (method === "GET" && path === "/bootstrap") return fulfillJson(route, {
      ...academicTree, subjects: [{ id: "subj-5", nameEn: "Math", nameAr: "رياضيات" }],
      supportedScopes: ["school", "stage", "grade", "section", "classroom"], assessmentTypes: ["QUIZ", "EXAM"], deliveryModes: ["SCORE_ONLY", "QUESTION_BASED"],
    });
    if (method === "GET" && path === "/overview") return fulfillJson(route, {
      totals: { studentCount: 0, assessmentCount: 1 }, completion: { enteredCount: 0, missingCount: 0, absentCount: 0 },
      performance: { averagePercent: null, highestPercent: null, lowestPercent: null }, assessments: [], rule: null,
    });
    if (method === "GET" && path === "/gradebook") return fulfillJson(route, { columns: [], rows: [], summary: { studentCount: 0, assessmentCount: 0 } });
    if (method === "GET" && path === "/assessments") return fulfillJson(route, { items: [assessment], total: 1 });
    if (method === "POST" && ["/assessments", "/assessments/question-based"].includes(path)) {
      assessment = { ...assessment, ...request.postDataJSON() };
      questions = [];
      return fulfillJson(route, assessment, 201);
    }
    if (method === "GET" && path === "/assessments/assessment-1") return fulfillJson(route, assessment);
    if (path === "/assessments/assessment-1/questions") {
      if (method === "GET") return fulfillJson(route, {
        assessmentId: assessment.id, questions, totalQuestions: questions.length,
        totalPoints: questions.reduce((total, question) => total + (question.points ?? 0), 0),
        pointsMatchMaxScore: questions.reduce((total, question) => total + (question.points ?? 0), 0) === assessment.maxScore,
      } satisfies BackendAssessmentQuestionsListResponse);
      if (method === "POST") {
        const payload = request.postDataJSON() as Partial<BackendAssessmentQuestionResponse>;
        const questionId = `question-${nextQuestionId++}`;
        const question = { ...payload, id: questionId, assessmentId: "assessment-1", options: payload.options?.map((option, index) => ({ ...option, id: `${questionId}-option-${index}` })) };
        questions.push(question);
        return fulfillJson(route, question, 201);
      }
    }
    if (method === "POST" && path === "/assessments/assessment-1/questions/reorder") {
      const orderedIds = request.postDataJSON().questionIds as string[];
      expect(orderedIds).toHaveLength(questions.length);
      expect(orderedIds).toEqual(expect.arrayContaining(questions.map(question => question.id)));
      const questionsById = new Map(questions.map(question => [question.id, question]));
      questions = orderedIds.map((id, index) => ({ ...questionsById.get(id)!, sortOrder: index + 1 }));
      return fulfillJson(route, { questions });
    }
    const question = questions.find(candidate => path === `/questions/${candidate.id}`);
    if (question && method === "PATCH") {
      Object.assign(question, request.postDataJSON());
      return fulfillJson(route, question);
    }
    if (question && method === "DELETE") {
      questions = questions.filter(candidate => candidate !== question);
      return route.fulfill({ status: 204, body: "" });
    }
    return route.fallback();
  });
}
