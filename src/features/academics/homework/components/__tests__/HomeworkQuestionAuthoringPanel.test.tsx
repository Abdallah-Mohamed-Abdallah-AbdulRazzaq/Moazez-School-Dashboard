import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
vi.unmock("next-intl");
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import Button from "@/components/ui/button/Button";
import HomeworkQuestionAuthoringPanel from "../HomeworkQuestionAuthoringPanel";
import { useHomeworkCreateQuestions } from "../../hooks/useHomeworkCreateQuestions";

function AuthoringHost({ locked = false }: { locked?: boolean }) {
  const authoring = useHomeworkCreateQuestions({ locked, onExcelAccepted: () => {} });
  return <NextIntlClientProvider locale="en" messages={en}>
    <Button onClick={authoring.requestManualAuthoring}>Write</Button>
    {authoring.content.kind === "manual" && <HomeworkQuestionAuthoringPanel authoring={authoring} locked={locked} issues={[]} />}
  </NextIntlClientProvider>;
}

it("opens empty, authors blank questions, and keeps final edits across collapse and selection", () => {
  render(<AuthoringHost />);
  fireEvent.click(screen.getByRole("button", { name: "Write" }));
  expect(screen.queryByPlaceholderText(en.academics.curriculum.questions.question_text)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add question" }));
  const prompt = screen.getByPlaceholderText(en.academics.curriculum.questions.question_text);
  expect(prompt).toHaveValue("");
  fireEvent.change(prompt, { target: { value: "My local question" } });
  fireEvent.click(screen.getByRole("button", { name: "Hide questions" }));
  fireEvent.click(screen.getByRole("button", { name: "Show questions" }));
  expect(screen.getByPlaceholderText(en.academics.curriculum.questions.question_text)).toHaveValue("My local question");
  fireEvent.click(screen.getByRole("button", { name: "Add question" }));
  expect(screen.getByPlaceholderText(en.academics.curriculum.questions.question_text)).toHaveValue("");
  fireEvent.click(screen.getByRole("button", { name: /Question 1.*My local question/ }));
  expect(screen.getByPlaceholderText(en.academics.curriculum.questions.question_text)).toHaveValue("My local question");
  fireEvent.click(screen.getAllByRole("button", { name: "Move down" })[0]);
  expect(screen.getByRole("button", { name: /Question 2.*My local question/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Actions for question 1" }));
  fireEvent.click(screen.getByRole("menuitem", { name: en.academics.curriculum.questions.delete_question }));
  expect(screen.getByPlaceholderText(en.academics.curriculum.questions.question_text)).toHaveValue("My local question");
});

it("prevents opening or adding authoring content when creation is locked", () => {
  render(<AuthoringHost locked />);
  fireEvent.click(screen.getByRole("button", { name: "Write" }));
  expect(screen.queryByRole("button", { name: "Add question" })).not.toBeInTheDocument();
});

it("keeps new questions neutral and reveals validation after editing without losing instructions", () => {
  render(<AuthoringHost />);
  fireEvent.click(screen.getByRole("button", { name: "Write" }));
  fireEvent.click(screen.getByRole("button", { name: "Add question" }));
  expect(screen.queryByText(en.academics.curriculum.assignmentBuilder.needsAttention)).not.toBeInTheDocument();
  expect(screen.queryByText(en.validation.all_options_required)).not.toBeInTheDocument();
  const prompt = screen.getByPlaceholderText(en.academics.curriculum.questions.question_text);
  fireEvent.change(prompt, { target: { value: "Choose a number" } });
  fireEvent.blur(prompt);
  expect(screen.getByText(en.academics.curriculum.assignmentBuilder.needsAttention)).toBeInTheDocument();
  expect(screen.getAllByText(en.validation.all_options_required).length).toBeGreaterThan(0);
  const instructions = screen.getByLabelText("Instructions");
  fireEvent.change(instructions, { target: { value: "Explain your choice" } });
  fireEvent.click(screen.getByRole("button", { name: "Hide questions" }));
  fireEvent.click(screen.getByRole("button", { name: "Show questions" }));
  expect(screen.getByLabelText("Instructions")).toHaveValue("Explain your choice");
});
