"use client";

import { useRef, useState } from "react";
import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import { DEFAULT_NEW_QUESTION } from "@/features/academics/curriculum/libs/constants";
import type { HomeworkImport } from "@/features/academics/shared/excel-import/types";
import { HOMEWORK_DRAFT_LIMITS } from "../utils/homeworkQuestionDraft.types";

type HomeworkQuestionContent =
  | { kind: "none" }
  | { kind: "manual"; questions: AssignmentQuestion[]; selectedQuestionId: string | null }
  | { kind: "excel"; imported: HomeworkImport };

function newLocalQuestion(sequence: number): AssignmentQuestion {
  const id = `local-question-${sequence}`;
  return {
    ...DEFAULT_NEW_QUESTION, id, assignmentId: "local-draft", createdAt: "", order: sequence,
    questionTextAr: "", questionTextEn: "", isRequired: true,
    options: DEFAULT_NEW_QUESTION.options.map((option, index) => ({ ...option, id: `${id}-option-${index + 1}`, textAr: "", textEn: "" })),
  };
}

function updatedLocalQuestion(question: AssignmentQuestion, updates: Partial<AssignmentQuestion>): AssignmentQuestion {
  const next = { ...question, ...updates, id: question.id };
  if (next.questionType !== "TRUE_FALSE") next.correctAnswer = undefined;
  if (next.questionType !== "SHORT_ANSWER") next.expectedAnswer = undefined;
  if (next.questionType !== "MCQ_SINGLE" && next.questionType !== "MCQ_MULTI") next.options = [];
  else if (question.questionType !== next.questionType && !question.options?.length) {
    // The saved editor creates example choices on type change; new drafts need authored text.
    next.options = next.options?.map(option => ({ ...option, textAr: "", textEn: "" }));
  }
  return next;
}

export function useHomeworkCreateQuestions(request: { locked: boolean; onExcelAccepted: (imported: HomeworkImport) => void }) {
  const [content, setContent] = useState<HomeworkQuestionContent>({ kind: "none" });
  const [editorOpen, setOpen] = useState(false);
  const [pendingReplacement, setReplacement] = useState<HomeworkImport | "manual" | null>(null);
  const sequence = useRef(0);
  const hasQuestions = content.kind === "excel" ? content.imported.questions.length > 0 : content.kind === "manual" && content.questions.length > 0;

  function acceptExcel(imported: HomeworkImport) {
    setContent({ kind: "excel", imported }); setOpen(false);
    request.onExcelAccepted(imported);
  }
  function requestManualAuthoring() {
    if (request.locked) return;
    if (content.kind === "excel" && hasQuestions) { setReplacement("manual"); return; }
    if (content.kind !== "manual") setContent({ kind: "manual", questions: [], selectedQuestionId: null });
    setOpen(true);
  }
  function requestExcelImport(imported: HomeworkImport) {
    if (request.locked) return;
    if (hasQuestions) { setReplacement(imported); return; }
    acceptExcel(imported);
  }
  function acceptReplacement() {
    if (request.locked || !pendingReplacement) return;
    if (pendingReplacement === "manual") { setContent({ kind: "manual", questions: [], selectedQuestionId: null }); setOpen(true); }
    else acceptExcel(pendingReplacement);
    setReplacement(null);
  }
  function changeManual(transform: (current: Extract<HomeworkQuestionContent, { kind: "manual" }>) => Extract<HomeworkQuestionContent, { kind: "manual" }>) {
    if (request.locked) return;
    setContent(current => current.kind === "manual" ? transform(current) : current);
  }
  function addQuestion() {
    if (request.locked || content.kind !== "manual" || content.questions.length >= HOMEWORK_DRAFT_LIMITS.questions) return;
    const question = newLocalQuestion(++sequence.current);
    changeManual(current => current.questions.length >= HOMEWORK_DRAFT_LIMITS.questions ? current : { ...current, questions: [...current.questions, question], selectedQuestionId: question.id });
  }
  function deleteQuestion(id: string) {
    changeManual(current => {
      const questions = current.questions.filter(question => question.id !== id);
      return { ...current, questions, selectedQuestionId: current.selectedQuestionId === id ? questions[0]?.id ?? null : current.selectedQuestionId };
    });
  }
  function moveQuestion(id: string, direction: "up" | "down") {
    changeManual(current => {
      const index = current.questions.findIndex(question => question.id === id);
      const destination = index + (direction === "up" ? -1 : 1);
      if (index < 0 || destination < 0 || destination >= current.questions.length) return current;
      const questions = [...current.questions];
      [questions[index], questions[destination]] = [questions[destination], questions[index]];
      return { ...current, questions };
    });
  }
  return {
    content, editorOpen, pendingReplacement, requestManualAuthoring, requestExcelImport, acceptReplacement,
    cancelReplacement: () => setReplacement(null),
    setEditorOpen: (open: boolean) => { if (!request.locked) setOpen(open); },
    addQuestion, deleteQuestion, moveQuestion,
    selectQuestion: (id: string) => changeManual(current => ({ ...current, selectedQuestionId: id })),
    updateQuestion: (id: string, updates: Partial<AssignmentQuestion>) => changeManual(current => ({ ...current, questions: current.questions.map(question => question.id === id ? updatedLocalQuestion(question, updates) : question) })),
    // Only the page's explicit New/Remove action resets content after completed results.
    reset: () => { setContent({ kind: "none" }); setOpen(false); setReplacement(null); },
  };
}

export type HomeworkCreateQuestions = ReturnType<typeof useHomeworkCreateQuestions>;
