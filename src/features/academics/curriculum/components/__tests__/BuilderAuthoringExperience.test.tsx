import { useState, type ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import Input from "@/components/ui/input/Input";
import type { AssignmentQuestion } from "../../services/curriculumService";
import BuilderSettingsSidebar from "../BuilderSettingsSidebar";
import BuilderSaveStatus from "../BuilderSaveStatus";
import QuestionOutlineItem from "../QuestionOutlineItem";
import QuestionValidationSummary from "../QuestionValidationSummary";

vi.unmock("next-intl");

const question: AssignmentQuestion = {
  id: "question-1", assignmentId: "assignment-1", questionTextAr: "اشرح الفكرة",
  questionTextEn: "Explain the idea", questionType: "ESSAY", points: 2, order: 1, createdAt: "",
};

function Localized({ children, locale = "en" }: { children: ReactNode; locale?: "en" | "ar" }) {
  return <NextIntlClientProvider locale={locale} messages={locale === "ar" ? ar : en} timeZone="Africa/Cairo">{children}</NextIntlClientProvider>;
}

describe("builder authoring experience", () => {
  it.each(["en", "ar"] as const)("preserves settings input when collapsed and exposes errors in %s", async locale => {
    const user = userEvent.setup();
    const labels = (locale === "ar" ? ar : en).academics.curriculum.assignmentBuilder;
    render(<Localized locale={locale}><BuilderSettingsSidebar validationErrors={{ maxScore: "Enter a score" }}><Input label="Score" defaultValue="20" /></BuilderSettingsSidebar></Localized>);

    await user.click(screen.getByRole("button", { name: labels.showSettings }));
    await user.type(screen.getByRole("textbox", { name: "Score" }), "5");
    await user.click(screen.getByRole("button", { name: labels.hideSettings }));
    expect(screen.queryByRole("textbox", { name: "Score" })).not.toBeInTheDocument();
    expect(screen.getByText(labels.settingsNeedAttention, { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.showSettings })).toHaveAttribute("aria-expanded", "false");
    await user.click(screen.getByRole("button", { name: labels.showSettings }));
    expect(screen.getByRole("textbox", { name: "Score" })).toHaveValue("205");
  });

  it("keeps unsaved question changes visible while settings are saving and after they finish", () => {
    const { rerender } = render(<Localized><BuilderSaveStatus isSettingsDirty isSettingsSaving isQuestionDirty isQuestionSaving={false} /></Localized>);
    expect(screen.getByRole("status")).toHaveTextContent("Saving settings");
    expect(screen.getByRole("status")).toHaveTextContent("Question has unsaved changes");

    rerender(<Localized><BuilderSaveStatus isSettingsDirty={false} isSettingsSaving={false} isQuestionDirty isQuestionSaving={false} /></Localized>);
    expect(screen.getByRole("status")).toHaveTextContent("Settings saved");
    expect(screen.getByRole("status")).toHaveTextContent("Question has unsaved changes");
  });

  it("selects the affected question from validation feedback without listing removed questions", async () => {
    const user = userEvent.setup();
    function ReviewQuestions() {
      const [selected, setSelected] = useState("question-1");
      return <><QuestionValidationSummary questions={[question, { ...question, id: "question-2" }]} validationErrors={{ questions: { "question-2": { correctAnswer: "Choose a correct answer" }, removed: { points: "Enter points" } } }} onSelectQuestion={setSelected} /><output aria-label="Selected question">{selected}</output></>;
    }
    render(<Localized><ReviewQuestions /></Localized>);

    expect(screen.getByText("1 question needs attention")).toBeInTheDocument();
    expect(screen.queryByText("Enter points", { exact: false })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Question 2: Choose a correct answer" }));
    expect(screen.getByLabelText("Selected question")).toHaveTextContent("question-2");
  });

  it("supports keyboard selection and deletion through the action menu", async () => {
    const user = userEvent.setup();
    function QuestionList() {
      const [selected, setSelected] = useState(false);
      const [deleted, setDeleted] = useState(false);
      return deleted ? <p>Question deleted</p> : <QuestionOutlineItem question={question} index={0} isSelected={selected} onSelect={() => setSelected(true)} onMoveUp={() => {}} onMoveDown={() => {}} onDelete={() => setDeleted(true)} canMoveUp={false} canMoveDown={false} isReadOnly={false} />;
    }
    render(<Localized><QuestionList /></Localized>);

    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { pressed: true })).toHaveTextContent("Explain the idea");
    await user.click(screen.getByRole("button", { name: "Actions for question 1" }));
    await user.click(within(screen.getByRole("menu")).getByRole("menuitem"));
    expect(screen.getByText("Question deleted")).toBeInTheDocument();
  });
});
