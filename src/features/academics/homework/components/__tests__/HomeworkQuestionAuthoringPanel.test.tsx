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
  fireEvent.click(screen.getAllByRole("button", { name: en.academics.curriculum.questions.delete_question })[0]);
  expect(screen.getByPlaceholderText(en.academics.curriculum.questions.question_text)).toHaveValue("My local question");
});

it("prevents opening or adding authoring content when creation is locked", () => {
  render(<AuthoringHost locked />);
  fireEvent.click(screen.getByRole("button", { name: "Write" }));
  expect(screen.queryByRole("button", { name: "Add question" })).not.toBeInTheDocument();
});
