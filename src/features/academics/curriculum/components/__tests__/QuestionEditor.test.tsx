import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
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

function EditorForm({ field, initialRequired, isReadOnly = false, initialImageUrl = "" }: {
  field: "isRequired" | "required";
  initialRequired?: boolean;
  isReadOnly?: boolean;
  initialImageUrl?: string;
}) {
  const [draft, setDraft] = useState<QuestionEditorQuestion>({ ...question, [field]: initialRequired, mediaUrl: initialImageUrl });
  return (
    <>
      <QuestionEditor
        question={draft}
        onChange={(updates) => setDraft((current) => ({ ...current, ...updates }))}
        isReadOnly={isReadOnly}
        showHomeworkFields={field === "isRequired"}
        allowQuestionImages={field === "required"}
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


describe("assessment question image links", () => {
  it("keeps an image while editing the prompt and clears it on removal", async () => {
    const user = userEvent.setup();
    render(<EditorForm field="required" />);
    const imageUrl = "https://school.example/questions/triangle.png";
    await user.type(screen.getByRole("textbox", { name: "question_image_url" }), imageUrl);
    await user.click(screen.getByRole("button", { name: "preview_image" }));
    expect(screen.getByRole("img", { name: "question_image" })).toHaveAttribute("src", imageUrl);
    await user.type(screen.getByRole("textbox", { name: /question_text/ }), " updated");
    expect(JSON.parse(screen.getByLabelText("question draft").textContent!).mediaUrl).toBe(imageUrl);
    await user.click(screen.getByRole("button", { name: "remove_image" }));
    expect(JSON.parse(screen.getByLabelText("question draft").textContent!).mediaUrl).toBe("");
    expect(screen.queryByRole("img", { name: "question_image" })).not.toBeInTheDocument();
  });

  it("shows saved images in read-only mode and explains a broken image", () => {
    render(<EditorForm field="required" isReadOnly initialImageUrl="https://school.example/question.png" />);
    expect(screen.getByRole("textbox", { name: "question_image_url" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "remove_image" })).not.toBeInTheDocument();
    fireEvent.error(screen.getByRole("img", { name: "question_image" }));
    expect(screen.getByText("image_load_failed")).toBeInTheDocument();
  });

  it("keeps the image field out of homework", () => {
    render(<EditorForm field="isRequired" />);
    expect(screen.queryByRole("textbox", { name: "question_image_url" })).not.toBeInTheDocument();
  });
});
