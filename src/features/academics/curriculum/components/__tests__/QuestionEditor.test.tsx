import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import QuestionEditor, { type QuestionEditorQuestion } from "../QuestionEditor";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

const question: QuestionEditorQuestion = {
  id: "question-1", assignmentId: "assignment-1", questionTextAr: "اشرح",
  questionTextEn: "Explain", questionType: "ESSAY", points: 2, order: 1, createdAt: "",
};

function EditorForm({ field, initialRequired, isReadOnly = false }: {
  field: "isRequired" | "required";
  initialRequired?: boolean;
  isReadOnly?: boolean;
}) {
  const [draft, setDraft] = useState<QuestionEditorQuestion>({ ...question, [field]: initialRequired });
  return (
    <>
      <QuestionEditor
        question={draft}
        onChange={(updates) => setDraft((current) => ({ ...current, ...updates }))}
        isReadOnly={isReadOnly}
        showHomeworkFields={field === "isRequired"}
        requirementField={field === "required" ? "required" : undefined}
        detailsInputMode="single"
      />
      <output aria-label="question draft">{JSON.stringify(draft)}</output>
    </>
  );
}

describe("QuestionEditor required questions", () => {
  it.each(["isRequired", "required"] as const)("saves optional and required choices using %s", async (field) => {
    const user = userEvent.setup();
    render(<EditorForm field={field} />);
    const checkbox = screen.getByRole("checkbox", { name: "required_question" });
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(JSON.parse(screen.getByLabelText("question draft").textContent!)[field]).toBe(false);

    await user.type(screen.getByRole("textbox", { name: /question_text/ }), " updated");
    expect(checkbox).not.toBeChecked();
    expect(JSON.parse(screen.getByLabelText("question draft").textContent!)[field]).toBe(false);

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(JSON.parse(screen.getByLabelText("question draft").textContent!)[field]).toBe(true);
  });

  it.each(["isRequired", "required"] as const)("preserves a saved optional %s question in read-only mode", async (field) => {
    const user = userEvent.setup();
    render(<EditorForm field={field} initialRequired={false} isReadOnly />);
    const checkbox = screen.getByRole("checkbox", { name: "required_question" });
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toBeDisabled();
    await user.click(checkbox);
    expect(JSON.parse(screen.getByLabelText("question draft").textContent!)[field]).toBe(false);
  });
});
